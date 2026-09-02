import { Module } from '@nestjs/common';
import {
  ConfigModule,
  ConfigService,
} from '@nestjs/config';
import { MediaValidationService } from './media-validation.service.js';
import { LocalMediaStorageService } from './storage/local-media-storage.service.js';
import { MediaStorage } from './storage/media-storage.js';
import { S3MediaStorageService } from './storage/s3-media-storage.service.js';

function createMediaStorage(
  configService: ConfigService,
): MediaStorage {
  const driver = configService.get<
    'local' | 's3'
  >('MEDIA_STORAGE_DRIVER', 'local');

  if (driver === 's3') {
    return new S3MediaStorageService(
      configService,
    );
  }

  return new LocalMediaStorageService(
    configService,
  );
}

@Module({
  imports: [ConfigModule],
  providers: [
    MediaValidationService,
    {
      provide: MediaStorage,
      inject: [ConfigService],
      useFactory: createMediaStorage,
    },
  ],
  exports: [
    MediaStorage,
    MediaValidationService,
  ],
})
export class MediaModule {}