import type {
  LetterStatus,
  LetterType,
} from '../generated/prisma/enums.js';

export type LetterContentV1 = {
  version: 1;
  body: string;
};

export type LetterResponse = {
  id: string;
  type: LetterType;
  status: LetterStatus;
  title: string | null;
  recipientName: string;
  senderName: string;
  content: LetterContentV1;
  publishedAt: Date | null;
  firstViewedAt: Date | null;
  lastViewedAt: Date | null;
  viewCount: number;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};