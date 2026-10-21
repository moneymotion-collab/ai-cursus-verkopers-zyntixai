/**
 * Server-only secret-bearing Social Connection types.
 *
 * Crypto implementation lives in credential-crypto.ts / credential-key.ts.
 * This module remains the type boundary for envelopes and raw OAuth state.
 *
 * Raw OAuth state:
 * - memory/transit only
 * - never persisted raw
 * - never logged
 * - never returned through ordinary domain models or client read models
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
 * AES-256-GCM ciphertext envelope. Values are opaque encoded strings.
 * Never log, never return through client-safe read models.
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
