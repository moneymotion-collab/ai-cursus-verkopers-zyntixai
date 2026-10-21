/**
 * Application-side AES-256-GCM for Social provider credentials (SMM-B1.1-B).
 *
 * Lazy key resolution. Fail closed. Never log plaintext, ciphertext, IV,
 * auth tag, or key material.
 */

import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import {
  serializeSocialCredentialAad,
  type SocialCredentialAad,
} from "@/features/social-media/server/credential-aad";
import {
  SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
  SOCIAL_CREDENTIAL_KEY_BYTE_LENGTH,
  parseSocialCredentialEncryptionKey,
  readSocialCredentialEncryptionKey,
} from "@/features/social-media/server/credential-key";
import {
  SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
  SOCIAL_CREDENTIAL_ENCRYPTION_VERSION,
  type EncryptedSocialCredentialMaterial,
} from "@/features/social-media/server/credential-secrets";
import {
  validateSocialCredentialPlaintextPayload,
  type SocialCredentialPlaintextPayload,
} from "@/features/social-media/server/credential-payload";

const AES_ALGORITHM = "aes-256-gcm";
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

export type SocialCredentialCryptoFailureReason =
  | "configuration_error"
  | "malformed_envelope"
  | "authentication_failed"
  | "version_unsupported"
  | "invalid_payload";

export type SocialCredentialEncryptSuccess = {
  ok: true;
  envelope: EncryptedSocialCredentialMaterial;
};

export type SocialCredentialEncryptFailure = {
  ok: false;
  reason: SocialCredentialCryptoFailureReason;
};

export type SocialCredentialEncryptResult =
  | SocialCredentialEncryptSuccess
  | SocialCredentialEncryptFailure;

export type SocialCredentialDecryptSuccess = {
  ok: true;
  payload: SocialCredentialPlaintextPayload;
};

export type SocialCredentialDecryptFailure = {
  ok: false;
  reason: SocialCredentialCryptoFailureReason;
};

export type SocialCredentialDecryptResult =
  | SocialCredentialDecryptSuccess
  | SocialCredentialDecryptFailure;

export type SocialCredentialCryptoKeySource = {
  key: Buffer;
  keyVersion: number;
};

function resolveEncryptKey(options?: {
  key?: Buffer;
  env?: Record<string, string | undefined>;
}):
  | { ok: true; key: Buffer; keyVersion: number }
  | { ok: false; reason: SocialCredentialCryptoFailureReason } {
  if (options?.key) {
    if (options.key.length !== SOCIAL_CREDENTIAL_KEY_BYTE_LENGTH) {
      return { ok: false, reason: "configuration_error" };
    }
    return {
      ok: true,
      key: options.key,
      keyVersion: SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
    };
  }
  const parsed = readSocialCredentialEncryptionKey(options?.env);
  if (!parsed.ok) {
    return { ok: false, reason: "configuration_error" };
  }
  return parsed;
}

function decodeBase64Exact(value: string): Buffer | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  try {
    const decoded = Buffer.from(value, "base64");
    if (decoded.length === 0) {
      return null;
    }
    if (decoded.toString("base64") !== value) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

export function encryptSocialCredentialPayload(
  payload: SocialCredentialPlaintextPayload,
  aad: SocialCredentialAad,
  options?: {
    key?: Buffer;
    env?: Record<string, string | undefined>;
  },
): SocialCredentialEncryptResult {
  const validated = validateSocialCredentialPlaintextPayload(payload);
  if (!validated.ok) {
    return { ok: false, reason: "invalid_payload" };
  }
  if (
    aad.purpose !== SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE ||
    aad.encryptionVersion !== SOCIAL_CREDENTIAL_ENCRYPTION_VERSION
  ) {
    return { ok: false, reason: "version_unsupported" };
  }

  const resolved = resolveEncryptKey(options);
  if (!resolved.ok) {
    return resolved;
  }
  if (aad.keyVersion !== resolved.keyVersion) {
    return { ok: false, reason: "version_unsupported" };
  }

  try {
    const iv = randomBytes(IV_LENGTH_BYTES);
    const cipher = createCipheriv(AES_ALGORITHM, resolved.key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    cipher.setAAD(serializeSocialCredentialAad(aad));
    const plaintext = Buffer.from(JSON.stringify(validated.payload), "utf8");
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return {
      ok: true,
      envelope: {
        encryptionVersion: SOCIAL_CREDENTIAL_ENCRYPTION_VERSION,
        keyPurpose: SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
        keyVersion: resolved.keyVersion,
        ciphertext: ciphertext.toString("base64"),
        iv: iv.toString("base64"),
        authTag: authTag.toString("base64"),
      },
    };
  } catch {
    return { ok: false, reason: "configuration_error" };
  }
}

export function decryptSocialCredentialEnvelope(
  envelope: EncryptedSocialCredentialMaterial,
  aad: SocialCredentialAad,
  options?: {
    key?: Buffer;
    env?: Record<string, string | undefined>;
  },
): SocialCredentialDecryptResult {
  if (
    envelope.encryptionVersion !== SOCIAL_CREDENTIAL_ENCRYPTION_VERSION ||
    envelope.keyPurpose !== SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE ||
    aad.purpose !== SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE ||
    aad.encryptionVersion !== SOCIAL_CREDENTIAL_ENCRYPTION_VERSION
  ) {
    return { ok: false, reason: "version_unsupported" };
  }
  if (envelope.keyVersion !== aad.keyVersion) {
    return { ok: false, reason: "version_unsupported" };
  }
  if (envelope.keyVersion !== SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION) {
    return { ok: false, reason: "version_unsupported" };
  }

  const resolved = options?.key
    ? options.key.length === SOCIAL_CREDENTIAL_KEY_BYTE_LENGTH
      ? {
          ok: true as const,
          key: options.key,
          keyVersion: SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
        }
      : { ok: false as const, reason: "configuration_error" as const }
    : readSocialCredentialEncryptionKey(options?.env, envelope.keyVersion);

  if (!resolved.ok) {
    return { ok: false, reason: "configuration_error" };
  }

  const iv = decodeBase64Exact(envelope.iv);
  const authTag = decodeBase64Exact(envelope.authTag);
  const ciphertext = decodeBase64Exact(envelope.ciphertext);
  if (
    iv == null ||
    authTag == null ||
    ciphertext == null ||
    iv.length !== IV_LENGTH_BYTES ||
    authTag.length !== AUTH_TAG_LENGTH_BYTES
  ) {
    return { ok: false, reason: "malformed_envelope" };
  }

  try {
    const decipher = createDecipheriv(AES_ALGORITHM, resolved.key, iv, {
      authTagLength: AUTH_TAG_LENGTH_BYTES,
    });
    decipher.setAAD(serializeSocialCredentialAad(aad));
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    let parsed: unknown;
    try {
      parsed = JSON.parse(decrypted.toString("utf8"));
    } catch {
      return { ok: false, reason: "malformed_envelope" };
    }
    const validated = validateSocialCredentialPlaintextPayload(parsed);
    if (!validated.ok) {
      return { ok: false, reason: "invalid_payload" };
    }
    return { ok: true, payload: validated.payload };
  } catch {
    return { ok: false, reason: "authentication_failed" };
  }
}

export function createEphemeralSocialCredentialTestKey(): Buffer {
  return randomBytes(SOCIAL_CREDENTIAL_KEY_BYTE_LENGTH);
}

export function parseInjectedSocialCredentialKey(
  value: string,
): ReturnType<typeof parseSocialCredentialEncryptionKey> {
  return parseSocialCredentialEncryptionKey(value);
}
