import { ServiceUnavailableException } from '@nestjs/common';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import type { PrismaService } from './prisma/prisma.service.js';

function createSubject() {
  const queryRaw = vi
    .fn()
    .mockResolvedValue([{ result: 1 }]);

  const prisma = {
    $queryRaw: queryRaw,
  } as unknown as PrismaService;

  const appService = new AppService(prisma);
  const appController = new AppController(
    appService,
  );

  return {
    appController,
    queryRaw,
  };
}

describe('AppController', () => {
  it('returns liveness without querying the database', () => {
    const { appController, queryRaw } =
      createSubject();

    const result =
      appController.getLiveness();

    expect(result).toMatchObject({
      status: 'ok',
      service: 'everdear-api',
    });

    expect(result).not.toHaveProperty(
      'database',
    );

    expect(queryRaw).not.toHaveBeenCalled();

    expect(
      Number.isNaN(Date.parse(result.timestamp)),
    ).toBe(false);
  });

  it('returns readiness when the database is connected', async () => {
    const { appController, queryRaw } =
      createSubject();

    const result =
      await appController.getReadiness();

    expect(result).toMatchObject({
      status: 'ok',
      service: 'everdear-api',
      database: 'connected',
    });

    expect(queryRaw).toHaveBeenCalledOnce();

    expect(
      Number.isNaN(Date.parse(result.timestamp)),
    ).toBe(false);
  });

  it('preserves the original health endpoint', async () => {
    const { appController, queryRaw } =
      createSubject();

    const result =
      await appController.getHealth();

    expect(result).toMatchObject({
      status: 'ok',
      service: 'everdear-api',
      database: 'connected',
    });

    expect(queryRaw).toHaveBeenCalledOnce();
  });

  it('returns service unavailable when the database cannot be reached', async () => {
    const { appController, queryRaw } =
      createSubject();

    queryRaw.mockRejectedValue(
      new Error('Database unavailable'),
    );

    let caughtError: unknown;

    try {
      await appController.getReadiness();
    } catch (error: unknown) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(
      ServiceUnavailableException,
    );

    const healthError =
      caughtError as ServiceUnavailableException;

    expect(healthError.getStatus()).toBe(503);

    expect(
      healthError.getResponse(),
    ).toMatchObject({
      status: 'error',
      service: 'everdear-api',
      database: 'unavailable',
    });
  });
});