import { afterEach, describe, expect, it } from "vitest";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  buildInvitationContinuationCookieOptions,
  deriveInvitationContinuationKey,
  hasValidInvitationContinuation,
  INVITE_CONTINUATION_COOKIE_NAME,
  INVITE_CONTINUATION_KEY_PURPOSE,
  INVITE_CONTINUATION_PAYLOAD_VERSION,
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  INVITE_CONTINUATION_TTL_SECONDS,
  INVITE_CONTINUATION_WIRE_PREFIX,
  isInvitationRawTokenShape,
  readInvitationContinuationSecret,
  sealInvitationContinuation,
  shouldUseSecureInvitationContinuationCookie,
  unsealInvitationContinuation,
} from "@/features/invitations/server/continuation";

const TEST_SECRET = "a".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH);
const VALID_TOKEN = "ab".repeat(32); // 64 lowercase hex

function decodeWire(cookieValue: string): Buffer {
  const encoded = cookieValue.slice(INVITE_CONTINUATION_WIRE_PREFIX.length);
  const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
  return Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

describe("invitation raw token shape", () => {
  it("accepts exactly 64 lowercase hex characters", () => {
    expect(isInvitationRawTokenShape(VALID_TOKEN)).toBe(true);
  });

  it("rejects uppercase, short, long, and non-hex values", () => {
    expect(isInvitationRawTokenShape(VALID_TOKEN.toUpperCase())).toBe(false);
    expect(isInvitationRawTokenShape(VALID_TOKEN.slice(0, 63))).toBe(false);
    expect(isInvitationRawTokenShape(`${VALID_TOKEN}a`)).toBe(false);
    expect(isInvitationRawTokenShape("gg".repeat(32))).toBe(false);
    expect(isInvitationRawTokenShape(null)).toBe(false);
    expect(isInvitationRawTokenShape(undefined)).toBe(false);
  });
});

describe("invitation continuation secret handling", () => {
  const previous = process.env.INVITE_CONTINUATION_SECRET;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.INVITE_CONTINUATION_SECRET;
    } else {
      process.env.INVITE_CONTINUATION_SECRET = previous;
    }
  });

  it("fails closed when secret is missing, empty, or too short", () => {
    expect(readInvitationContinuationSecret({})).toBeNull();
    expect(readInvitationContinuationSecret({ INVITE_CONTINUATION_SECRET: "" })).toBeNull();
    expect(
      readInvitationContinuationSecret({
        INVITE_CONTINUATION_SECRET: "short",
      }),
    ).toBeNull();
    expect(
      sealInvitationContinuation(VALID_TOKEN, { secret: null }).ok,
    ).toBe(false);
    expect(
      sealInvitationContinuation(VALID_TOKEN, {
        env: { INVITE_CONTINUATION_SECRET: "" },
      }),
    ).toEqual({ ok: false, reason: "secret_unavailable" });
  });

  it("does not fall back to a default or hardcoded product secret", () => {
    delete process.env.INVITE_CONTINUATION_SECRET;
    const sealed = sealInvitationContinuation(VALID_TOKEN);
    expect(sealed).toEqual({ ok: false, reason: "secret_unavailable" });
  });
});

