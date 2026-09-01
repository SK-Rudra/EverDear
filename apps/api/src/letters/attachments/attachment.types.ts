import type { Readable } from 'node:stream';
import type {
  AttachmentStatus,
  AttachmentType,
} from '../../generated/prisma/enums.js';

export type AttachmentResponse = {
  id: string;
  letterId: string;
  type: AttachmentType;
  status: AttachmentStatus;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  sortOrder: number;
  contentPath: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OpenedAttachment = {
  attachment: AttachmentResponse;
  stream: Readable;
};