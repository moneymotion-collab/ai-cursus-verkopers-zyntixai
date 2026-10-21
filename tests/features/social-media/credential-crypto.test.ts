import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import {
  createEphemeralSocialCredentialTestKey,
  decryptSocialCredentialEnvelope,
  encryptSocialCredentialPayload,
} from "@/features/social-media/server/credential-crypto";
import {
  parseSocialCredentialEncryptionKey,
  readSocialCredentialEncryptionKey,
  SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
} from "@/features/social-media/server/credential-key";
import { SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE } from "@/features/social-media/server/credential-secrets";
import type { SocialCredentialAad } from "@/features/social-media/server/credential-aad";
import type { SocialCredentialPlaintextPayload } from "@/features/social-media/server/credential-payload";
import type { EncryptedSocialCredentialMaterial } from "@/features/social-media/server/credential-secrets";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const CONNECTION_A = "33333333-3333-4333-8333-333333333333";
const CONNECTION_B = "44444444-4444-4444-8444-444444444444";
const CREDENTIAL_A = "55555555-5555-4555-8555-555555555555";

const SYNTHETIC_PAYLOAD: SocialCredentialPlaintextPayload = {
  payloadVersion: 1,
  accessToken: "test-access-token-not-real",
  refreshToken: "test-refresh-token-not-real",
};

function aadFor(
  overrides: Partial<SocialCredentialAad> = {},
): SocialCredentialAad {
  return {
    purpose: SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
    encryptionVersion: 1,
    keyVersion: SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
    organizationId: ORG_A,
    connectionId: CONNECTION_A,
    credentialId: CREDENTIAL_A,
    provider: "instagram",
    ...overrides,
  };
}

describe("social credential key parsing", () => {
  it("accepts canonical base64 of exactly 32 bytes", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const encoded = key.toString("base64");
    const parsed = parseSocialCredentialEncryptionKey(encoded);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.key.equals(key)).toBe(true);
      expect(parsed.keyVersion).toBe(1);
    }
  });

  it("fail-closes missing, malformed, and wrong-length keys", () => {
    expect(parseSocialCredentialEncryptionKey(undefined).ok).toBe(false);
    expect(parseSocialCredentialEncryptionKey("").ok).toBe(false);
    expect(parseSocialCredentialEncryptionKey("not-base64!").ok).toBe(false);
    expect(
      parseSocialCredentialEncryptionKey(randomBytes(16).toString("base64")).ok,
    ).toBe(false);
    expect(
      parseSocialCredentialEncryptionKey(randomBytes(64).toString("hex")).ok,
    ).toBe(false);
    expect(
      readSocialCredentialEncryptionKey({}, 1).ok,
    ).toBe(false);
    expect(
      readSocialCredentialEncryptionKey(
        {
          SOCIAL_CREDENTIAL_ENCRYPTION_KEY:
            createEphemeralSocialCredentialTestKey().toString("base64"),
        },
        2,
      ).ok,
    ).toBe(false);
  });

  it("does not hash a short passphrase into an AES key", () => {
    expect(parseSocialCredentialEncryptionKey("a".repeat(32)).ok).toBe(false);
  });
});

