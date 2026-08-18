/**
 * B1.8 controlled IMAGE publication executor.
 * Refuses unless SOCIAL_PUBLISHING_ENABLED is exactly true.
 * Opaque outcomes only — never log tokens or provider bodies.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  SocialPublicationExecutionInput,
  SocialPublicationMediaReference,
} from "@/features/social-media/domain/publishing";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import { assertClosedBetaPublishAllowed } from "@/features/social-media/server/social-closed-beta-enrollment";
import { loadEncryptedSocialProviderCredentialEnvelope } from "@/features/social-media/server/credential-repository";
import { decryptSocialCredentialEnvelope } from "@/features/social-media/server/credential-crypto";
import { SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE } from "@/features/social-media/server/credential-secrets";
import { createInstagramPublishingAdapter } from "@/features/social-media/server/instagram-publishing/adapter";

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

type QueryCapableClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        eq: (column: string, value: string) => {
          maybeSingle: () => PromiseLike<{
            data: unknown;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
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

function parseCapabilitySnapshot(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === "string" && item.length > 0) {
      out.push(item);
    }
  }
  return out;
}

function parseMediaSnapshot(value: unknown): SocialPublicationMediaReference[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const out: SocialPublicationMediaReference[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const row = item as Record<string, unknown>;
    const assetId = asString(row.asset_id);
    const storageObjectKey = asString(row.storage_object_key);
    const mimeType = asString(row.mime_type);
    const mediaCategory = asString(row.media_category);
    const assetRole = asString(row.asset_role);
    const sortOrder = asNumber(row.sort_order);
    if (
      !assetId ||
      !storageObjectKey ||
      !mimeType ||
      !mediaCategory ||
      !assetRole ||
      sortOrder == null
    ) {
      continue;
    }
    out.push({
      assetId,
      sortOrder,
      assetRole,
      storageObjectKey,
      mimeType,
      mediaCategory,
    });
  }
  return out;
}

export type ExecuteB18ImagePublicationSuccess = {
  ok: true;
  publicationId: string;
  attemptId: string;
  outcome: "succeeded" | "failed_retryable" | "failed_terminal" | "unknown_external_outcome";
  externalPublicationIdPresent: boolean;
};

export type ExecuteB18ImagePublicationFailure = {
  ok: false;
  reason:
    | "feature_disabled"
    | "invalid_input"
    | "forbidden"
    | "not_found"
    | "conflict"
    | "stale_claim"
    | "none_due"
    | "credential_unavailable"
    | "closed_beta_not_enrolled"
    | "closed_beta_paused"
    | "closed_beta_revoked"
    | "closed_beta_publish_not_allowed"
    | "transport_error"
    | "unexpected";
};

async function completeAttempt(
  client: RpcCapableClient,
  args: {
    organizationId: string;
    attemptId: string;
    workerId: string;
    claimGeneration: number;
    outcome: string;
    failureClass?: string | null;
    safeErrorCode?: string | null;
    externalPublicationId?: string | null;
  },
): Promise<"success" | string> {
  try {
    const { data, error } = await client.rpc(
      "b18_complete_controlled_publication_attempt",
      {
        p_organization_id: args.organizationId,
        p_attempt_id: args.attemptId,
        p_worker_id: args.workerId,
        p_claim_generation: args.claimGeneration,
        p_outcome: args.outcome,
        p_failure_class: args.failureClass ?? null,
        p_safe_error_code: args.safeErrorCode ?? null,
        p_external_publication_id: args.externalPublicationId ?? null,
      },
    );
    if (error) {
      return "transport_error";
    }
    const row = firstRow(data);
    return asString(row?.result_code) ?? "unexpected";
  } catch {
    return "transport_error";
  }
}

export async function executeB18ImagePublication(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    publicationId: string;
    env?: Record<string, string | undefined>;
  },
): Promise<
  ExecuteB18ImagePublicationSuccess | ExecuteB18ImagePublicationFailure
> {
  const env = input.env ?? process.env;
  if (!isSocialPublishingFeatureEnabled(env)) {
    return { ok: false, reason: "feature_disabled" };
  }

  const organizationId = input.organizationId.trim();
  const publicationId = input.publicationId.trim();
  if (!organizationId || !publicationId) {
    return { ok: false, reason: "invalid_input" };
  }

  const entitlement = await assertClosedBetaPublishAllowed(
    supabase,
    organizationId,
  );
  if (!entitlement.ok) {
    if (
      entitlement.code === "closed_beta_not_enrolled" ||
      entitlement.code === "closed_beta_paused" ||
      entitlement.code === "closed_beta_revoked" ||
      entitlement.code === "closed_beta_publish_not_allowed" ||
      entitlement.code === "forbidden"
    ) {
      return { ok: false, reason: entitlement.code };
    }
    return { ok: false, reason: "unexpected" };
  }

  const rpcClient = supabase as unknown as RpcCapableClient;
  const queryClient = supabase as unknown as QueryCapableClient;

  let startRow: Record<string, unknown>;
  try {
    const { data, error } = await rpcClient.rpc(
      "b18_start_controlled_publication_attempt",
      {
        p_organization_id: organizationId,
        p_publication_id: publicationId,
      },
    );
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    if (!row) {
      return { ok: false, reason: "unexpected" };
    }
    startRow = row;
  } catch {
    return { ok: false, reason: "transport_error" };
  }

  const startCode = asString(startRow.result_code);
  if (startCode !== "success") {
    if (
      startCode === "feature_disabled" ||
      startCode === "forbidden" ||
      startCode === "not_found" ||
      startCode === "conflict" ||
      startCode === "stale_claim" ||
      startCode === "none_due" ||
      startCode === "invalid_input" ||
      startCode === "closed_beta_not_enrolled" ||
      startCode === "closed_beta_paused" ||
      startCode === "closed_beta_revoked" ||
      startCode === "closed_beta_publish_not_allowed"
    ) {
      return { ok: false, reason: startCode };
    }
    return { ok: false, reason: "unexpected" };
  }

  const attemptId = asString(startRow.attempt_id);
  const workerId = asString(startRow.worker_id);
  const claimGeneration = asNumber(startRow.claim_generation);
  if (!attemptId || !workerId || claimGeneration == null) {
    return { ok: false, reason: "unexpected" };
  }

  const publicationSelect = await queryClient
    .from("social_publications")
    .select(
      "id, organization_id, workspace_id, connection_id, variant_version_id, provider, status",
    )
    .eq("organization_id", organizationId)
    .eq("id", publicationId)
    .maybeSingle();
  if (publicationSelect.error || !publicationSelect.data) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "internal",
      safeErrorCode: "publication_load_failed",
    });
    return { ok: false, reason: "not_found" };
  }
  const publication = publicationSelect.data as Record<string, unknown>;
  const connectionId = asString(publication.connection_id);
  const workspaceId = asString(publication.workspace_id);
  const variantVersionId = asString(publication.variant_version_id);
  const provider = asString(publication.provider);
  if (
    !connectionId ||
    !workspaceId ||
    !variantVersionId ||
    provider !== "instagram"
  ) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "validation",
      safeErrorCode: "publication_shape_invalid",
    });
    return { ok: false, reason: "unexpected" };
  }

  const attemptSelect = await queryClient
    .from("social_publication_attempts")
    .select("id, operation_id, outcome")
    .eq("organization_id", organizationId)
    .eq("id", attemptId)
    .maybeSingle();
  if (attemptSelect.error || !attemptSelect.data) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "internal",
      safeErrorCode: "attempt_load_failed",
    });
    return { ok: false, reason: "not_found" };
  }
  const operationId = asString(
    (attemptSelect.data as Record<string, unknown>).operation_id,
  );
  if (!operationId) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "internal",
      safeErrorCode: "operation_id_missing",
    });
    return { ok: false, reason: "unexpected" };
  }

  const versionSelect = await queryClient
    .from("social_content_variant_versions")
    .select("id, content_format, caption, alt_text, media_snapshot")
    .eq("organization_id", organizationId)
    .eq("id", variantVersionId)
    .maybeSingle();
  if (versionSelect.error || !versionSelect.data) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "validation",
      safeErrorCode: "version_load_failed",
    });
    return { ok: false, reason: "not_found" };
  }
  const version = versionSelect.data as Record<string, unknown>;
  const contentFormat = asString(version.content_format);
  const mediaSnapshot = parseMediaSnapshot(version.media_snapshot);
  if (contentFormat !== "image" || mediaSnapshot.length !== 1) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "validation",
      safeErrorCode: "b18_image_only",
    });
    return { ok: false, reason: "invalid_input" };
  }

  const connectionSelect = await queryClient
    .from("social_account_connections")
    .select(
      "id, status, health, external_account_id, capability_snapshot, reauthorization_required_at",
    )
    .eq("organization_id", organizationId)
    .eq("id", connectionId)
    .maybeSingle();
  if (connectionSelect.error || !connectionSelect.data) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "connection_ineligible",
      safeErrorCode: "connection_load_failed",
    });
    return { ok: false, reason: "not_found" };
  }
  const connection = connectionSelect.data as Record<string, unknown>;
  const externalAccountId = asString(connection.external_account_id);
  const connectionStatus = asString(connection.status) ?? "disconnected";
  const connectionHealth = asString(connection.health) ?? "unknown";
  const reauthorizationRequired =
    connection.reauthorization_required_at != null;
  const capabilities = parseCapabilitySnapshot(connection.capability_snapshot);
  if (!externalAccountId) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "connection_ineligible",
      safeErrorCode: "external_account_missing",
    });
    return { ok: false, reason: "unexpected" };
  }

  const loaded = await loadEncryptedSocialProviderCredentialEnvelope(
    supabase,
    connectionId,
  );
  if (!loaded.ok) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "credential",
      safeErrorCode: "credential_load_failed",
    });
    return { ok: false, reason: "credential_unavailable" };
  }

  const decrypted = decryptSocialCredentialEnvelope(loaded.envelope.encrypted, {
    purpose: SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE,
    encryptionVersion: 1,
    keyVersion: loaded.envelope.encrypted.keyVersion,
    organizationId: loaded.envelope.organizationId,
    connectionId: loaded.envelope.connectionId,
    credentialId: loaded.envelope.credentialId,
    provider: "instagram",
  });
  if (!decrypted.ok) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "credential",
      safeErrorCode: "credential_decrypt_failed",
    });
    return { ok: false, reason: "credential_unavailable" };
  }

  const executionInput: SocialPublicationExecutionInput = {
    publicationId,
    organizationId,
    workspaceId,
    connectionId,
    provider: "instagram",
    variantVersionId,
    contentFormat: "image",
    mediaSnapshot,
    operationId,
    externalAccountId,
    caption: asString(version.caption),
    altText: asString(version.alt_text),
  };

  const adapter = createInstagramPublishingAdapter({
    accessToken: decrypted.payload.accessToken,
    env,
    connectionCapabilities: capabilities,
    connectionStatus,
    connectionHealth,
    reauthorizationRequired,
  });

  let publishResult: Awaited<ReturnType<typeof adapter.publish>>;
  try {
    publishResult = await adapter.publish(executionInput);
  } catch {
    const completeCode = await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "unknown_external_outcome",
      failureClass: "unknown_external_outcome",
      safeErrorCode: "adapter_exception",
    });
    if (completeCode !== "success") {
      return { ok: false, reason: "unexpected" };
    }
    return {
      ok: true,
      publicationId,
      attemptId,
      outcome: "unknown_external_outcome",
      externalPublicationIdPresent: false,
    };
  }

  if (publishResult.outcome === "succeeded") {
    const completeCode = await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "succeeded",
      externalPublicationId: publishResult.externalPublicationId,
    });
    if (completeCode !== "success") {
      return { ok: false, reason: "unexpected" };
    }
    return {
      ok: true,
      publicationId,
      attemptId,
      outcome: "succeeded",
      externalPublicationIdPresent: true,
    };
  }

  const completeCode = await completeAttempt(rpcClient, {
    organizationId,
    attemptId,
    workerId,
    claimGeneration,
    outcome: publishResult.outcome,
    failureClass: publishResult.failureClass,
    safeErrorCode: publishResult.safeErrorCode,
  });
  if (completeCode !== "success") {
    return { ok: false, reason: "unexpected" };
  }

  return {
    ok: true,
    publicationId,
    attemptId,
    outcome: publishResult.outcome,
    externalPublicationIdPresent: false,
  };
}
