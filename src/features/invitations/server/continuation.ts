/**
 * Invitation continuation seal/unseal (Slice A).
 *
 * Authenticated encryption: AES-256-GCM via Node crypto.
 * Key: SHA-256 over purpose context + INVITE_CONTINUATION_SECRET.
 *
 * Payload holds only: version, raw token, issued/expiry timestamps, nonce.
 * Organization, role, email, and membership are NEVER stored as authority —
 * final Acceptance RPC remains authoritative.
 *
 * Server-only module: do not import from Client Components.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import type { NextResponse } from "next/server";

export const INVITE_CONTINUATION_COOKIE_NAME = "zyntix_invite_continuation";
export const INVITE_CONTINUATION_TTL_SECONDS = 1800;
export const INVITE_CONTINUATION_PAYLOAD_VERSION = 1;
export const INVITE_CONTINUATION_WIRE_PREFIX = "v1.";

/** Loop-breaker query on token-free destination after cookie clear. */
export const INVITE_CONTINUATION_CLEARED_QUERY = "cleared";
export const INVITE_CONTINUATION_CLEARED_VALUE = "1";

/** Purpose-bound key derivation context (do not reuse key for other features). */
export const INVITE_CONTINUATION_KEY_PURPOSE =
  "zyntixai.invite.continuation.aes-v1";

/** Minimum length for INVITE_CONTINUATION_SECRET (fail closed if shorter). */
export const INVITE_CONTINUATION_SECRET_MIN_LENGTH = 32;

export const INVITE_RAW_TOKEN_PATTERN = /^[0-9a-f]{64}$/;
export const INVITE_CONTINUATION_NONCE_PATTERN = /^[0-9a-f]{32}$/;

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const NONCE_LENGTH_BYTES = 16;
/** Unix-seconds sanity ceiling (rejects millisecond-confused timestamps). */
const MAX_UNIX_SECONDS = 4_102_444_800; // 2100-01-01 UTC

type ContinuationPayloadV1 = {
  v: typeof INVITE_CONTINUATION_PAYLOAD_VERSION;
  token: string;
  iat: number;
  exp: number;
  nonce: string;
};

export type InvitationContinuationSealSuccess = {
  ok: true;
  cookieValue: string;
  maxAge: number;
  expiresAt: number;
};

export type InvitationContinuationSealFailure = {
  ok: false;
  reason: "invalid_token" | "secret_unavailable";
};

export type InvitationContinuationSealResult =
  | InvitationContinuationSealSuccess
  | InvitationContinuationSealFailure;

export type InvitationContinuationUnsealSuccess = {
  ok: true;
  rawToken: string;
  issuedAt: number;
  expiresAt: number;
};

export type InvitationContinuationUnsealFailure = {
  ok: false;
  reason: "unavailable";
};

export type InvitationContinuationUnsealResult =
  | InvitationContinuationUnsealSuccess
  | InvitationContinuationUnsealFailure;

export function isInvitationRawTokenShape(value: unknown): value is string {
  return typeof value === "string" && INVITE_RAW_TOKEN_PATTERN.test(value);
}

/**
 * Derive a 32-byte AES-256 key:
 * SHA-256( purpose_utf8 || 0x00 || secret_utf8 )
 */
export function deriveInvitationContinuationKey(secret: string): Buffer {
  return createHash("sha256")
    .update(INVITE_CONTINUATION_KEY_PURPOSE, "utf8")
    .update(Buffer.from([0]))
    .update(secret, "utf8")
    .digest();
}

export function readInvitationContinuationSecret(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const raw = env.INVITE_CONTINUATION_SECRET;
  if (typeof raw !== "string") {
    return null;
  }
  if (raw.length < INVITE_CONTINUATION_SECRET_MIN_LENGTH) {
    return null;
  }
  return raw;
}

function encodeBase64Url(buffer: Buffer): string {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string): Buffer | null {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    return null;
  }
  const padded = value + "=".repeat((4 - (value.length % 4)) % 4);
  try {
    return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  } catch {
    return null;
  }
}

export function sealInvitationContinuation(
  rawToken: string,
  options?: {
    nowMs?: number;
    secret?: string | null;
    env?: Record<string, string | undefined>;
  },
): InvitationContinuationSealResult {
  if (!isInvitationRawTokenShape(rawToken)) {
    return { ok: false, reason: "invalid_token" };
  }

  const secret =
    options?.secret !== undefined
      ? options.secret
      : readInvitationContinuationSecret(options?.env ?? process.env);
  if (secret === null) {
    return { ok: false, reason: "secret_unavailable" };
  }

  const nowMs = options?.nowMs ?? Date.now();
  const issuedAt = Math.floor(nowMs / 1000);
  const expiresAt = issuedAt + INVITE_CONTINUATION_TTL_SECONDS;
  const nonce = randomBytes(NONCE_LENGTH_BYTES).toString("hex");

  const payload: ContinuationPayloadV1 = {
    v: INVITE_CONTINUATION_PAYLOAD_VERSION,
    token: rawToken,
    iat: issuedAt,
    exp: expiresAt,
    nonce,
  };

  const key = deriveInvitationContinuationKey(secret);
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(AES_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES,
  });
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, ciphertext, authTag]);

  return {
    ok: true,
    cookieValue: `${INVITE_CONTINUATION_WIRE_PREFIX}${encodeBase64Url(packed)}`,
    maxAge: INVITE_CONTINUATION_TTL_SECONDS,
    expiresAt,
  };
}

