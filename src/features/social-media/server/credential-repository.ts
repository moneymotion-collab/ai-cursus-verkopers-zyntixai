/**
 * Server-only Social Connection persistence adapters (SMM-B1.1-B).
 * Session client + SECURITY DEFINER RPCs. No service-role client.
 * Envelope load must never be mapped to UI/read models.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION } from "@/features/social-media/server/credential-key";
import {
  encryptSocialCredentialPayload,
  type SocialCredentialEncryptResult,
} from "@/features/social-media/server/credential-crypto";
import { SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE } from "@/features/social-media/server/credential-secrets";
import type { SocialCredentialPlaintextPayload } from "@/features/social-media/server/credential-payload";
import type { EncryptedSocialCredentialMaterial } from "@/features/social-media/server/credential-secrets";

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

function firstRow(data: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  return candidate as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export type SocialCredentialUpsertTarget =
  | {
      ok: true;
      credentialId?: string;
      expectedCredentialVersion: number;
    }
  | { ok: false; reason: string };

/**
 * Connect inserts a new envelope at version 0.
 * Reauthorize loads the existing envelope identity/version and never
 * assumes version 0. Ciphertext from the load path is not reused.
 */
export async function resolveSocialCredentialUpsertTarget(
  supabase: SupabaseClient<Database>,
  input: {
    intentKind: "connect" | "reauthorize";
    connectionId: string;
  },
): Promise<SocialCredentialUpsertTarget> {
  if (input.intentKind === "connect") {
    return { ok: true, expectedCredentialVersion: 0 };
  }

  const loaded = await loadEncryptedSocialProviderCredentialEnvelope(
    supabase,
    input.connectionId,
  );
  if (!loaded.ok) {
    return { ok: false, reason: loaded.reason };
  }

  return {
    ok: true,
    credentialId: loaded.envelope.credentialId,
    expectedCredentialVersion: loaded.envelope.credentialVersion,
  };
}

export async function upsertEncryptedSocialProviderCredential(
  supabase: SupabaseClient<Database>,
  input: {
    connectionId: string;
    organizationId: string;
    credentialId?: string;
    expectedCredentialVersion: number;
    payload: SocialCredentialPlaintextPayload;
    tokenExpiresAt: string | null;
    key?: Buffer;
    env?: Record<string, string | undefined>;
  },
): Promise<
  | {
      ok: true;
      credentialId: string;
      credentialVersion: number;
    }
  | { ok: false; reason: string }
> {
  const credentialId = input.credentialId ?? randomUUID();
  const encrypted: SocialCredentialEncryptResult = encryptSocialCredentialPayload(
    input.payload,
    {
      purpose: SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
      encryptionVersion: 1,
      keyVersion: SOCIAL_CREDENTIAL_CURRENT_KEY_VERSION,
      organizationId: input.organizationId,
      connectionId: input.connectionId,
      credentialId,
      provider: "instagram",
    },
    { key: input.key, env: input.env },
  );
  if (!encrypted.ok) {
    return { ok: false, reason: encrypted.reason };
  }

  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc(
      "upsert_social_provider_credential",
      {
        p_connection_id: input.connectionId,
        p_credential_id: credentialId,
        p_expected_credential_version: input.expectedCredentialVersion,
        p_encryption_version: encrypted.envelope.encryptionVersion,
        p_key_purpose: encrypted.envelope.keyPurpose,
        p_key_version: encrypted.envelope.keyVersion,
        p_ciphertext: encrypted.envelope.ciphertext,
        p_iv: encrypted.envelope.iv,
        p_auth_tag: encrypted.envelope.authTag,
        p_token_expires_at: input.tokenExpiresAt,
      },
    );
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode !== "success") {
      return { ok: false, reason: resultCode ?? "unexpected" };
    }
    const persistedId = asString(row?.credential_id);
    const version = asNumber(row?.credential_version);
    if (!persistedId || version == null) {
      return { ok: false, reason: "unexpected" };
    }
    return {
      ok: true,
      credentialId: persistedId,
      credentialVersion: version,
    };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type LoadedSocialCredentialEnvelope = {
  credentialId: string;
  organizationId: string;
  connectionId: string;
  provider: "instagram";
  encrypted: EncryptedSocialCredentialMaterial;
  credentialVersion: number;
};

export async function loadEncryptedSocialProviderCredentialEnvelope(
  supabase: SupabaseClient<Database>,
  connectionId: string,
  options?: { rpcName?: string },
): Promise<
  | { ok: true; envelope: LoadedSocialCredentialEnvelope }
  | { ok: false; reason: string }
> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc(
      options?.rpcName ?? "load_social_provider_credential_envelope",
      { p_connection_id: connectionId },
    );
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode !== "success") {
      return { ok: false, reason: resultCode ?? "unexpected" };
    }
    const credentialId = asString(row?.credential_id);
    const organizationId = asString(row?.organization_id);
    const loadedConnectionId = asString(row?.connection_id);
    const provider = asString(row?.provider);
    const encryptionVersion = asNumber(row?.encryption_version);
    const keyPurpose = asString(row?.key_purpose);
    const keyVersion = asNumber(row?.key_version);
    const ciphertext = asString(row?.ciphertext);
    const iv = asString(row?.iv);
    const authTag = asString(row?.auth_tag);
    const credentialVersion = asNumber(row?.credential_version);
    if (
      !credentialId ||
      !organizationId ||
      !loadedConnectionId ||
      provider !== "instagram" ||
      encryptionVersion == null ||
      !keyPurpose ||
      keyVersion == null ||
      !ciphertext ||
      !iv ||
      !authTag ||
      credentialVersion == null
    ) {
      return { ok: false, reason: "unexpected" };
    }
    return {
      ok: true,
      envelope: {
        credentialId,
        organizationId,
        connectionId: loadedConnectionId,
        provider: "instagram",
        encrypted: {
          encryptionVersion: encryptionVersion as 1,
          keyPurpose: keyPurpose as typeof SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
          keyVersion,
          ciphertext,
          iv,
          authTag,
        },
        credentialVersion,
      },
    };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}
