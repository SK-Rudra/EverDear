import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaValidationService } from './media-validation.service.js';
import { LocalMediaStorageService } from './storage/local-media-storage.service.js';
import { MediaStorage } from './storage/media-storage.js';

@Module({
  imports: [ConfigModule],
  providers: [
    MediaValidationService,
    LocalMediaStorageService,
    {
      provide: MediaStorage,
      useExisting: LocalMediaStorageService,
    },
  ],
  exports: [
    MediaStorage,
    MediaValidationService,
  ],
})
export class MediaModule {}