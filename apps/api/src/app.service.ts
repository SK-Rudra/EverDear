import {
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service.js';

const SERVICE_NAME = 'everdear-api' as const;

export type LivenessResponse = {
  status: 'ok';
  service: typeof SERVICE_NAME;
  timestamp: string;
};

export type HealthResponse = LivenessResponse & {
  database: 'connected';
};

export type UnavailableHealthResponse = {
  status: 'error';
  service: typeof SERVICE_NAME;
  database: 'unavailable';
  timestamp: string;
};

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      service: SERVICE_NAME,
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<HealthResponse> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      const response: UnavailableHealthResponse = {
        status: 'error',
        service: SERVICE_NAME,
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      };

      throw new ServiceUnavailableException(
        response,
      );
    }

    return {
      ...this.getLiveness(),
      database: 'connected',
    };
  }

  getHealth(): Promise<HealthResponse> {
    return this.getReadiness();
  }
}