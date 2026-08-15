/**
 * Temporary signed Instagram provider media delivery (SMM-B1.7).
 * Private-by-default: Meta fetches a short-lived HMAC-signed HTTPS URL.
 * No permanent public bucket. Possession of storage_object_key alone is not auth.
 */

import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { createHash } from "node:crypto";
import { resolveSiteOrigin } from "@/lib/env/site-origin";

export const SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET_ENV =
  "SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET";

export const SOCIAL_MEDIA_PROVIDER_DELIVERY_PURPOSE =
  "instagram_provider_fetch" as const;

export const SOCIAL_MEDIA_PROVIDER_DELIVERY_PATH_PREFIX =
  "/api/social/media-delivery" as const;

/** Meta container processing can take minutes; keep URL valid for provider fetch window. */
export const SOCIAL_MEDIA_PROVIDER_DELIVERY_TTL_SECONDS = 60 * 60;

export type SocialMediaProviderDeliveryClaims = {
  v: 1;
  purpose: typeof SOCIAL_MEDIA_PROVIDER_DELIVERY_PURPOSE;
  organizationId: string;
  assetId: string;
  objectKeyHash: string;
  exp: number;
};

export type SocialMediaByteSource = {
  getObject(input: {
    organizationId: string;
    assetId: string;
    storageObjectKey: string;
  }): Promise<
    | { ok: true; bytes: Uint8Array; contentType: string }
    | { ok: false; reason: "not_found" | "unavailable" | "forbidden" }
  >;
};

export function hashStorageObjectKey(storageObjectKey: string): string {
  return createHash("sha256").update(storageObjectKey, "utf8").digest("hex");
}

function readDeliverySigningSecret(
  env: Record<string, string | undefined>,
): string | null {
  const value = env[SOCIAL_MEDIA_PROVIDER_DELIVERY_SIGNING_SECRET_ENV]?.trim();
  if (!value || value.length < 32) {
    return null;
  }
  return value;
}

function encodeTokenPayload(claims: SocialMediaProviderDeliveryClaims): string {
  return Buffer.from(JSON.stringify(claims), "utf8").toString("base64url");
}

function signPayload(payloadB64: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(payloadB64, "utf8")
    .digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    return false;
  }
  return timingSafeEqual(ab, bb);
}

export function mintSocialMediaProviderDeliveryUrl(input: {
  organizationId: string;
  assetId: string;
  storageObjectKey: string;
  now?: Date;
  ttlSeconds?: number;
  env?: Record<string, string | undefined>;
}):
  | { ok: true; url: string; expiresAt: number }
  | { ok: false; reason: "missing_signing_secret" | "invalid_origin" } {
  const env = input.env ?? process.env;
  const secret = readDeliverySigningSecret(env);
  if (!secret) {
    return { ok: false, reason: "missing_signing_secret" };
  }
  const origin = resolveSiteOrigin(env);
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
      // Production Meta fetch requires HTTPS; allow localhost only for local tests.
      if (parsed.protocol !== "http:" || parsed.hostname !== "localhost") {
        return { ok: false, reason: "invalid_origin" };
      }
    }
  } catch {
    return { ok: false, reason: "invalid_origin" };
  }

  const nowMs = (input.now ?? new Date()).getTime();
  const ttl = input.ttlSeconds ?? SOCIAL_MEDIA_PROVIDER_DELIVERY_TTL_SECONDS;
  const exp = Math.floor(nowMs / 1000) + ttl;
  const claims: SocialMediaProviderDeliveryClaims = {
    v: 1,
    purpose: SOCIAL_MEDIA_PROVIDER_DELIVERY_PURPOSE,
    organizationId: input.organizationId,
    assetId: input.assetId,
    objectKeyHash: hashStorageObjectKey(input.storageObjectKey),
    exp,
  };
  const payload = encodeTokenPayload(claims);
  const sig = signPayload(payload, secret);
  const token = `${payload}.${sig}`;
  const url = new URL(
    `${SOCIAL_MEDIA_PROVIDER_DELIVERY_PATH_PREFIX}/${token}`,
    origin.endsWith("/") ? origin : `${origin}/`,
  );
  return { ok: true, url: url.toString(), expiresAt: exp };
}

export function verifySocialMediaProviderDeliveryToken(input: {
  token: string;
  expectedStorageObjectKey?: string;
  now?: Date;
  env?: Record<string, string | undefined>;
}):
  | { ok: true; claims: SocialMediaProviderDeliveryClaims }
  | {
      ok: false;
      reason:
        | "missing_signing_secret"
        | "malformed"
        | "bad_signature"
        | "expired"
        | "purpose_mismatch"
        | "object_key_mismatch";
    } {
  const env = input.env ?? process.env;
  const secret = readDeliverySigningSecret(env);
  if (!secret) {
    return { ok: false, reason: "missing_signing_secret" };
  }
  const parts = input.token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: "malformed" };
  }
  const [payloadB64, sig] = parts;
  const expectedSig = signPayload(payloadB64, secret);
  if (!safeEqual(sig, expectedSig)) {
    return { ok: false, reason: "bad_signature" };
  }
  let claims: SocialMediaProviderDeliveryClaims;
  try {
    const parsed = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf8"),
    ) as SocialMediaProviderDeliveryClaims;
    if (
      parsed.v !== 1 ||
      typeof parsed.organizationId !== "string" ||
      typeof parsed.assetId !== "string" ||
      typeof parsed.objectKeyHash !== "string" ||
      typeof parsed.exp !== "number"
    ) {
      return { ok: false, reason: "malformed" };
    }
    claims = parsed;
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (claims.purpose !== SOCIAL_MEDIA_PROVIDER_DELIVERY_PURPOSE) {
    return { ok: false, reason: "purpose_mismatch" };
  }
  const nowSec = Math.floor((input.now ?? new Date()).getTime() / 1000);
  if (claims.exp < nowSec) {
    return { ok: false, reason: "expired" };
  }
  if (input.expectedStorageObjectKey) {
    const expectedHash = hashStorageObjectKey(input.expectedStorageObjectKey);
    if (expectedHash !== claims.objectKeyHash) {
      return { ok: false, reason: "object_key_mismatch" };
    }
  }
  return { ok: true, claims };
}

/** Fail-closed production byte source until a private storage backend is wired. */
export function createUnavailableSocialMediaByteSource(): SocialMediaByteSource {
  return {
    async getObject() {
      return { ok: false, reason: "unavailable" };
    },
  };
}
