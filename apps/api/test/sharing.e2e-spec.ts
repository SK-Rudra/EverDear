import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  mkdtemp,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';

import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Private letter sharing (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testStorageRoot: string;

  const originalDatabaseUrl =
    process.env.DATABASE_URL;

  const originalMediaStorageRoot =
    process.env.MEDIA_STORAGE_ROOT;

  const ownerEmail =
    'sharing-owner@everdear.test';

  const outsiderEmail =
    'sharing-outsider@everdear.test';

  const testPassword =
    'A secure EverDear sharing passphrase 2026!';

  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );

  beforeAll(async () => {
    const testDatabaseUrl =
      process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is not configured',
      );
    }

    testStorageRoot = await mkdtemp(
      join(tmpdir(), 'everdear-sharing-e2e-'),
    );

    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.MEDIA_STORAGE_ROOT =
      testStorageRoot;

    const { AppModule } = await import(
      '../src/app.module.js'
    );

    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    configureApp(app, app.get(ConfigService));

    await app.init();

    prisma = app.get(PrismaService);

    await prisma.user.deleteMany({
      where: {
        email: {
          in: [ownerEmail, outsiderEmail],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [ownerEmail, outsiderEmail],
        },
      },
    });

    await app.close();

    await rm(testStorageRoot, {
      recursive: true,
      force: true,
    });

    if (originalDatabaseUrl) {
      process.env.DATABASE_URL =
        originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }

    if (originalMediaStorageRoot) {
      process.env.MEDIA_STORAGE_ROOT =
        originalMediaStorageRoot;
    } else {
      delete process.env.MEDIA_STORAGE_ROOT;
    }
  });

  it('publishes, tracks, regenerates, revokes, and expires links', async () => {
    const ownerAgent = request.agent(
      app.getHttpServer(),
    );

    const outsiderAgent = request.agent(
      app.getHttpServer(),
    );

    await ownerAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'Sharing Owner',
        email: ownerEmail,
        password: testPassword,
      })
      .expect(201);

    await outsiderAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'Sharing Outsider',
        email: outsiderEmail,
        password: testPassword,
      })
      .expect(201);

    const emptyLetterResponse =
      await ownerAgent
        .post('/api/v1/letters')
        .send({
          type: 'LOVED',
          recipientName: 'Avery',
          senderName: 'Riley',
        })
        .expect(201);

    await ownerAgent
      .post(
        `/api/v1/letters/${emptyLetterResponse.body.id}/share`,
      )
      .send({})
      .expect(400);

    const createLetterResponse =
      await ownerAgent
        .post('/api/v1/letters')
        .send({
          type: 'LOVED',
          recipientName: 'Avery',
          senderName: 'Riley',
          title: 'For every quiet tomorrow',
          content: {
            body: 'Dear Avery,\n\nThese words were saved especially for you.',
          },
        })
        .expect(201);

    const letterId =
      createLetterResponse.body.id;

    const sharePath =
      `/api/v1/letters/${letterId}/share`;

    const attachmentUploadResponse =
      await ownerAgent
        .post(
          `/api/v1/letters/${letterId}/attachments`,
        )
        .attach('file', onePixelPng, {
          filename: 'shared-memory.png',
          contentType: 'image/png',
        })
        .expect(201);

    const attachmentId =
      attachmentUploadResponse.body.id;

    await request(app.getHttpServer())
      .post(sharePath)
      .send({})
      .expect(401);

    await outsiderAgent
      .post(sharePath)
      .send({})
      .expect(404);

    await ownerAgent
      .post(sharePath)
      .send({
        expiresAt: new Date(
          Date.now() + 60 * 1000,
        ).toISOString(),
      })
      .expect(400);

    const firstShareResponse =
      await ownerAgent
        .post(sharePath)
        .send({})
        .expect(201);

    expect(firstShareResponse.body).toMatchObject({
      letterId,
      letterStatus: 'PUBLISHED',
      accessCount: 0,
      expiresAt: null,
      revokedAt: null,
    });

    const firstToken =
      firstShareResponse.body.token;

    expect(firstToken).toMatch(
      /^[a-zA-Z0-9_-]{43}$/,
    );

    expect(
      firstShareResponse.body.tokenPrefix,
    ).toBe(firstToken.slice(0, 12));

    const storedLink =
      await prisma.letterLink.findUnique({
        where: {
          letterId,
        },
        select: {
          tokenHash: true,
          tokenPrefix: true,
        },
      });

    expect(storedLink).not.toBeNull();
    expect(storedLink!.tokenHash).toMatch(
      /^[a-f0-9]{64}$/,
    );
    expect(storedLink!.tokenHash).not.toBe(
      firstToken,
    );
    expect(storedLink!.tokenPrefix).toBe(
      firstToken.slice(0, 12),
    );

    await ownerAgent
      .patch(`/api/v1/letters/${letterId}`)
      .send({
        title: 'Must remain immutable',
      })
      .expect(409);

    await outsiderAgent
      .get(sharePath)
      .expect(404);

    const ownerMetadataResponse =
      await ownerAgent
        .get(sharePath)
        .expect(200);

    expect(ownerMetadataResponse.body).toMatchObject({
      letterId,
      letterStatus: 'PUBLISHED',
      tokenPrefix: firstToken.slice(0, 12),
      accessCount: 0,
    });

    expect(
      ownerMetadataResponse.body,
    ).not.toHaveProperty('token');

    await request(app.getHttpServer())
      .get(
        '/api/v1/public/letters/not-a-valid-token',
      )
      .expect(404);

    const publicLetterPath =
      `/api/v1/public/letters/${firstToken}`;

    const publicLetterResponse =
      await request(app.getHttpServer())
        .get(publicLetterPath)
        .expect(200)
        .expect(
          'Cache-Control',
          'private, no-store',
        )
        .expect(
          'X-Robots-Tag',
          'noindex, nofollow, noarchive',
        );

    expect(publicLetterResponse.body).toMatchObject({
      id: letterId,
      type: 'LOVED',
      status: 'PUBLISHED',
      recipientName: 'Avery',
      senderName: 'Riley',
      content: {
        version: 1,
        body: 'Dear Avery,\n\nThese words were saved especially for you.',
      },
    });

    expect(
      publicLetterResponse.body.attachments,
    ).toHaveLength(1);

    expect(
      publicLetterResponse.body.attachments[0],
    ).toMatchObject({
      id: attachmentId,
      type: 'IMAGE',
      status: 'READY',
      originalName: 'shared-memory.png',
      mimeType: 'image/png',
    });

    const publicAttachmentPath =
      `/api/v1${publicLetterResponse.body.attachments[0].contentPath}`;

    await request(app.getHttpServer())
      .get(publicAttachmentPath)
      .expect(200)
      .expect('Content-Type', 'image/png')
      .expect(
        'Content-Length',
        String(onePixelPng.byteLength),
      );

    const trackedLetter =
      await prisma.letter.findUnique({
        where: {
          id: letterId,
        },
        select: {
          firstViewedAt: true,
          lastViewedAt: true,
          viewCount: true,
        },
      });

    expect(trackedLetter).toMatchObject({
      viewCount: 1,
    });
    expect(
      trackedLetter!.firstViewedAt,
    ).toBeInstanceOf(Date);
    expect(
      trackedLetter!.lastViewedAt,
    ).toBeInstanceOf(Date);

    const firstTrackedLink =
      await prisma.letterLink.findUnique({
        where: {
          letterId,
        },
        select: {
          accessCount: true,
          lastAccessedAt: true,
        },
      });

    expect(firstTrackedLink).toMatchObject({
      accessCount: 1,
    });
    expect(
      firstTrackedLink!.lastAccessedAt,
    ).toBeInstanceOf(Date);

    const secondShareResponse =
      await ownerAgent
        .post(sharePath)
        .send({})
        .expect(201);

    const secondToken =
      secondShareResponse.body.token;

    expect(secondToken).not.toBe(firstToken);
    expect(
      secondShareResponse.body.accessCount,
    ).toBe(0);

    await request(app.getHttpServer())
      .get(publicLetterPath)
      .expect(404);

    await request(app.getHttpServer())
      .get(
        `/api/v1/public/letters/${secondToken}`,
      )
      .expect(200);

    const revokeResponse = await ownerAgent
      .delete(sharePath)
      .expect(200);

    expect(revokeResponse.body).toMatchObject({
      letterId,
      letterStatus: 'REVOKED',
    });

    expect(
      revokeResponse.body.revokedAt,
    ).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .get(
        `/api/v1/public/letters/${secondToken}`,
      )
      .expect(410);

    const futureExpiration = new Date(
      Date.now() + 10 * 60 * 1000,
    ).toISOString();

    const thirdShareResponse =
      await ownerAgent
        .post(sharePath)
        .send({
          expiresAt: futureExpiration,
        })
        .expect(201);

    const thirdToken =
      thirdShareResponse.body.token;

    expect(
      thirdShareResponse.body.letterStatus,
    ).toBe('PUBLISHED');

    await request(app.getHttpServer())
      .get(
        `/api/v1/public/letters/${secondToken}`,
      )
      .expect(404);

    await prisma.letterLink.update({
      where: {
        letterId,
      },
      data: {
        expiresAt: new Date(
          Date.now() - 60 * 1000,
        ),
      },
    });

    await request(app.getHttpServer())
      .get(
        `/api/v1/public/letters/${thirdToken}`,
      )
      .expect(410);

    const expiredLetter =
      await prisma.letter.findUnique({
        where: {
          id: letterId,
        },
        select: {
          status: true,
        },
      });

    expect(expiredLetter?.status).toBe(
      'EXPIRED',
    );
  });
});