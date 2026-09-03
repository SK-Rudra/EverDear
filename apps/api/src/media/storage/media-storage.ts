import type { Readable } from 'node:stream';

export type PutMediaObjectInput = {
  storageKey: string;
  buffer: Buffer;
  mimeType: string;
};

export type MediaObject = {
  stream: Readable;
};

export abstract class MediaStorage {
  abstract put(input: PutMediaObjectInput): Promise<void>;

  abstract get(storageKey: string): Promise<MediaObject>;

  abstract delete(storageKey: string): Promise<void>;
}
