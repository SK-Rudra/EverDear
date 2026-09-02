import type {
  ModerationActionType,
  PublicMessageStatus,
  ReportReason,
  ReportStatus,
} from '../generated/prisma/enums.js';

export type ModerationReportResponse = {
  id: string;
  reason: ReportReason;
  details: string | null;
  status: ReportStatus;
  createdAt: Date;
  resolvedAt: Date | null;
  resolver: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type ModerationMessageResponse = {
  id: string;
  content: string;
  displayLocation: string | null;
  status: PublicMessageStatus;
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  reportCount: number;
  pendingReportCount: number;
  reports: ModerationReportResponse[];
};

export type ModerationMessagePageResponse = {
  messages: ModerationMessageResponse[];
  nextCursor: string | null;
};

export type ModerationOverviewResponse = {
  messages: {
    pending: number;
    published: number;
    hidden: number;
    removed: number;
    expired: number;
  };
  reports: {
    pending: number;
    reviewed: number;
    dismissed: number;
    actioned: number;
  };
};

export type ModerationHistoryResponse = {
  id: string;
  action: ModerationActionType;
  note: string | null;
  previousState: string | null;
  nextState: string | null;
  createdAt: Date;
  actor: {
    id: string;
    name: string;
    email: string;
  } | null;
  message: {
    id: string;
    content: string;
  } | null;
  report: {
    id: string;
    reason: ReportReason;
  } | null;
};

export type ModerationHistoryPageResponse = {
  history: ModerationHistoryResponse[];
  nextCursor: string | null;
};