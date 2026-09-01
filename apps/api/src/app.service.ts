import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

export type HealthResponse = {
  status: 'ok';
  service: 'everdear-api';
  database: 'connected';
  timestamp: string;
};

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthResponse> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      status: 'ok',
      service: 'everdear-api',
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  }
}