export function unsealInvitationContinuation(
  cookieValue: string | undefined | null,
  options?: {
    nowMs?: number;
    secret?: string | null;
    env?: Record<string, string | undefined>;
  },
): InvitationContinuationUnsealResult {
  if (typeof cookieValue !== "string" || cookieValue.length === 0) {
    return { ok: false, reason: "unavailable" };
  }

  const secret =
    options?.secret !== undefined
      ? options.secret
      : readInvitationContinuationSecret(options?.env ?? process.env);
  if (secret === null) {
    return { ok: false, reason: "unavailable" };
  }

  if (!cookieValue.startsWith(INVITE_CONTINUATION_WIRE_PREFIX)) {
    return { ok: false, reason: "unavailable" };
  }

  const encoded = cookieValue.slice(INVITE_CONTINUATION_WIRE_PREFIX.length);
  // Strict single-segment wire body (no extra '.' segments).
  if (encoded.length === 0 || encoded.includes(".")) {
    return { ok: false, reason: "unavailable" };
  }

  const packed = decodeBase64Url(encoded);
  const minimumPackedLength =
    IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES + 1; // non-empty ciphertext
  if (packed === null || packed.length < minimumPackedLength) {
    return { ok: false, reason: "unavailable" };
  }

  const iv = packed.subarray(0, IV_LENGTH_BYTES);
  const authTag = packed.subarray(packed.length - AUTH_TAG_LENGTH_BYTES);
  const ciphertext = packed.subarray(
    IV_LENGTH_BYTES,
    packed.length - AUTH_TAG_LENGTH_BYTES,
  );

  try {
    const key = deriveInvitationContinuationKey(secret);
    const decipher = createDecipheriv(AES_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    decipher.setAuthTag(authTag);
    // final() verifies the GCM auth tag before plaintext is trusted.
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    const parsed: unknown = JSON.parse(plaintext.toString("utf8"));
    if (!isContinuationPayloadV1(parsed)) {
      return { ok: false, reason: "unavailable" };
    }

    if (!isInvitationRawTokenShape(parsed.token)) {
      return { ok: false, reason: "unavailable" };
    }

    const nowMs = options?.nowMs ?? Date.now();
    const nowSec = Math.floor(nowMs / 1000);
    if (!isContinuationFresh(parsed.iat, parsed.exp, nowSec)) {
      return { ok: false, reason: "unavailable" };
    }

    return {
      ok: true,
      rawToken: parsed.token,
      issuedAt: parsed.iat,
      expiresAt: parsed.exp,
    };
  } catch {
    // Never surface decrypted plaintext or crypto internals.
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Presence check for token-free UI — does not return the raw token.
 */
export function hasValidInvitationContinuation(
  cookieValue: string | undefined | null,
  options?: {
    nowMs?: number;
    secret?: string | null;
    env?: Record<string, string | undefined>;
  },
): boolean {
  return unsealInvitationContinuation(cookieValue, options).ok;
}

function isContinuationPayloadV1(value: unknown): value is ContinuationPayloadV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (
    record.v !== INVITE_CONTINUATION_PAYLOAD_VERSION ||
    typeof record.token !== "string" ||
    typeof record.iat !== "number" ||
    typeof record.exp !== "number" ||
    typeof record.nonce !== "string"
  ) {
    return false;
  }

  if (
    !Number.isInteger(record.iat) ||
    !Number.isInteger(record.exp) ||
    !Number.isFinite(record.iat) ||
    !Number.isFinite(record.exp)
  ) {
    return false;
  }

  if (
    record.iat < 0 ||
    record.exp < 0 ||
    record.iat > MAX_UNIX_SECONDS ||
    record.exp > MAX_UNIX_SECONDS
  ) {
    return false;
  }

  // Payload expiry is authoritative; bound lifetime to configured TTL.
  if (record.exp <= record.iat) {
    return false;
  }
  if (record.exp - record.iat > INVITE_CONTINUATION_TTL_SECONDS) {
    return false;
  }

  if (!INVITE_CONTINUATION_NONCE_PATTERN.test(record.nonce)) {
    return false;
  }

  if (
    "organization_id" in record ||
    "organizationId" in record ||
    "role" in record ||
    "email" in record ||
    "user_id" in record ||
    "userId" in record ||
    "membership_id" in record ||
    "membershipId" in record ||
    "inviter" in record
  ) {
    return false;
  }

  return true;
}

function isContinuationFresh(iat: number, exp: number, nowSec: number): boolean {
  if (exp <= nowSec) {
    return false;
  }
  // Reject far-future issued-at (clock skew allowance: 60s).
  if (iat > nowSec + 60) {
    return false;
  }
  return true;
}

export type InvitationContinuationCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
  expires?: Date;
};

export function buildInvitationContinuationCookieOptions(
  maxAge: number,
  secure: boolean,
): InvitationContinuationCookieOptions {
  const options: InvitationContinuationCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure,
  };
  // Clearing must use the same Path=/ identity as set; Expires=epoch aids deletion.
  if (maxAge <= 0) {
    options.expires = new Date(0);
  }
  return options;
}

export function shouldUseSecureInvitationContinuationCookie(
  requestUrl: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (nodeEnv === "production") {
    return true;
  }
  try {
    return new URL(requestUrl).protocol === "https:";
  } catch {
    return false;
  }
}

export function applyInvitationContinuationCookie(
  response: NextResponse,
  cookieValue: string,
  maxAge: number,
  secure: boolean,
): void {
  response.cookies.set(
    INVITE_CONTINUATION_COOKIE_NAME,
    cookieValue,
    buildInvitationContinuationCookieOptions(maxAge, secure),
  );
}

export function clearInvitationContinuationCookie(
  response: NextResponse,
  secure: boolean,
): void {
  response.cookies.set(
    INVITE_CONTINUATION_COOKIE_NAME,
    "",
    buildInvitationContinuationCookieOptions(0, secure),
  );
}

/** Test helper: constant-time compare of equal-length buffers. */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}
