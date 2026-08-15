/**
 * Dedicated Social credential AES-256 key parsing (SMM-B1.1-B).
 *
 * Canonical encoding: standard base64 (with padding) of exactly 32 bytes.
 * Does not hash, truncate, or pad a weak string into an AES key.
 * Does not reuse INVITE_CONTINUATION_SECRET.
 *
 * Resolve this only on the encrypt/decrypt path (lazy). Missing key must not
 * break unrelated pages while social connection gates are OFF.
 */

import "server-only";

export const SOCIAL_CREDENTIAL_KEY_BYTE_LENGTH = 32;
export const SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION = 1;

const STANDARD_BASE64_PATTERN = /^[A-Za-z0-9+/]+={0,2}$/;

export type SocialCredentialKeyParseFailureReason =
  | "missing"
  | "malformed"
  | "invalid_length";

export type SocialCredentialKeyParseResult =
  | { ok: true; key: Buffer; keyVersion: number }
  | { ok: false; reason: SocialCredentialKeyParseFailureReason };

export function parseSocialCredentialEncryptionKey(
  value: string | undefined | null,
): SocialCredentialKeyParseResult {
  if (typeof value !== "string") {
    return { ok: false, reason: "missing" };
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { ok: false, reason: "missing" };
  }
  if (!STANDARD_BASE64_PATTERN.test(trimmed)) {
    return { ok: false, reason: "malformed" };
  }
  let decoded: Buffer;
  try {
    decoded = Buffer.from(trimmed, "base64");
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (decoded.length !== SOCIAL_CREDENTIAL_KEY_BYTE_LENGTH) {
    return { ok: false, reason: "invalid_length" };
  }
  if (decoded.toString("base64") !== trimmed) {
    return { ok: false, reason: "malformed" };
  }
  return {
    ok: true,
    key: decoded,
    keyVersion: SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
  };
}

export function readSocialCredentialEncryptionKey(
  env: Record<string, string | undefined> = process.env,
  keyVersion: number = SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
): SocialCredentialKeyParseResult {
  if (keyVersion !== SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION) {
    return { ok: false, reason: "malformed" };
  }
  return parseSocialCredentialEncryptionKey(
    env.SOCIAL_CREDENTIAL_ENCRYPTION_KEY,
  );
}
