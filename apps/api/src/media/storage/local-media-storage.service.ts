import {
  Injectable,
  type OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import {
  access,
  mkdir,
  rm,
  writeFile,
} from 'node:fs/promises';
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from 'node:path';
import {
  MediaStorage,
  type MediaObject,
  type PutMediaObjectInput,
} from './media-storage.js';

const STORAGE_KEY_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9/._-]*$/;

@Injectable()
export class LocalMediaStorageService
  extends MediaStorage
  implements OnModuleInit
{
  private readonly rootDirectory: string;

  constructor(configService: ConfigService) {
    super();

    const configuredRoot = configService
      .get<string>('MEDIA_STORAGE_ROOT')
      ?.trim();

    this.rootDirectory = resolve(
      configuredRoot || 'storage/media',
    );
  }

  async onModuleInit(): Promise<void> {
    await mkdir(this.rootDirectory, {
      recursive: true,
    });
  }

  async put({
    storageKey,
    buffer,
  }: PutMediaObjectInput): Promise<void> {
    const absolutePath =
      this.resolveStorageKey(storageKey);

    await mkdir(dirname(absolutePath), {
      recursive: true,
    });

    await writeFile(absolutePath, buffer, {
      flag: 'wx',
    });
  }

  async get(
    storageKey: string,
  ): Promise<MediaObject> {
    const absolutePath =
      this.resolveStorageKey(storageKey);

    await access(absolutePath);

    return {
      stream: createReadStream(absolutePath),
    };
  }

  async delete(
    storageKey: string,
  ): Promise<void> {
    const absolutePath =
      this.resolveStorageKey(storageKey);

    await rm(absolutePath, {
      force: true,
    });
  }

  private resolveStorageKey(
    storageKey: string,
  ): string {
    if (
      !STORAGE_KEY_PATTERN.test(storageKey) ||
      storageKey.includes('..')
    ) {
      throw new Error('Invalid media storage key.');
    }

    const absolutePath = resolve(
      this.rootDirectory,
      ...storageKey.split('/'),
    );

    const relativePath = relative(
      this.rootDirectory,
      absolutePath,
    );

    if (
      !relativePath ||
      relativePath === '..' ||
      relativePath.startsWith(`..${sep}`) ||
      isAbsolute(relativePath)
    ) {
      throw new Error(
        'Media storage key escaped its root.',
      );
    }

    return absolutePath;
  }
}