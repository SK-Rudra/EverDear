export const MAX_IMAGE_SIZE_BYTES =
  10 * 1024 * 1024;

export const MAX_VIDEO_SIZE_BYTES =
  75 * 1024 * 1024;

export const MAX_UPLOAD_SIZE_BYTES =
  MAX_VIDEO_SIZE_BYTES;

export const MAX_ATTACHMENTS_PER_LETTER = 8;

export const SUPPORTED_MEDIA_TYPES = {
  'image/jpeg': {
    type: 'IMAGE',
    extension: 'jpg',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
  },
  'image/png': {
    type: 'IMAGE',
    extension: 'png',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
  },
  'image/webp': {
    type: 'IMAGE',
    extension: 'webp',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
  },
  'image/gif': {
    type: 'IMAGE',
    extension: 'gif',
    maxSizeBytes: MAX_IMAGE_SIZE_BYTES,
  },
  'video/mp4': {
    type: 'VIDEO',
    extension: 'mp4',
    maxSizeBytes: MAX_VIDEO_SIZE_BYTES,
  },
  'video/webm': {
    type: 'VIDEO',
    extension: 'webm',
    maxSizeBytes: MAX_VIDEO_SIZE_BYTES,
  },
} as const;

export type SupportedMediaMimeType =
  keyof typeof SUPPORTED_MEDIA_TYPES;