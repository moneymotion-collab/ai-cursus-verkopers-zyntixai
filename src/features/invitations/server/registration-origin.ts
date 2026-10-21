/**
 * Invitation registration-origin seal/unseal (Slice B).
 *
 * Proves invite-gated signup lifecycle through delayed email verification.
 * Suppresses AUTOMATIC owner provisioning only — never grants org/role/Accept.
 *
 * AES-256-GCM via Node crypto. Base secret: INVITE_CONTINUATION_SECRET.
 * KDF purpose DISTINCT from Slice-A continuation.
 *
 * Server-only: do not import from Client Components.
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { NextResponse } from "next/server";
import {
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  readInvitationContinuationSecret,
} from "@/features/invitations/server/continuation";

export const INVITE_REGISTRATION_ORIGIN_COOKIE_NAME =
  "zyntix_invite_registration_origin";
export const INVITE_REGISTRATION_ORIGIN_TTL_SECONDS = 172_800; // 48 hours
export const INVITE_REGISTRATION_ORIGIN_PAYLOAD_VERSION = 1;
export const INVITE_REGISTRATION_ORIGIN_WIRE_PREFIX = "v1.";
export const INVITE_REGISTRATION_ORIGIN_KIND = "invitation_registration";

/** Purpose-bound KDF — must differ from Slice-A continuation purpose. */
export const INVITE_REGISTRATION_ORIGIN_KEY_PURPOSE =
  "zyntixai.invite.registration-origin.aes-v1";

export const INVITE_REGISTRATION_ORIGIN_NONCE_PATTERN = /^[0-9a-f]{32}$/;
export const INVITE_REGISTRATION_ORIGIN_USER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;
const NONCE_LENGTH_BYTES = 16;
const MAX_UNIX_SECONDS = 4_102_444_800;

type RegistrationOriginPayloadV1 = {
  v: typeof INVITE_REGISTRATION_ORIGIN_PAYLOAD_VERSION;
  kind: typeof INVITE_REGISTRATION_ORIGIN_KIND;
  created_user_id: string;
  iat: number;
  exp: number;
  nonce: string;
};

export type InvitationRegistrationOriginSealResult =
  | {
      ok: true;
      cookieValue: string;
      maxAge: number;
      expiresAt: number;
    }
  | { ok: false; reason: "invalid_user" | "secret_unavailable" };

export type InvitationRegistrationOriginUnsealResult =
  | {
      ok: true;
      createdUserId: string;
      issuedAt: number;
      expiresAt: number;
    }
  | { ok: false; reason: "unavailable" };

export function deriveInvitationRegistrationOriginKey(secret: string): Buffer {
  return createHash("sha256")
    .update(INVITE_REGISTRATION_ORIGIN_KEY_PURPOSE, "utf8")
    .update(Buffer.from([0]))
    .update(secret, "utf8")
    .digest();
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

export function isRealNewAuthIdentity(
  user: {
    id?: string | null;
    identities?: unknown;
  } | null | undefined,
): user is { id: string; identities: unknown[] } {
  if (!user || typeof user.id !== "string" || user.id.length === 0) {
    return false;
  }
  if (!INVITE_REGISTRATION_ORIGIN_USER_ID_PATTERN.test(user.id)) {
    return false;
  }
  return Array.isArray(user.identities) && user.identities.length > 0;
}

export function sealInvitationRegistrationOrigin(
  createdUserId: string,
  options?: {
    nowMs?: number;
    secret?: string | null;
    env?: Record<string, string | undefined>;
  },
): InvitationRegistrationOriginSealResult {
  if (!INVITE_REGISTRATION_ORIGIN_USER_ID_PATTERN.test(createdUserId)) {
    return { ok: false, reason: "invalid_user" };
  }

  const secret =
    options?.secret !== undefined
      ? options.secret
      : readInvitationContinuationSecret(options?.env ?? process.env);
  if (secret === null || secret.length < INVITE_CONTINUATION_SECRET_MIN_LENGTH) {
    return { ok: false, reason: "secret_unavailable" };
  }

  const nowMs = options?.nowMs ?? Date.now();
  const issuedAt = Math.floor(nowMs / 1000);
  const expiresAt = issuedAt + INVITE_REGISTRATION_ORIGIN_TTL_SECONDS;
  const nonce = randomBytes(NONCE_LENGTH_BYTES).toString("hex");

  const payload: RegistrationOriginPayloadV1 = {
    v: INVITE_REGISTRATION_ORIGIN_PAYLOAD_VERSION,
    kind: INVITE_REGISTRATION_ORIGIN_KIND,
    created_user_id: createdUserId,
    iat: issuedAt,
    exp: expiresAt,
    nonce,
  };

  const key = deriveInvitationRegistrationOriginKey(secret);
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
    cookieValue: `${INVITE_REGISTRATION_ORIGIN_WIRE_PREFIX}${encodeBase64Url(packed)}`,
    maxAge: INVITE_REGISTRATION_ORIGIN_TTL_SECONDS,
    expiresAt,
  };
}

