import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { validateEnvironment } from './config/environment.js';
import { LettersModule } from './letters/letters.module.js';
import { ModerationModule } from './moderation/moderation.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PublicWallModule } from './public-wall/public-wall.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    PrismaModule,
    AuthModule,
    LettersModule,
    PublicWallModule,
    ModerationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}