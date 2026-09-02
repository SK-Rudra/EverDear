import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class PublicWallIdentityService {
  private readonly secret: string;

  constructor(configService: ConfigService) {
    this.secret = configService.getOrThrow<string>(
      'PUBLIC_WALL_HASH_SECRET',
    );

    if (this.secret.length < 32) {
      throw new Error(
        'PUBLIC_WALL_HASH_SECRET must contain at least 32 characters',
      );
    }
  }

  createRequestHash(request: Request): string {
    const ipAddress =
      request.ip ||
      request.socket.remoteAddress ||
      'unknown';

    return createHmac('sha256', this.secret)
      .update(`everdear-public-wall:v1:${ipAddress}`)
      .digest('hex');
  }
}