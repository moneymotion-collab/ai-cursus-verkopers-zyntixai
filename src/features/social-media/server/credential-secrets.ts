/**
 * Server-only secret-bearing Social Connection types (SMM-B1.1-A).
 *
 * Types only — no encryption, no OAuth state generation, no persistence.
 *
 * Raw OAuth state:
 * - memory/transit only
 * - never persisted raw
 * - never logged
 * - never returned through ordinary domain models or client read models
 *
 * Encrypted credential material:
 * - B1.1-B implements AES-256-GCM, key parsing, and persistence
 * - this module only names the future ciphertext shape
 *
 * Do not import from Client Components.
 */

import "server-only";

import type { ImplementedSocialProvider } from "@/features/social-media/domain/provider";
import type { SocialCredentialReferenceId } from "@/features/social-media/domain/types";

export const SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE =
  "zyntixai.smm.credential.aes-v1";

export const SOCIAL_CREDENTIAL_ENCRYPTION_VERSION = 1 as const;

/**
 * Future AES-GCM ciphertext envelope. Values here are opaque strings once
 * B1.1-B implements encoding. This slice does not produce secret values.
 */
export type EncryptedSocialCredentialMaterial = {
  encryptionVersion: typeof SOCIAL_CREDENTIAL_ENCRYPTION_VERSION;
  keyPurpose: typeof SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE;
  keyVersion: number;
  ciphertext: string;
  iv: string;
  authTag: string;
};

/**
 * Internal credential record for future server-only persistence mapping.
 * Must never be serialized to the browser.
 */
export type InternalSocialCredentialSecretRecord = {
  credentialReferenceId: SocialCredentialReferenceId;
  provider: ImplementedSocialProvider;
  encrypted: EncryptedSocialCredentialMaterial;
};

/**
 * One-time OAuth state secret. Distinct from stored fingerprint and intent id.
 * Never persist this value. Never log it. Never attach it to domain connections.
 */
export type RawSocialOAuthStateSecret = {
  readonly __brand: "RawSocialOAuthStateSecret";
  readonly value: string;
};

export function isRawSocialOAuthStateSecret(
  value: unknown,
): value is RawSocialOAuthStateSecret {
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
