import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MediaModule } from '../media/media.module.js';
import { AttachmentsController } from './attachments/attachments.controller.js';
import { AttachmentsService } from './attachments/attachments.service.js';
import { LettersController } from './letters.controller.js';
import { LettersService } from './letters.service.js';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [
    LettersController,
    AttachmentsController,
  ],
  providers: [
    LettersService,
    AttachmentsService,
  ],
  exports: [
    LettersService,
    AttachmentsService,
  ],
})
export class LettersModule {}