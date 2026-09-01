import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { fileTypeFromBuffer } from 'file-type';
import {
  SUPPORTED_MEDIA_TYPES,
  type SupportedMediaMimeType,
} from './media.constants.js';

export type UploadedMediaFile = {
  buffer: Buffer;
  originalname: string;
};

export type ValidatedMedia = {
  type: 'IMAGE' | 'VIDEO';
  extension: string;
  mimeType: SupportedMediaMimeType;
  originalName: string;
  sizeBytes: number;
};

@Injectable()
export class MediaValidationService {
  async validate(
    file: UploadedMediaFile | undefined,
  ): Promise<ValidatedMedia> {
    if (!file?.buffer?.length) {
      throw new BadRequestException(
        'Choose a non-empty media file.',
      );
    }

    const detectedType = await fileTypeFromBuffer(
      file.buffer,
    );

    if (!detectedType) {
      throw new BadRequestException(
        'The uploaded file type could not be verified.',
      );
    }

    const mimeType =
      detectedType.mime as SupportedMediaMimeType;

    const configuration =
      SUPPORTED_MEDIA_TYPES[mimeType];

    if (!configuration) {
      throw new BadRequestException(
        'Only JPEG, PNG, WebP, GIF, MP4, and WebM files are supported.',
      );
    }

    const sizeBytes = file.buffer.byteLength;

    if (sizeBytes > configuration.maxSizeBytes) {
      const maximumMegabytes =
        configuration.maxSizeBytes /
        (1024 * 1024);

      throw new BadRequestException(
        `${configuration.type === 'IMAGE' ? 'Images' : 'Videos'} must not exceed ${maximumMegabytes} MB.`,
      );
    }

    return {
      type: configuration.type,
      extension: configuration.extension,
      mimeType,
      originalName: this.cleanOriginalName(
        file.originalname,
        configuration.extension,
      ),
      sizeBytes,
    };
  }

  private cleanOriginalName(
    originalName: string,
    extension: string,
  ): string {
    const leafName = originalName
      .replaceAll('\\', '/')
      .split('/')
      .at(-1);

    const withoutControlCharacters = Array.from(
      leafName ?? '',
    )
      .filter((character) => {
        const characterCode =
          character.charCodeAt(0);

        return (
          characterCode >= 32 &&
          characterCode !== 127
        );
      })
      .join('');

    const cleanedName =
      withoutControlCharacters
        .replace(/\s+/g, ' ')
        .trim() || `upload.${extension}`;

    return cleanedName.slice(0, 255);
  }
}