import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
import {
  access,
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

describe('Attachments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let testStorageRoot: string;

  const originalDatabaseUrl =
    process.env.DATABASE_URL;

  const originalMediaStorageRoot =
    process.env.MEDIA_STORAGE_ROOT;

  const ownerEmail =
    'attachment-owner@everdear.test';

  const outsiderEmail =
    'attachment-outsider@everdear.test';

  const testPassword =
    'A secure EverDear attachment passphrase 2026!';

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
      join(tmpdir(), 'everdear-media-e2e-'),
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

  it('validates, protects, streams, and deletes media', async () => {
    const ownerAgent = request.agent(
      app.getHttpServer(),
    );

    const outsiderAgent = request.agent(
      app.getHttpServer(),
    );

    await ownerAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'Attachment Owner',
        email: ownerEmail,
        password: testPassword,
      })
      .expect(201);

    await outsiderAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'Attachment Outsider',
        email: outsiderEmail,
        password: testPassword,
      })
      .expect(201);

    const createLetterResponse =
      await ownerAgent
        .post('/api/v1/letters')
        .send({
          type: 'LOVED',
          recipientName: 'Avery',
          senderName: 'Riley',
          title: 'A memory worth keeping',
          content: {
            body: 'This letter has a private picture.',
          },
        })
        .expect(201);

    const letterId =
      createLetterResponse.body.id;

    const attachmentsPath =
      `/api/v1/letters/${letterId}` +
      '/attachments';

    await request(app.getHttpServer())
      .post(attachmentsPath)
      .attach('file', onePixelPng, {
        filename: 'memory.png',
        contentType: 'image/png',
      })
      .expect(401);

    await ownerAgent
      .post(attachmentsPath)
      .attach(
        'file',
        Buffer.from(
          'This is not actually an image.',
        ),
        {
          filename: 'disguised.png',
          contentType: 'image/png',
        },
      )
      .expect(400);

    const uploadResponse = await ownerAgent
      .post(attachmentsPath)
      .attach('file', onePixelPng, {
        filename: 'our memory.png',
        contentType: 'image/png',
      })
      .expect(201);

    expect(uploadResponse.body).toMatchObject({
      letterId,
      type: 'IMAGE',
      status: 'READY',
      originalName: 'our memory.png',
      mimeType: 'image/png',
      sizeBytes: onePixelPng.byteLength,
      sortOrder: 0,
    });

    const attachmentId =
      uploadResponse.body.id;

    expect(attachmentId).toEqual(
      expect.any(String),
    );

    expect(
      uploadResponse.body.contentPath,
    ).toBe(
      `${attachmentsPath}/${attachmentId}/content`,
    );

    const storedAttachment =
      await prisma.letterAttachment.findUnique({
        where: {
          id: attachmentId,
        },
        select: {
          storageKey: true,
        },
      });

    expect(storedAttachment).not.toBeNull();

    const storedFilePath = join(
      testStorageRoot,
      ...storedAttachment!.storageKey.split('/'),
    );

    await expect(
      access(storedFilePath),
    ).resolves.toBeUndefined();

    const listResponse = await ownerAgent
      .get(attachmentsPath)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].id).toBe(
      attachmentId,
    );

    await request(app.getHttpServer())
      .get(
        `${attachmentsPath}/${attachmentId}/content`,
      )
      .expect(401);

    await outsiderAgent
      .get(attachmentsPath)
      .expect(404);

    await outsiderAgent
      .get(
        `${attachmentsPath}/${attachmentId}/content`,
      )
      .expect(404);

    const contentResponse = await ownerAgent
      .get(
        `${attachmentsPath}/${attachmentId}/content`,
      )
      .expect(200)
      .expect('Content-Type', 'image/png')
      .expect(
        'Content-Length',
        String(onePixelPng.byteLength),
      )
      .expect(
        'X-Content-Type-Options',
        'nosniff',
      );

    expect(
      Buffer.isBuffer(contentResponse.body),
    ).toBe(true);

    await outsiderAgent
      .delete(
        `${attachmentsPath}/${attachmentId}`,
      )
      .expect(404);

    await ownerAgent
      .delete(
        `${attachmentsPath}/${attachmentId}`,
      )
      .expect(204);

    await expect(
      access(storedFilePath),
    ).rejects.toThrow();

    await ownerAgent
      .get(attachmentsPath)
      .expect(200, []);

    expect(
      await prisma.letterAttachment.count({
        where: {
          id: attachmentId,
        },
      }),
    ).toBe(0);

    const replacementUploadResponse =
      await ownerAgent
        .post(attachmentsPath)
        .attach('file', onePixelPng, {
          filename: 'delete-with-letter.png',
          contentType: 'image/png',
        })
        .expect(201);

    const replacementAttachmentId =
      replacementUploadResponse.body.id;

    const replacementStoredAttachment =
      await prisma.letterAttachment.findUnique({
        where: {
          id: replacementAttachmentId,
        },
        select: {
          storageKey: true,
        },
      });

    expect(
      replacementStoredAttachment,
    ).not.toBeNull();

    const replacementStoredFilePath = join(
      testStorageRoot,
      ...replacementStoredAttachment!.storageKey.split(
        '/',
      ),
    );

    await expect(
      access(replacementStoredFilePath),
    ).resolves.toBeUndefined();

    await ownerAgent
      .delete(`/api/v1/letters/${letterId}`)
      .expect(204);

    await expect(
      access(replacementStoredFilePath),
    ).rejects.toThrow();

    expect(
      await prisma.letterAttachment.count({
        where: {
          id: replacementAttachmentId,
        },
      }),
    ).toBe(0);
  });
});