import { describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import type { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  it('returns the API and database health status', async () => {
    const queryRaw = vi.fn().mockResolvedValue([{ result: 1 }]);

    const prisma = {
      $queryRaw: queryRaw,
    } as unknown as PrismaService;

    const appService = new AppService(prisma);
    const appController = new AppController(appService);

    const result = await appController.getHealth();

    expect(result).toMatchObject({
      status: 'ok',
      service: 'everdear-api',
      database: 'connected',
    });

    expect(queryRaw).toHaveBeenCalledOnce();
    expect(Number.isNaN(Date.parse(result.timestamp))).toBe(false);
  });
});