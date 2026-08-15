/**
 * Fail-closed Social Connection feature gates.
 * Missing/malformed values mean OFF. No gate is ON by default.
 * Publishing gates belong to later slices.
 */

export const SOCIAL_CONNECTIONS_ENABLED_ENV = "SOCIAL_CONNECTIONS_ENABLED";
export const SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED_ENV =
  "SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED";

/**
 * Conceptual encryption-key name for Option A (OD-SMM-9).
 * Do not create or request the secret in this slice.
 * Must not reuse INVITE_CONTINUATION_SECRET.
 */
export const SOCIAL_CREDENTIAL_ENCRYPTION_KEY_ENV =
  "SOCIAL_CREDENTIAL_ENCRYPTION_KEY";

/** Server-only Instagram Login app id (never NEXT_PUBLIC_). */
export const SOCIAL_INSTAGRAM_CLIENT_ID_ENV = "SOCIAL_INSTAGRAM_CLIENT_ID";

/** Server-only Instagram Login app secret (never NEXT_PUBLIC_). */
export const SOCIAL_INSTAGRAM_CLIENT_SECRET_ENV =
  "SOCIAL_INSTAGRAM_CLIENT_SECRET";

/** Optional exact redirect URI override; otherwise derived from site origin. */
export const SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI_ENV =
  "SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI";

/** HMAC secret for temporary Instagram provider media delivery URLs (SMM-B1.7). */
export const SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET_ENV =
  "SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET";

export function parseSocialConnectionsEnabled(
  value: string | undefined | null,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function parseSocialInstagramConnectionsEnabled(
  value: string | undefined | null,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function areSocialInstagramConnectionsEnabled(input: {
  connectionsEnabled: string | undefined | null;
  instagramEnabled: string | undefined | null;
}): boolean {
  return (
    parseSocialConnectionsEnabled(input.connectionsEnabled) &&
    parseSocialInstagramConnectionsEnabled(input.instagramEnabled)
  );
}
