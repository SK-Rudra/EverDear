import type { Readable } from 'node:stream';
import type {
  AttachmentStatus,
  AttachmentType,
  LetterStatus,
  LetterType,
} from '../../generated/prisma/enums.js';
import type { LetterContentV1 } from '../letter.types.js';

export type ShareLinkResponse = {
  letterId: string;
  letterStatus: LetterStatus;
  tokenPrefix: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
  lastAccessedAt: Date | null;
  accessCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type CreatedShareLinkResponse =
  ShareLinkResponse & {
    token: string;
  };

export type PublicAttachmentResponse = {
  id: string;
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
};

export type PublicLetterResponse = {
  id: string;
  type: LetterType;
  status: LetterStatus;
  title: string | null;
  recipientName: string;
  senderName: string;
  content: LetterContentV1;
  publishedAt: Date;
  expiresAt: Date | null;
  attachments: PublicAttachmentResponse[];
};

export type OpenedPublicAttachment = {
  attachment: PublicAttachmentResponse;
  stream: Readable;
};