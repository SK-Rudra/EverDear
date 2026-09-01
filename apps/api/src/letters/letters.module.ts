import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { LettersController } from './letters.controller.js';
import { LettersService } from './letters.service.js';

@Module({
  imports: [AuthModule],
  controllers: [LettersController],
  providers: [LettersService],
  exports: [LettersService],
})
export class LettersModule {}