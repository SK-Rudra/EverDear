import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { MediaModule } from '../media/media.module.js';
import { AttachmentsController } from './attachments/attachments.controller.js';
import { AttachmentsService } from './attachments/attachments.service.js';
import { LettersController } from './letters.controller.js';
import { LettersService } from './letters.service.js';
import { PublicLettersController } from './sharing/public-letters.controller.js';
import { PublicLettersService } from './sharing/public-letters.service.js';
import { ShareLinksController } from './sharing/share-links.controller.js';
import { ShareLinksService } from './sharing/share-links.service.js';
import { ShareTokenService } from './sharing/share-token.service.js';

@Module({
  imports: [AuthModule, MediaModule],
  controllers: [
    LettersController,
    AttachmentsController,
    ShareLinksController,
    PublicLettersController,
  ],
  providers: [
    LettersService,
    AttachmentsService,
    ShareTokenService,
    ShareLinksService,
    PublicLettersService,
  ],
  exports: [
    LettersService,
    AttachmentsService,
    ShareLinksService,
  ],
})
export class LettersModule {}