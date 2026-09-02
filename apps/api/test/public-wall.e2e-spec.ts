import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Test,
  type TestingModule,
} from '@nestjs/testing';
import request from 'supertest';
import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
} from 'vitest';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Public Wall (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const originalDatabaseUrl =
    process.env.DATABASE_URL;

  const originalPublicWallSecret =
    process.env.PUBLIC_WALL_HASH_SECRET;

  const testMessageContents = [
    'Some words become lighter when we leave them somewhere gentle.',
    'I hope tomorrow meets you with kindness.',
    'A quiet reminder that you have already survived difficult days.',
    'This message has reached the end of its public life.',
  ];

  beforeAll(async () => {
    const testDatabaseUrl =
      process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is not configured',
      );
    }

    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.PUBLIC_WALL_HASH_SECRET =
      'everdear-public-wall-e2e-secret-with-more-than-32-characters';

    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app = moduleFixture.createNestApplication();

    configureApp(app, app.get(ConfigService));

    await app.init();

    prisma = app.get(PrismaService);

    await prisma.publicMessage.deleteMany({
      where: {
        content: {
          in: testMessageContents,
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.publicMessage.deleteMany({
      where: {
        content: {
          in: testMessageContents,
        },
      },
    });

    await app.close();

    if (originalDatabaseUrl) {
      process.env.DATABASE_URL =
        originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }

    if (originalPublicWallSecret) {
      process.env.PUBLIC_WALL_HASH_SECRET =
        originalPublicWallSecret;
    } else {
      delete process.env
        .PUBLIC_WALL_HASH_SECRET;
    }
  });

  it('publishes, paginates, protects, reports, hides, and expires messages', async () => {
    const server = app.getHttpServer();

    await request(server)
      .post('/api/v1/public/messages')
      .send({
        content: '  ',
      })
      .expect(400);

    await request(server)
      .post('/api/v1/public/messages')
      .send({
        content:
          'Contact me at hello@example.com',
      })
      .expect(400);

    await request(server)
      .post('/api/v1/public/messages')
      .send({
        content:
          'This submission came from a bot.',
        website: 'https://spam.example',
      })
      .expect(400);

    const firstMessageResponse =
      await request(server)
        .post('/api/v1/public/messages')
        .send({
          content:
            'Some words become lighter when we leave them somewhere gentle.',
          displayLocation: '  Dhaka  ',
          website: '',
        })
        .expect(201);

    expect(
      firstMessageResponse.body,
    ).toMatchObject({
      content:
        'Some words become lighter when we leave them somewhere gentle.',
      displayLocation: 'Dhaka',
    });

    expect(
      firstMessageResponse.body.id,
    ).toEqual(expect.any(String));

    expect(
      firstMessageResponse.body.publishedAt,
    ).toEqual(expect.any(String));

    expect(
      firstMessageResponse.body.expiresAt,
    ).toEqual(expect.any(String));

    expect(
      firstMessageResponse.body,
    ).not.toHaveProperty('authorHash');

    expect(
      firstMessageResponse.body,
    ).not.toHaveProperty('userId');

    expect(
      firstMessageResponse.body,
    ).not.toHaveProperty('status');

    const firstMessageId =
      firstMessageResponse.body.id;

    await request(server)
      .post('/api/v1/public/messages')
      .send({
        content:
          'Some words become lighter when we leave them somewhere gentle.',
        displayLocation: 'Dhaka',
      })
      .expect(409);

    const secondMessageResponse =
      await request(server)
        .post('/api/v1/public/messages')
        .send({
          content:
            'I hope tomorrow meets you with kindness.',
        })
        .expect(201);

    const secondMessageId =
      secondMessageResponse.body.id;

    const thirdMessageResponse =
      await request(server)
        .post('/api/v1/public/messages')
        .send({
          content:
            'A quiet reminder that you have already survived difficult days.',
          displayLocation: 'Somewhere nearby',
        })
        .expect(201);

    const thirdMessageId =
      thirdMessageResponse.body.id;

    await request(server)
      .post('/api/v1/public/messages')
      .send({
        content:
          'This fourth message must be rate limited.',
      })
      .expect(429);

    const firstPageResponse =
      await request(server)
        .get('/api/v1/public/messages')
        .query({
          limit: 1,
        })
        .expect(200);

    expect(
      firstPageResponse.body.messages,
    ).toHaveLength(1);

    expect(
      firstPageResponse.body.nextCursor,
    ).toEqual(expect.any(String));

    const secondPageResponse =
      await request(server)
        .get('/api/v1/public/messages')
        .query({
          limit: 1,
          cursor:
            firstPageResponse.body.nextCursor,
        })
        .expect(200);

    expect(
      secondPageResponse.body.messages,
    ).toHaveLength(1);

    expect(
      secondPageResponse.body.messages[0].id,
    ).not.toBe(
      firstPageResponse.body.messages[0].id,
    );

    await request(server)
      .post(
        `/api/v1/public/messages/${secondMessageId}/reports`,
      )
      .send({
        reason: 'NOT_A_REASON',
      })
      .expect(400);

    await request(server)
      .post(
        `/api/v1/public/messages/${secondMessageId}/reports`,
      )
      .send({
        reason: 'SPAM',
        details:
          'This appears to be repeated promotional content.',
      })
      .expect(202);

    await request(server)
      .post(
        `/api/v1/public/messages/${secondMessageId}/reports`,
      )
      .send({
        reason: 'SPAM',
      })
      .expect(409);

    await prisma.report.createMany({
      data: [
        {
          messageId: firstMessageId,
          reporterHash:
            'seeded-public-wall-reporter-1',
          reason: 'HARASSMENT',
          status: 'PENDING',
        },
        {
          messageId: firstMessageId,
          reporterHash:
            'seeded-public-wall-reporter-2',
          reason: 'HATEFUL_CONTENT',
          status: 'PENDING',
        },
      ],
    });

    await request(server)
      .post(
        `/api/v1/public/messages/${firstMessageId}/reports`,
      )
      .send({
        reason: 'OTHER',
        details:
          'This message needs moderator review.',
      })
      .expect(202);

    const hiddenMessage =
      await prisma.publicMessage.findUnique({
        where: {
          id: firstMessageId,
        },
        select: {
          status: true,
        },
      });

    expect(hiddenMessage?.status).toBe(
      'HIDDEN',
    );

    const visibleMessagesResponse =
      await request(server)
        .get('/api/v1/public/messages')
        .expect(200);

    const visibleIds =
      visibleMessagesResponse.body.messages.map(
        (message: { id: string }) =>
          message.id,
      );

    expect(visibleIds).not.toContain(
      firstMessageId,
    );

    expect(visibleIds).toContain(
      secondMessageId,
    );

    expect(visibleIds).toContain(
      thirdMessageId,
    );

    const expiredMessage =
      await prisma.publicMessage.create({
        data: {
          content:
            'This message has reached the end of its public life.',
          anonymous: true,
          authorHash:
            'expired-public-wall-author',
          status: 'PUBLISHED',
          publishedAt: new Date(
            Date.now() - 60_000,
          ),
          expiresAt: new Date(
            Date.now() - 1_000,
          ),
        },
      });

    await request(server)
      .get('/api/v1/public/messages')
      .expect(200);

    const refreshedExpiredMessage =
      await prisma.publicMessage.findUnique({
        where: {
          id: expiredMessage.id,
        },
        select: {
          status: true,
        },
      });

    expect(
      refreshedExpiredMessage?.status,
    ).toBe('EXPIRED');
  });
});