import {
  Controller,
  Get,
  Header,
} from '@nestjs/common';
import {
  AppService,
  type HealthResponse,
  type LivenessResponse,
} from './app.service.js';

@Controller('health')
export class AppController {
  constructor(
    private readonly appService: AppService,
  ) {}

  /*
   * Lightweight process check. This endpoint
   * intentionally does not contact PostgreSQL.
   */
  @Get('live')
  @Header('Cache-Control', 'no-store')
  getLiveness(): LivenessResponse {
    return this.appService.getLiveness();
  }

  /*
   * Readiness check used by the deployment
   * platform before sending traffic.
   */
  @Get('ready')
  @Header('Cache-Control', 'no-store')
  getReadiness(): Promise<HealthResponse> {
    return this.appService.getReadiness();
  }

  /*
   * Preserve the original health route for
   * compatibility with existing monitoring.
   */
  @Get()
  @Header('Cache-Control', 'no-store')
  getHealth(): Promise<HealthResponse> {
    return this.appService.getHealth();
  }
}