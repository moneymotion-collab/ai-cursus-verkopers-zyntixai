/**
 * Cryptographic OAuth state generation for Instagram Login (SMM-B1.1-C).
 *
 * Raw state is opaque, high-entropy, and never persisted.
 * Only SHA-256 hex fingerprint is stored via the B1.1-B intent foundation.
 *
 * Do not put organization, user, account, or authorization decisions into state.
 */

import "server-only";

import { createHash, randomBytes } from "node:crypto";
import {
  isSocialOAuthStateFingerprint,
  type SocialOAuthStateFingerprint,
} from "@/features/social-media/domain/oauth-state";
import type { RawSocialOAuthStateSecret } from "@/features/social-media/server/credential-secrets";

/** 32 cryptographically random bytes → 64 hex chars. */
export const SOCIAL_OAUTH_RAW_STATE_BYTE_LENGTH = 32;

export type GeneratedSocialOAuthState = {
  rawState: RawSocialOAuthStateSecret;
  fingerprint: SocialOAuthStateFingerprint;
};

export function createRawSocialOAuthStateSecret(
  value: string,
): RawSocialOAuthStateSecret {
  return {
    __brand: "RawSocialOAuthStateSecret",
    value,
  };
}

export function fingerprintSocialOAuthRawState(
  rawState: string | RawSocialOAuthStateSecret,
): SocialOAuthStateFingerprint | null {
  const value =
    typeof rawState === "string"
      ? rawState
      : isRawStateShape(rawState)
        ? rawState.value
        : null;
  if (value == null || value.length === 0) {
    return null;
  }
  const digest = createHash("sha256").update(value, "utf8").digest("hex");
  if (!isSocialOAuthStateFingerprint(digest)) {
    return null;
  }
  return digest;
}

export function generateSocialOAuthState(): GeneratedSocialOAuthState {
  const value = randomBytes(SOCIAL_OAUTH_RAW_STATE_BYTE_LENGTH).toString("hex");
  const fingerprint = fingerprintSocialOAuthRawState(value);
  if (!fingerprint) {
    throw new Error("social_oauth_state_fingerprint_failed");
  }
  return {
    rawState: createRawSocialOAuthStateSecret(value),
    fingerprint,
  };
}

function isRawStateShape(value: unknown): value is RawSocialOAuthStateSecret {
  return (
    typeof value === "object" &&
    value !== null &&
    "__brand" in value &&
    (value as RawSocialOAuthStateSecret).__brand ===
      "RawSocialOAuthStateSecret" &&
    "value" in value &&
    typeof (value as RawSocialOAuthStateSecret).value === "string"
  );
}
