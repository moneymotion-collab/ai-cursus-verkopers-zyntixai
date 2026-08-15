/**
 * Canonical AES-GCM Additional Authenticated Data for social credentials.
 * Deterministic JSON with a fixed key order. Do not concatenate strings.
 */

import "server-only";

import { SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE } from "@/features/social-media/server/credential-secrets";
import type { ImplementedSocialProvider } from "@/features/social-media/domain/provider";

export type SocialCredentialAad = {
  purpose: typeof SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE;
  encryptionVersion: 1;
  keyVersion: number;
  organizationId: string;
  connectionId: string;
  credentialId: string;
  provider: ImplementedSocialProvider;
};

export function serializeSocialCredentialAad(aad: SocialCredentialAad): Buffer {
  const canonical = JSON.stringify({
    connectionId: aad.connectionId,
    credentialId: aad.credentialId,
    encryptionVersion: aad.encryptionVersion,
    keyVersion: aad.keyVersion,
    organizationId: aad.organizationId,
    provider: aad.provider,
    purpose: aad.purpose,
  });
  return Buffer.from(canonical, "utf8");
}