describe("invitation continuation crypto", () => {
  it("derives a 32-byte purpose-bound AES key via SHA-256", () => {
    const key = deriveInvitationContinuationKey(TEST_SECRET);
    expect(key).toHaveLength(32);
    expect(INVITE_CONTINUATION_KEY_PURPOSE).toContain("invite.continuation");
    const other = deriveInvitationContinuationKey(`${TEST_SECRET}x`);
    expect(key.equals(other)).toBe(false);
  });

  it("round-trips seal and unseal", () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
      nowMs: 1_700_000_000_000,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    expect(sealed.cookieValue.startsWith(INVITE_CONTINUATION_WIRE_PREFIX)).toBe(
      true,
    );
    expect(sealed.maxAge).toBe(INVITE_CONTINUATION_TTL_SECONDS);
    expect(sealed.cookieValue).not.toContain(VALID_TOKEN);

    const unsealed = unsealInvitationContinuation(sealed.cookieValue, {
      secret: TEST_SECRET,
      nowMs: 1_700_000_000_000,
    });
    expect(unsealed).toEqual({
      ok: true,
      rawToken: VALID_TOKEN,
      issuedAt: 1_700_000_000,
      expiresAt: 1_700_000_000 + INVITE_CONTINUATION_TTL_SECONDS,
    });
  });

  it("rejects tampered ciphertext, IV, and auth tag", () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    const packed = Buffer.from(decodeWire(sealed.cookieValue));
    packed[packed.length - 1] ^= 0xff;
    const tamperedTag = `${INVITE_CONTINUATION_WIRE_PREFIX}${packed
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "")}`;
    expect(
      unsealInvitationContinuation(tamperedTag, { secret: TEST_SECRET }).ok,
    ).toBe(false);

    const packedIv = Buffer.from(decodeWire(sealed.cookieValue));
    packedIv[0] ^= 0xff;
    const tamperedIv = `${INVITE_CONTINUATION_WIRE_PREFIX}${packedIv
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/g, "")}`;
    expect(
      unsealInvitationContinuation(tamperedIv, { secret: TEST_SECRET }).ok,
    ).toBe(false);
  });

  it("rejects expired continuation and foreign secrets", () => {
    const issuedAtMs = 1_700_000_000_000;
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
      nowMs: issuedAtMs,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    expect(
      unsealInvitationContinuation(sealed.cookieValue, {
        secret: TEST_SECRET,
        nowMs: issuedAtMs + INVITE_CONTINUATION_TTL_SECONDS * 1000,
      }).ok,
    ).toBe(false);

    expect(
      unsealInvitationContinuation(sealed.cookieValue, {
        secret: "b".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH),
        nowMs: issuedAtMs,
      }).ok,
    ).toBe(false);
  });

  it("stores only versioned continuation fields without org/role/email authority", () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
      nowMs: 1_700_000_000_000,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    // Decrypt with known key to inspect plaintext fields (test-only).
    const packed = decodeWire(sealed.cookieValue);
    const iv = packed.subarray(0, 12);
    const tag = packed.subarray(packed.length - 16);
    const ciphertext = packed.subarray(12, packed.length - 16);
    const key = deriveInvitationContinuationKey(TEST_SECRET);
    const decipher = createDecipheriv("aes-256-gcm", key, iv, {
      authTagLength: 16,
    });
    decipher.setAuthTag(tag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]).toString("utf8");
    const payload = JSON.parse(plaintext) as Record<string, unknown>;

    expect(payload).toEqual({
      v: INVITE_CONTINUATION_PAYLOAD_VERSION,
      token: VALID_TOKEN,
      iat: 1_700_000_000,
      exp: 1_700_000_000 + INVITE_CONTINUATION_TTL_SECONDS,
      nonce: expect.any(String),
    });
    expect(payload).not.toHaveProperty("organization_id");
    expect(payload).not.toHaveProperty("organizationId");
    expect(payload).not.toHaveProperty("role");
    expect(payload).not.toHaveProperty("email");
    expect(payload).not.toHaveProperty("user_id");
  });

  it("presence helper does not expose raw token metadata", () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    expect(hasValidInvitationContinuation(sealed.cookieValue, { secret: TEST_SECRET })).toBe(
      true,
    );
    expect(hasValidInvitationContinuation("tampered", { secret: TEST_SECRET })).toBe(
      false,
    );
  });

  it("enforces TTL in unix seconds (not milliseconds) for ~30 minutes", () => {
    const issuedAtMs = 1_700_000_000_000;
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
      nowMs: issuedAtMs,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    expect(sealed.expiresAt - Math.floor(issuedAtMs / 1000)).toBe(1800);
    expect(INVITE_CONTINUATION_TTL_SECONDS).toBe(1800);

    expect(
      unsealInvitationContinuation(sealed.cookieValue, {
        secret: TEST_SECRET,
        nowMs: issuedAtMs + 1_799_000,
      }).ok,
    ).toBe(true);

    expect(
      unsealInvitationContinuation(sealed.cookieValue, {
        secret: TEST_SECRET,
        nowMs: issuedAtMs + 1_800_000,
      }).ok,
    ).toBe(false);
  });

  it("rejects over-TTL, inverted, and millisecond-confused payloads after GCM auth", () => {
    function sealRawPayload(payload: Record<string, unknown>): string {
      const key = deriveInvitationContinuationKey(TEST_SECRET);
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv, { authTagLength: 16 });
      const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
      const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
      const tag = cipher.getAuthTag();
      const packed = Buffer.concat([iv, ciphertext, tag]);
      return `${INVITE_CONTINUATION_WIRE_PREFIX}${packed
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/g, "")}`;
    }

    const nowSec = 1_700_000_000;
    const base = {
      v: INVITE_CONTINUATION_PAYLOAD_VERSION,
      token: VALID_TOKEN,
      nonce: "ab".repeat(16),
    };

    expect(
      unsealInvitationContinuation(
        sealRawPayload({
          ...base,
          iat: nowSec,
          exp: nowSec + INVITE_CONTINUATION_TTL_SECONDS + 1,
        }),
        { secret: TEST_SECRET, nowMs: nowSec * 1000 },
      ).ok,
    ).toBe(false);

    expect(
      unsealInvitationContinuation(
        sealRawPayload({ ...base, iat: nowSec, exp: nowSec }),
        { secret: TEST_SECRET, nowMs: nowSec * 1000 },
      ).ok,
    ).toBe(false);

    // Millisecond-confused iat/exp must fail closed (not ~30,000 minutes).
    expect(
      unsealInvitationContinuation(
        sealRawPayload({
          ...base,
          iat: nowSec * 1000,
          exp: nowSec * 1000 + 1800,
        }),
        { secret: TEST_SECRET, nowMs: nowSec * 1000 },
      ).ok,
    ).toBe(false);
  });

  it("rejects malformed wire versions and extra segments", () => {
    expect(
      unsealInvitationContinuation(`v2.${"aa".repeat(40)}`, {
        secret: TEST_SECRET,
      }).ok,
    ).toBe(false);
    expect(
      unsealInvitationContinuation(`${INVITE_CONTINUATION_WIRE_PREFIX}abc.def`, {
        secret: TEST_SECRET,
      }).ok,
    ).toBe(false);
  });
});