export function unsealInvitationRegistrationOrigin(
  cookieValue: string | undefined | null,
  options?: {
    nowMs?: number;
    secret?: string | null;
    env?: Record<string, string | undefined>;
  },
): InvitationRegistrationOriginUnsealResult {
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

  if (!cookieValue.startsWith(INVITE_REGISTRATION_ORIGIN_WIRE_PREFIX)) {
    return { ok: false, reason: "unavailable" };
  }

  const encoded = cookieValue.slice(INVITE_REGISTRATION_ORIGIN_WIRE_PREFIX.length);
  if (encoded.length === 0 || encoded.includes(".")) {
    return { ok: false, reason: "unavailable" };
  }

  const packed = decodeBase64Url(encoded);
  const minimumPackedLength = IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES + 1;
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
    const key = deriveInvitationRegistrationOriginKey(secret);
    const decipher = createDecipheriv(AES_ALGORITHM, key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    const parsed: unknown = JSON.parse(plaintext.toString("utf8"));
    if (!isRegistrationOriginPayloadV1(parsed)) {
      return { ok: false, reason: "unavailable" };
    }

    const nowSec = Math.floor((options?.nowMs ?? Date.now()) / 1000);
    if (parsed.exp <= nowSec || parsed.iat > nowSec + 60) {
      return { ok: false, reason: "unavailable" };
    }

    return {
      ok: true,
      createdUserId: parsed.created_user_id,
      issuedAt: parsed.iat,
      expiresAt: parsed.exp,
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

/**
 * Trust only when sealed origin binds to the current authenticated user.
 */
export function isBoundInvitationRegistrationOrigin(
  cookieValue: string | undefined | null,
  authenticatedUserId: string | null | undefined,
  options?: {
    nowMs?: number;
    secret?: string | null;
    env?: Record<string, string | undefined>;
  },
): boolean {
  if (typeof authenticatedUserId !== "string" || authenticatedUserId.length === 0) {
    return false;
  }
  const unsealed = unsealInvitationRegistrationOrigin(cookieValue, options);
  return unsealed.ok && unsealed.createdUserId === authenticatedUserId;
}

function isRegistrationOriginPayloadV1(
  value: unknown,
): value is RegistrationOriginPayloadV1 {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (
    record.v !== INVITE_REGISTRATION_ORIGIN_PAYLOAD_VERSION ||
    record.kind !== INVITE_REGISTRATION_ORIGIN_KIND ||
    typeof record.created_user_id !== "string" ||
    typeof record.iat !== "number" ||
    typeof record.exp !== "number" ||
    typeof record.nonce !== "string"
  ) {
    return false;
  }
  if (
    !Number.isInteger(record.iat) ||
    !Number.isInteger(record.exp) ||
    record.iat < 0 ||
    record.exp < 0 ||
    record.iat > MAX_UNIX_SECONDS ||
    record.exp > MAX_UNIX_SECONDS ||
    record.exp <= record.iat ||
    record.exp - record.iat > INVITE_REGISTRATION_ORIGIN_TTL_SECONDS ||
    !INVITE_REGISTRATION_ORIGIN_NONCE_PATTERN.test(record.nonce) ||
    !INVITE_REGISTRATION_ORIGIN_USER_ID_PATTERN.test(record.created_user_id)
  ) {
    return false;
  }
  if (
    "token" in record ||
    "organization_id" in record ||
    "role" in record ||
    "email" in record ||
    "invitation_id" in record ||
    "membership_id" in record
  ) {
    return false;
  }
  return true;
}

export type InvitationRegistrationOriginCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
  expires?: Date;
};

export function buildInvitationRegistrationOriginCookieOptions(
  maxAge: number,
  secure: boolean,
): InvitationRegistrationOriginCookieOptions {
  const options: InvitationRegistrationOriginCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure,
  };
  if (maxAge <= 0) {
    options.expires = new Date(0);
  }
  return options;
}

export function applyInvitationRegistrationOriginCookie(
  response: NextResponse,
  cookieValue: string,
  maxAge: number,
  secure: boolean,
): void {
  response.cookies.set(
    INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
    cookieValue,
    buildInvitationRegistrationOriginCookieOptions(maxAge, secure),
  );
}

export function clearInvitationRegistrationOriginCookie(
  response: NextResponse,
  secure: boolean,
): void {
  response.cookies.set(
    INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
    "",
    buildInvitationRegistrationOriginCookieOptions(0, secure),
  );
}
