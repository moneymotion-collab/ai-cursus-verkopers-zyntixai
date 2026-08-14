/**
 * Internal ZyntixAI IDs are UUIDs.
 * Provider external account IDs are provider-native and must not be coerced to UUID.
 */

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSocialUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

/**
 * Instagram professional account IDs are opaque provider strings (typically numeric).
 * Not application UUIDs.
 */
export const SOCIAL_EXTERNAL_ACCOUNT_ID_MAX_LENGTH = 128;

export function isSocialExternalAccountId(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return false;
  }
  if (trimmed.length > SOCIAL_EXTERNAL_ACCOUNT_ID_MAX_LENGTH) {
    return false;
  }
  if (trimmed !== value) {
    return false;
  }
  if (/\s/.test(trimmed)) {
    return false;
  }
  return true;
}

export function isApplicationUuidNotProviderAccountId(value: string): boolean {
  return isSocialUuid(value);
}
