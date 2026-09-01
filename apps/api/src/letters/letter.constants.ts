export const LETTER_TYPES = [
  'LOVED',
  'FRIEND',
  'FAMILY',
] as const;

export type LetterTypeValue =
  (typeof LETTER_TYPES)[number];

export const LETTER_BODY_MAX_LENGTH = 20_000;