describe("invitation continuation cookie policy", () => {
  it("configures HttpOnly, SameSite=Lax, Path=/, short Max-Age, no Domain", () => {
    const options = buildInvitationContinuationCookieOptions(
      INVITE_CONTINUATION_TTL_SECONDS,
      true,
    );
    expect(options).toEqual({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: INVITE_CONTINUATION_TTL_SECONDS,
      secure: true,
    });
    expect(options).not.toHaveProperty("domain");
    expect(options).not.toHaveProperty("expires");
    expect(INVITE_CONTINUATION_COOKIE_NAME).toBe("zyntix_invite_continuation");
  });

  it("clears with matching Path=/ and epoch Expires/Max-Age=0", () => {
    const clearOptions = buildInvitationContinuationCookieOptions(0, true);
    expect(clearOptions).toMatchObject({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      secure: true,
    });
    expect(clearOptions.expires?.getTime()).toBe(0);
    expect(clearOptions).not.toHaveProperty("domain");
  });

  it("uses Secure in production and on HTTPS request URLs", () => {
    expect(
      shouldUseSecureInvitationContinuationCookie(
        "http://localhost:3000/invite/accept/exchange",
        "production",
      ),
    ).toBe(true);
    expect(
      shouldUseSecureInvitationContinuationCookie(
        "https://app.example/invite/accept/exchange",
        "development",
      ),
    ).toBe(true);
    expect(
      shouldUseSecureInvitationContinuationCookie(
        "http://localhost:3000/invite/accept/exchange",
        "development",
      ),
    ).toBe(false);
  });
});
