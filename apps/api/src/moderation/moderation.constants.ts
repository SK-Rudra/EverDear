export const MODERATION_MESSAGE_ACTIONS = [
  'PUBLISH',
  'HIDE',
  'RESTORE',
  'REMOVE',
] as const;

export type ModerationMessageAction =
  (typeof MODERATION_MESSAGE_ACTIONS)[number];

export const MODERATION_REPORT_RESOLUTIONS = [
  'REVIEWED',
  'DISMISSED',
  'ACTIONED',
] as const;

export type ModerationReportResolution =
  (typeof MODERATION_REPORT_RESOLUTIONS)[number];

export const MODERATION_MESSAGE_STATUSES = [
  'PENDING',
  'PUBLISHED',
  'HIDDEN',
  'REMOVED',
  'EXPIRED',
] as const;

export const MODERATION_REPORT_STATUSES = [
  'PENDING',
  'REVIEWED',
  'DISMISSED',
  'ACTIONED',
] as const;

export const MODERATION_ACTION_TYPES = [
  'MESSAGE_PUBLISHED',
  'MESSAGE_HIDDEN',
  'MESSAGE_RESTORED',
  'MESSAGE_REMOVED',
  'REPORT_REVIEWED',
  'REPORT_DISMISSED',
  'REPORT_ACTIONED',
] as const;

export const MODERATION_DEFAULT_PAGE_SIZE = 20;
export const MODERATION_MAX_PAGE_SIZE = 50;
export const MODERATION_NOTE_MAX_LENGTH = 500;