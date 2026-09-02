import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import {
  MediaStorage,
  type MediaObject,
  type PutMediaObjectInput,
} from './media-storage.js';
import { assertMediaStorageKey } from './media-storage-key.js';

@Injectable()
export class S3MediaStorageService
  extends MediaStorage
  implements OnModuleDestroy
{
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    super();

    this.bucket =
      configService.getOrThrow<string>(
        'S3_BUCKET',
      );

    const endpoint =
      configService.get<string>(
        'S3_ENDPOINT',
      );

    const accessKeyId =
      configService.get<string>(
        'S3_ACCESS_KEY_ID',
      );

    const secretAccessKey =
      configService.get<string>(
        'S3_SECRET_ACCESS_KEY',
      );

    const clientConfiguration: S3ClientConfig = {
      region:
        configService.getOrThrow<string>(
          'S3_REGION',
        ),
      forcePathStyle:
        configService.get<boolean>(
          'S3_FORCE_PATH_STYLE',
          false,
        ),
    };

    if (endpoint) {
      clientConfiguration.endpoint = endpoint;
    }

    if (
      accessKeyId &&
      secretAccessKey
    ) {
      clientConfiguration.credentials = {
        accessKeyId,
        secretAccessKey,
      };
    }

    this.client = new S3Client(
      clientConfiguration,
    );
  }

  async put({
    storageKey,
    buffer,
  }: PutMediaObjectInput): Promise<void> {
    assertMediaStorageKey(storageKey);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
        Body: buffer,
        ContentLength: buffer.length,
      }),
    );
  }

  async get(
    storageKey: string,
  ): Promise<MediaObject> {
    assertMediaStorageKey(storageKey);

    const result = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );

    if (!(result.Body instanceof Readable)) {
      throw new Error(
        'S3 returned an unreadable media object.',
      );
    }

    return {
      stream: result.Body,
    };
  }

  async delete(
    storageKey: string,
  ): Promise<void> {
    assertMediaStorageKey(storageKey);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: storageKey,
      }),
    );
  }

  onModuleDestroy(): void {
    this.client.destroy();
  }
}