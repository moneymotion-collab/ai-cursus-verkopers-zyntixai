import type { SocialOAuthIntentId } from "./types";

/**
 * Stored OAuth state fingerprint. Never the raw one-time secret.
 * Generation/hashing is B1.1-C. This slice only separates types.
 */
export type SocialOAuthStateFingerprint = string;

export const SOCIAL_OAUTH_STATE_FINGERPRINT_PATTERN = /^[0-9a-f]{64}$/;

export function isSocialOAuthStateFingerprint(
  value: unknown,
): value is SocialOAuthStateFingerprint {
  return (
    typeof value === "string" &&
    SOCIAL_OAUTH_STATE_FINGERPRINT_PATTERN.test(value)
  );
}

export type StoredSocialOAuthState = {
  intentId: SocialOAuthIntentId;
  stateFingerprint: SocialOAuthStateFingerprint;
};

/**
 * Raw OAuth state secret types live in `server/credential-secrets.ts`.
 * They must never appear on this domain module so client barrels cannot import them.
 */
export const SOCIAL_OAUTH_STATE_DOMAIN_FORBIDDEN_KEYS = [
  "rawState",
  "rawOAuthState",
  "stateSecret",
] as const;
