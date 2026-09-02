const STORAGE_KEY_PATTERN =
  /^[a-zA-Z0-9][a-zA-Z0-9/._-]*$/;

export function assertMediaStorageKey(
  storageKey: string,
): void {
  if (
    !STORAGE_KEY_PATTERN.test(storageKey) ||
    storageKey.includes('..')
  ) {
    throw new Error(
      'Invalid media storage key.',
    );
  }
}