import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { Readable } from 'node:stream';
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { S3MediaStorageService } from './s3-media-storage.service.js';

function createStorage() {
  const values: Record<string, unknown> = {
    S3_ENDPOINT:
      'https://example-account.r2.cloudflarestorage.com',
    S3_REGION: 'auto',
    S3_BUCKET: 'everdear-media',
    S3_ACCESS_KEY_ID: 'test-access-key',
    S3_SECRET_ACCESS_KEY:
      'test-secret-access-key',
    S3_FORCE_PATH_STYLE: false,
  };

  const configService = {
    get: vi.fn(
      (
        key: string,
        defaultValue?: unknown,
      ) => values[key] ?? defaultValue,
    ),
    getOrThrow: vi.fn((key: string) => {
      const value = values[key];

      if (value === undefined) {
        throw new Error(
          `Missing configuration: ${key}`,
        );
      }

      return value;
    }),
  } as unknown as ConfigService;

  return new S3MediaStorageService(
    configService,
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('S3MediaStorageService', () => {
  it('uploads a media object', async () => {
    const send = vi
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);

    const storage = createStorage();
    const buffer = Buffer.from('media');

    await storage.put({
      storageKey:
        'letters/letter-id/attachment.png',
      buffer,
    });

    const command = send.mock.calls[0]?.[0];

    expect(command).toBeInstanceOf(
      PutObjectCommand,
    );

    expect(
      (command as PutObjectCommand).input,
    ).toMatchObject({
      Bucket: 'everdear-media',
      Key: 'letters/letter-id/attachment.png',
      Body: buffer,
      ContentLength: buffer.length,
    });
  });

  it('returns a readable media stream', async () => {
    const stream = Readable.from([
      Buffer.from('media'),
    ]);

    vi.spyOn(
      S3Client.prototype,
      'send',
    ).mockResolvedValueOnce({
      Body: stream,
    } as never);

    const storage = createStorage();

    const result = await storage.get(
      'letters/letter-id/attachment.png',
    );

    expect(result.stream).toBe(stream);
  });

  it('rejects an unreadable response', async () => {
    vi.spyOn(
      S3Client.prototype,
      'send',
    ).mockResolvedValueOnce({
      Body: undefined,
    } as never);

    const storage = createStorage();

    await expect(
      storage.get(
        'letters/letter-id/attachment.png',
      ),
    ).rejects.toThrow(
      'S3 returned an unreadable media object.',
    );
  });

  it('deletes a media object', async () => {
    const send = vi
      .spyOn(S3Client.prototype, 'send')
      .mockResolvedValue({} as never);

    const storage = createStorage();

    await storage.delete(
      'letters/letter-id/attachment.png',
    );

    const command = send.mock.calls[0]?.[0];

    expect(command).toBeInstanceOf(
      DeleteObjectCommand,
    );

    expect(
      (command as DeleteObjectCommand).input,
    ).toMatchObject({
      Bucket: 'everdear-media',
      Key: 'letters/letter-id/attachment.png',
    });
  });

  it('rejects unsafe storage keys', async () => {
    const send = vi.spyOn(
      S3Client.prototype,
      'send',
    );

    const storage = createStorage();

    await expect(
      storage.put({
        storageKey: '../secret.txt',
        buffer: Buffer.from('unsafe'),
      }),
    ).rejects.toThrow(
      'Invalid media storage key.',
    );

    expect(send).not.toHaveBeenCalled();
  });

  it('destroys the S3 client during shutdown', () => {
    const destroy = vi
      .spyOn(S3Client.prototype, 'destroy')
      .mockImplementation(() => undefined);

    const storage = createStorage();

    storage.onModuleDestroy();

    expect(destroy).toHaveBeenCalledOnce();
  });
});