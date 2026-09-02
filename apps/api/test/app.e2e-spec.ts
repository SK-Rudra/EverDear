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

import { configureApp } from '../src/app.setup.js';

describe('Health checks (e2e)', () => {
  let app: INestApplication;

  const originalDatabaseUrl =
    process.env.DATABASE_URL;

  beforeAll(async () => {
    const testDatabaseUrl =
      process.env.TEST_DATABASE_URL;

    if (!testDatabaseUrl) {
      throw new Error(
        'TEST_DATABASE_URL is not configured',
      );
    }

    process.env.DATABASE_URL =
      testDatabaseUrl;

    const { AppModule } = await import(
      '../src/app.module.js'
    );

    const moduleFixture: TestingModule =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

    app =
      moduleFixture.createNestApplication();

    configureApp(
      app,
      app.get(ConfigService),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();

    if (originalDatabaseUrl) {
      process.env.DATABASE_URL =
        originalDatabaseUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  });

  it('/api/v1/health/live (GET)', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/health/live')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'everdear-api',
    });

    expect(response.body).not.toHaveProperty(
      'database',
    );

    expect(response.body.timestamp).toEqual(
      expect.any(String),
    );

    expect(
      response.headers['cache-control'],
    ).toContain('no-store');
  });

  it('/api/v1/health/ready (GET)', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/health/ready')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'everdear-api',
      database: 'connected',
    });

    expect(response.body.timestamp).toEqual(
      expect.any(String),
    );

    expect(
      response.headers['cache-control'],
    ).toContain('no-store');
  });

  it('/api/v1/health (GET)', async () => {
    const response = await request(
      app.getHttpServer(),
    )
      .get('/api/v1/health')
      .expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'everdear-api',
      database: 'connected',
    });
  });
});