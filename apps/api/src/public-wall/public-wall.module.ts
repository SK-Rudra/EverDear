import { Module } from '@nestjs/common';
import { PublicWallIdentityService } from './public-wall-identity.service.js';
import { PublicWallController } from './public-wall.controller.js';
import { PublicWallService } from './public-wall.service.js';

@Module({
  controllers: [PublicWallController],
  providers: [
    PublicWallIdentityService,
    PublicWallService,
  ],
  exports: [PublicWallService],
})
export class PublicWallModule {}