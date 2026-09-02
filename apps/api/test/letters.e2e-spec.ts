import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, type TestingModule } from '@nestjs/testing';
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

describe('Letters (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const originalDatabaseUrl = process.env.DATABASE_URL;

  const firstUserEmail =
    'letter-owner@everdear.test';
  const secondUserEmail =
    'letter-outsider@everdear.test';

  const testPassword =
    'A secure EverDear letter passphrase 2026!';

  beforeAll(async () => {
    const testDatabaseUrl =
      process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is not configured',
      );
    }

    process.env.DATABASE_URL = testDatabaseUrl;

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
          in: [
            firstUserEmail,
            secondUserEmail,
          ],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [
            firstUserEmail,
            secondUserEmail,
          ],
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
  });

  it('enforces authentication and letter ownership', async () => {
    const ownerAgent = request.agent(
      app.getHttpServer(),
    );

    const outsiderAgent = request.agent(
      app.getHttpServer(),
    );

    const createLetterInput = {
      type: 'LOVED',
      recipientName: 'Avery',
      senderName: 'Riley',
      title: 'For all the quiet moments',
      content: {
        body: 'Dear Avery,\n\nSome words are worth keeping.',
      },
    };

    await request(app.getHttpServer())
      .post('/api/v1/letters')
      .send(createLetterInput)
      .expect(401);

    await ownerAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'Letter Owner',
        email: firstUserEmail,
        password: testPassword,
      })
      .expect(201);

    await outsiderAgent
      .post('/api/v1/auth/register')
      .send({
        name: 'Letter Outsider',
        email: secondUserEmail,
        password: testPassword,
      })
      .expect(201);

    const createResponse = await ownerAgent
      .post('/api/v1/letters')
      .send(createLetterInput)
      .expect(201);

    expect(createResponse.body).toMatchObject({
      type: 'LOVED',
      status: 'DRAFT',
      title: 'For all the quiet moments',
      recipientName: 'Avery',
      senderName: 'Riley',
      content: {
        version: 1,
        body: createLetterInput.content.body,
      },
      viewCount: 0,
    });

    const letterId = createResponse.body.id;

    expect(letterId).toEqual(expect.any(String));

    const ownerListResponse = await ownerAgent
      .get('/api/v1/letters')
      .expect(200);

    expect(ownerListResponse.body).toHaveLength(1);
    expect(ownerListResponse.body[0].id).toBe(
      letterId,
    );

    const outsiderListResponse =
      await outsiderAgent
        .get('/api/v1/letters')
        .expect(200);

    expect(outsiderListResponse.body).toEqual([]);

    await outsiderAgent
      .get(`/api/v1/letters/${letterId}`)
      .expect(404);

    await outsiderAgent
      .patch(`/api/v1/letters/${letterId}`)
      .send({
        title: 'Changed by outsider',
      })
      .expect(404);

    const updateResponse = await ownerAgent
      .patch(`/api/v1/letters/${letterId}`)
      .send({
        type: 'FAMILY',
        title: '',
        content: {
          body: 'Dear family,\n\nThis draft was safely autosaved.',
        },
      })
      .expect(200);

    expect(updateResponse.body).toMatchObject({
      id: letterId,
      type: 'FAMILY',
      status: 'DRAFT',
      title: null,
      content: {
        version: 1,
        body: 'Dear family,\n\nThis draft was safely autosaved.',
      },
    });

    await ownerAgent
      .patch(`/api/v1/letters/${letterId}`)
      .send({})
      .expect(400);

    await ownerAgent
      .patch(`/api/v1/letters/${letterId}`)
      .send({
        type: 'UNKNOWN',
      })
      .expect(400);

    const lockedLetterResponse = await ownerAgent
      .post('/api/v1/letters')
      .send({
        type: 'FRIEND',
        recipientName: 'Jordan',
        senderName: 'Riley',
      })
      .expect(201);

    const lockedLetterId =
      lockedLetterResponse.body.id;

    await prisma.letter.update({
      where: {
        id: lockedLetterId,
      },
      data: {
        status: 'READY',
      },
    });

    await ownerAgent
      .patch(
        `/api/v1/letters/${lockedLetterId}`,
      )
      .send({
        title: 'This must not change',
      })
      .expect(409);

    await ownerAgent
      .delete(
        `/api/v1/letters/${lockedLetterId}`,
      )
      .expect(409);

    await ownerAgent
      .delete(`/api/v1/letters/${letterId}`)
      .expect(204);

    await ownerAgent
      .get(`/api/v1/letters/${letterId}`)
      .expect(404);
  });
});