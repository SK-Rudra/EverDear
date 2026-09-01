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
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const originalDatabaseUrl = process.env.DATABASE_URL;
  const testEmail = 'auth-flow@everdear.test';
  const testPassword =
    'A secure EverDear test passphrase 2026!';

  beforeAll(async () => {
    const testDatabaseUrl =
      process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is not configured',
      );
    }

    process.env.DATABASE_URL = testDatabaseUrl;

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
        email: testEmail,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: testEmail,
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

  it('completes the authentication lifecycle', async () => {
    const agent = request.agent(
      app.getHttpServer(),
    );

    await agent
      .get('/api/v1/auth/me')
      .expect(401);

    const registerResponse = await agent
      .post('/api/v1/auth/register')
      .send({
        name: 'EverDear Auth Test',
        email: testEmail.toUpperCase(),
        password: testPassword,
      })
      .expect(201);

    expect(registerResponse.body.user).toMatchObject({
      name: 'EverDear Auth Test',
      email: testEmail,
      role: 'USER',
      emailVerifiedAt: null,
    });

    expect(
      registerResponse.body.user.passwordHash,
    ).toBeUndefined();

    const registerCookie =
      registerResponse.headers['set-cookie'];

    expect(registerCookie).toBeDefined();
    expect(registerCookie[0]).toContain(
      'everdear_session=',
    );
    expect(registerCookie[0]).toContain('HttpOnly');
    expect(registerCookie[0]).toContain(
      'SameSite=Lax',
    );

    const storedUser =
      await prisma.user.findUniqueOrThrow({
        where: {
          email: testEmail,
        },
        select: {
          passwordHash: true,
        },
      });

    expect(storedUser.passwordHash).not.toBe(
      testPassword,
    );

    expect(storedUser.passwordHash).toMatch(
      /^\$argon2id\$/,
    );

    const currentUserResponse = await agent
      .get('/api/v1/auth/me')
      .expect(200);

    expect(currentUserResponse.body.user.email).toBe(
      testEmail,
    );

    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'Duplicate Auth Test',
        email: testEmail,
        password: testPassword,
      })
      .expect(409);

    await agent
      .post('/api/v1/auth/logout')
      .expect(204);

    await agent
      .get('/api/v1/auth/me')
      .expect(401);

    await agent
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'This password is incorrect',
      })
      .expect(401);

    await agent
      .post('/api/v1/auth/login')
      .send({
        email: testEmail.toUpperCase(),
        password: testPassword,
      })
      .expect(200);

    await agent
      .get('/api/v1/auth/me')
      .expect(200);

    await agent
      .post('/api/v1/auth/logout')
      .expect(204);
  });

  it('rejects invalid registration input', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        name: 'A',
        email: 'not-an-email',
        password: 'too-short',
        unexpectedField: true,
      })
      .expect(400);
  });
});