describe("AES-256-GCM social credential crypto", () => {
  it("round-trips a valid payload", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const encrypted = encryptSocialCredentialPayload(
      SYNTHETIC_PAYLOAD,
      aadFor(),
      { key },
    );
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) {
      return;
    }
    const decrypted = decryptSocialCredentialEnvelope(
      encrypted.envelope,
      aadFor(),
      { key },
    );
    expect(decrypted.ok).toBe(true);
    if (decrypted.ok) {
      expect(decrypted.payload).toEqual(SYNTHETIC_PAYLOAD);
    }
  });

  it("uses a unique IV so identical plaintext encrypts differently", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const first = encryptSocialCredentialPayload(SYNTHETIC_PAYLOAD, aadFor(), {
      key,
    });
    const second = encryptSocialCredentialPayload(SYNTHETIC_PAYLOAD, aadFor(), {
      key,
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      return;
    }
    expect(first.envelope.iv).not.toBe(second.envelope.iv);
    expect(first.envelope.ciphertext).not.toBe(second.envelope.ciphertext);
  });

  it("fails when the wrong key is used", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const other = createEphemeralSocialCredentialTestKey();
    const encrypted = encryptSocialCredentialPayload(
      SYNTHETIC_PAYLOAD,
      aadFor(),
      { key },
    );
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) {
      return;
    }
    const decrypted = decryptSocialCredentialEnvelope(
      encrypted.envelope,
      aadFor(),
      { key: other },
    );
    expect(decrypted).toEqual({ ok: false, reason: "authentication_failed" });
  });

  it("fails when AAD organization/connection context is transplanted", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const encrypted = encryptSocialCredentialPayload(
      SYNTHETIC_PAYLOAD,
      aadFor(),
      { key },
    );
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) {
      return;
    }
    const decrypted = decryptSocialCredentialEnvelope(
      encrypted.envelope,
      aadFor({ organizationId: ORG_B, connectionId: CONNECTION_B }),
      { key },
    );
    expect(decrypted).toEqual({ ok: false, reason: "authentication_failed" });
  });

  it("fails when ciphertext, IV, or auth tag is modified", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const encrypted = encryptSocialCredentialPayload(
      SYNTHETIC_PAYLOAD,
      aadFor(),
      { key },
    );
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) {
      return;
    }
    const tamper = (
      envelope: EncryptedSocialCredentialMaterial,
      field: "ciphertext" | "iv" | "authTag",
    ) => {
      const bytes = Buffer.from(envelope[field], "base64");
      bytes[0] = bytes[0] ^ 0xff;
      return { ...envelope, [field]: bytes.toString("base64") };
    };
    expect(
      decryptSocialCredentialEnvelope(
        tamper(encrypted.envelope, "ciphertext"),
        aadFor(),
        { key },
      ),
    ).toEqual({ ok: false, reason: "authentication_failed" });
    expect(
      decryptSocialCredentialEnvelope(
        tamper(encrypted.envelope, "iv"),
        aadFor(),
        { key },
      ),
    ).toEqual({ ok: false, reason: "authentication_failed" });
    expect(
      decryptSocialCredentialEnvelope(
        tamper(encrypted.envelope, "authTag"),
        aadFor(),
        { key },
      ),
    ).toEqual({ ok: false, reason: "authentication_failed" });
  });

  it("fails closed on malformed envelopes and missing keys", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const encrypted = encryptSocialCredentialPayload(
      SYNTHETIC_PAYLOAD,
      aadFor(),
      { key },
    );
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) {
      return;
    }
    expect(
      decryptSocialCredentialEnvelope(
        { ...encrypted.envelope, iv: "%%%" },
        aadFor(),
        { key },
      ).ok,
    ).toBe(false);
    expect(
      encryptSocialCredentialPayload(SYNTHETIC_PAYLOAD, aadFor(), { env: {} }),
    ).toEqual({ ok: false, reason: "configuration_error" });
    expect(
      encryptSocialCredentialPayload(SYNTHETIC_PAYLOAD, aadFor(), {
        key: randomBytes(16),
      }),
    ).toEqual({ ok: false, reason: "configuration_error" });
  });

  it("rejects unsupported encryption/key versions and purpose mismatch", () => {
    const key = createEphemeralSocialCredentialTestKey();
    const encrypted = encryptSocialCredentialPayload(
      SYNTHETIC_PAYLOAD,
      aadFor(),
      { key },
    );
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) {
      return;
    }
    expect(
      decryptSocialCredentialEnvelope(
        { ...encrypted.envelope, encryptionVersion: 2 as 1 },
        aadFor(),
        { key },
      ),
    ).toEqual({ ok: false, reason: "version_unsupported" });
    expect(
      decryptSocialCredentialEnvelope(
        { ...encrypted.envelope, keyVersion: 9 },
        aadFor({ keyVersion: 9 }),
        { key },
      ),
    ).toEqual({ ok: false, reason: "version_unsupported" });
    expect(
      decryptSocialCredentialEnvelope(
        {
          ...encrypted.envelope,
          keyPurpose: "zyntixai.invite.continuation.aes-v1" as typeof SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
        },
        aadFor(),
        { key },
      ),
    ).toEqual({ ok: false, reason: "version_unsupported" });
  });

  it("rejects empty token payloads and keeps tokens out of the envelope", () => {
    const key = createEphemeralSocialCredentialTestKey();
    expect(
      encryptSocialCredentialPayload(
        { payloadVersion: 1, accessToken: "", refreshToken: null },
        aadFor(),
        { key },
      ),
    ).toEqual({ ok: false, reason: "invalid_payload" });
    const encrypted = encryptSocialCredentialPayload(
      SYNTHETIC_PAYLOAD,
      aadFor(),
      { key },
    );
    expect(encrypted.ok).toBe(true);
    if (!encrypted.ok) {
      return;
    }
    const envelopeRecord = encrypted.envelope as unknown as Record<
      string,
      unknown
    >;
    expect(envelopeRecord).not.toHaveProperty("accessToken");
    expect(envelopeRecord).not.toHaveProperty("refreshToken");
    expect(JSON.stringify(encrypted.envelope)).not.toContain(
      SYNTHETIC_PAYLOAD.accessToken,
    );
    expect(JSON.stringify(encrypted.envelope)).not.toContain(
      SYNTHETIC_PAYLOAD.refreshToken,
    );
  });
});
