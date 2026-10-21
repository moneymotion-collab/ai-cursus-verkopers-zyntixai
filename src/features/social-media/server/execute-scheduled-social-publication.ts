/**
 * Scheduled IMAGE / Story IMAGE publication executor (SMM-B1.11-C / B1.11-F).
 * Reuses the Instagram adapter and attempt lifecycle. Trigger is scheduler, not Owner session.
 * TypeScript gates must both be ON before this is invoked. Dry-run must never call it.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  isScheduledInstagramImagePublicationShape,
  requiredCapabilityForContentFormat,
  type SocialPublicationExecutionInput,
  type SocialPublicationMediaReference,
  type SocialPublishingProviderDiagnostics,
} from "@/features/social-media/domain/publishing";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import { isSocialSchedulingFeatureEnabled } from "@/features/social-media/server/social-scheduling-feature";
import { loadEncryptedSocialProviderCredentialEnvelope } from "@/features/social-media/server/credential-repository";
import { decryptSocialCredentialEnvelope } from "@/features/social-media/server/credential-crypto";
import { SOCIAL_CREDENTIAL_ENCRYPTION_PURPOSE } from "@/features/social-media/server/credential-secrets";
import { createInstagramPublishingAdapter } from "@/features/social-media/server/instagram-publishing/adapter";
import {
  isInstagramProviderStep,
  logInstagramProviderDiagnostic,
  type InstagramProviderDiagnostics,
} from "@/features/social-media/server/instagram-publishing/diagnostics";

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

function toPersistedDiagnostics(
  value: SocialPublishingProviderDiagnostics | undefined,
): InstagramProviderDiagnostics | null {
  if (!value || !isInstagramProviderStep(value.providerStep)) {
    return null;
  }
  return {
    providerStep: value.providerStep,
    httpStatus: value.httpStatus,
    providerErrorCode: value.providerErrorCode,
    providerErrorSubcode: value.providerErrorSubcode,
    providerErrorType: value.providerErrorType,
    safeProviderMessage: value.safeProviderMessage,
    requestDispatched: value.requestDispatched,
    responseReceived: value.responseReceived,
    externalContainerIdPresent: value.externalContainerIdPresent,
    externalPublicationIdPresent: value.externalPublicationIdPresent,
    boundaryState: value.boundaryState as InstagramProviderDiagnostics["boundaryState"],
  };
}

export type ExecuteScheduledSocialPublicationSuccess = {
  ok: true;
  publicationId: string;
  attemptId: string;
  outcome:
    | "succeeded"
    | "failed_retryable"
    | "failed_terminal"
    | "unknown_external_outcome";
  externalPublicationIdPresent: boolean;
};

export type ExecuteScheduledSocialPublicationFailure = {
  ok: false;
  reason: string;
  claimed: boolean;
  providerWriteAttempted: boolean;
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
    publicationId?: string;
    diagnostics?: InstagramProviderDiagnostics | null;
  },
): Promise<"success" | string> {
  try {
    const diagnostics = args.diagnostics ?? null;
    if (diagnostics && args.publicationId && args.safeErrorCode && args.failureClass) {
      logInstagramProviderDiagnostic({
        organizationId: args.organizationId,
        publicationId: args.publicationId,
        attemptId: args.attemptId,
        diagnostics,
        safeErrorCode: args.safeErrorCode,
        outcome: args.outcome,
        failureClass: args.failureClass,
      });
    }
    const { data, error } = await client.rpc(
      "scheduler_complete_scheduled_publication_attempt",
      {
        p_organization_id: args.organizationId,
        p_attempt_id: args.attemptId,
        p_worker_id: args.workerId,
        p_claim_generation: args.claimGeneration,
        p_outcome: args.outcome,
        p_failure_class: args.failureClass ?? null,
        p_safe_error_code: args.safeErrorCode ?? null,
        p_external_publication_id: args.externalPublicationId ?? null,
        p_provider_step: diagnostics?.providerStep ?? null,
        p_provider_http_status: diagnostics?.httpStatus ?? null,
        p_provider_error_code: diagnostics?.providerErrorCode ?? null,
        p_provider_error_subcode: diagnostics?.providerErrorSubcode ?? null,
        p_provider_error_type: diagnostics?.providerErrorType ?? null,
        p_safe_provider_message: diagnostics?.safeProviderMessage ?? null,
        p_provider_request_dispatched: diagnostics?.requestDispatched ?? null,
        p_provider_response_received: diagnostics?.responseReceived ?? null,
        p_external_container_id_present:
          diagnostics?.externalContainerIdPresent ?? null,
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

export async function executeScheduledSocialPublication(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    publicationId: string;
    env?: Record<string, string | undefined>;
  },
): Promise<
  ExecuteScheduledSocialPublicationSuccess | ExecuteScheduledSocialPublicationFailure
> {
  const env = input.env ?? process.env;
  if (!isSocialSchedulingFeatureEnabled(env) || !isSocialPublishingFeatureEnabled(env)) {
    return {
      ok: false,
      reason: "feature_disabled",
      claimed: false,
      providerWriteAttempted: false,
    };
  }

  const organizationId = input.organizationId.trim();
  const publicationId = input.publicationId.trim();
  if (!organizationId || !publicationId) {
    return {
      ok: false,
      reason: "invalid_input",
      claimed: false,
      providerWriteAttempted: false,
    };
  }

  const rpcClient = supabase as unknown as RpcCapableClient;

  let startRow: Record<string, unknown>;
  try {
    const { data, error } = await rpcClient.rpc(
      "scheduler_start_scheduled_publication_attempt",
      {
        p_organization_id: organizationId,
        p_publication_id: publicationId,
      },
    );
    if (error) {
      return {
        ok: false,
        reason: "transport_error",
        claimed: false,
        providerWriteAttempted: false,
      };
    }
    const row = firstRow(data);
    if (!row) {
      return {
        ok: false,
        reason: "unexpected",
        claimed: false,
        providerWriteAttempted: false,
      };
    }
    startRow = row;
  } catch {
    return {
      ok: false,
      reason: "transport_error",
      claimed: false,
      providerWriteAttempted: false,
    };
  }

  const startCode = asString(startRow.result_code);
  if (startCode !== "success") {
    return {
      ok: false,
      reason: startCode ?? "unexpected",
      claimed: false,
      providerWriteAttempted: false,
    };
  }

  const attemptId = asString(startRow.attempt_id);
  const workerId = asString(startRow.worker_id);
  const claimGeneration = asNumber(startRow.claim_generation);
  if (!attemptId || !workerId || claimGeneration == null) {
    return {
      ok: false,
      reason: "unexpected",
      claimed: true,
      providerWriteAttempted: false,
    };
  }

  let contextRow: Record<string, unknown>;
  try {
    const { data, error } = await rpcClient.rpc(
      "scheduler_load_social_publication_execution_context",
      {
        p_organization_id: organizationId,
        p_publication_id: publicationId,
      },
    );
    if (error) {
      await completeAttempt(rpcClient, {
        organizationId,
        attemptId,
        workerId,
        claimGeneration,
        outcome: "failed_terminal",
        failureClass: "internal",
        safeErrorCode: "context_load_failed",
      });
      return { ok: false, reason: "transport_error", claimed: true, providerWriteAttempted: false };
    }
    const row = firstRow(data);
    if (!row || asString(row.result_code) !== "success") {
      await completeAttempt(rpcClient, {
        organizationId,
        attemptId,
        workerId,
        claimGeneration,
        outcome: "failed_terminal",
        failureClass: "internal",
        safeErrorCode: "context_load_failed",
      });
      return { ok: false, reason: "not_found", claimed: true, providerWriteAttempted: false };
    }
    contextRow = row;
  } catch {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "internal",
      safeErrorCode: "context_load_failed",
    });
    return { ok: false, reason: "transport_error", claimed: true, providerWriteAttempted: false };
  }

  const connectionId = asString(contextRow.connection_id);
  const workspaceId = asString(contextRow.workspace_id);
  const variantVersionId = asString(contextRow.variant_version_id);
  const provider = asString(contextRow.provider);
  const operationId = asString(contextRow.operation_id);
  const contentFormat = asString(contextRow.content_format);
  const mediaSnapshot = parseMediaSnapshot(contextRow.media_snapshot);
  const externalAccountId = asString(contextRow.external_account_id);
  const connectionStatus = asString(contextRow.connection_status) ?? "disconnected";
  const connectionHealth = asString(contextRow.connection_health) ?? "unknown";
  const reauthorizationRequired = contextRow.reauthorization_required_at != null;
  const capabilities = parseCapabilitySnapshot(contextRow.capability_snapshot);

  if (
    !connectionId ||
    !workspaceId ||
    !variantVersionId ||
    provider !== "instagram" ||
    !operationId ||
    !contentFormat ||
    !isScheduledInstagramImagePublicationShape(contentFormat, mediaSnapshot) ||
    !externalAccountId
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
    return { ok: false, reason: "invalid_input", claimed: true, providerWriteAttempted: false };
  }

  const requiredCapability = requiredCapabilityForContentFormat(contentFormat);
  if (
    connectionStatus !== "connected" ||
    connectionHealth !== "healthy" ||
    reauthorizationRequired ||
    !requiredCapability ||
    !capabilities.includes(requiredCapability)
  ) {
    await completeAttempt(rpcClient, {
      organizationId,
      attemptId,
      workerId,
      claimGeneration,
      outcome: "failed_terminal",
      failureClass: "connection_ineligible",
      safeErrorCode: "connection_recheck_failed",
    });
    return { ok: false, reason: "connection_ineligible", claimed: true, providerWriteAttempted: false };
  }

  const loaded = await loadEncryptedSocialProviderCredentialEnvelope(
    supabase,
    connectionId,
    { rpcName: "scheduler_load_social_provider_credential_envelope" },
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
    return { ok: false, reason: "credential_unavailable", claimed: true, providerWriteAttempted: false };
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
    return { ok: false, reason: "credential_unavailable", claimed: true, providerWriteAttempted: false };
  }

  const executionInput: SocialPublicationExecutionInput = {
    publicationId,
    organizationId,
    workspaceId,
    connectionId,
    provider: "instagram",
    variantVersionId,
    contentFormat,
    mediaSnapshot,
    operationId,
    externalAccountId,
    caption: asString(contextRow.caption),
    altText: asString(contextRow.alt_text),
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
      return {
        ok: false,
        reason: "unexpected",
        claimed: true,
        providerWriteAttempted: true,
      };
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
      return {
        ok: false,
        reason: "unexpected",
        claimed: true,
        providerWriteAttempted: true,
      };
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
    publicationId,
    diagnostics: toPersistedDiagnostics(publishResult.providerDiagnostics),
  });
  if (completeCode !== "success") {
    return {
      ok: false,
      reason: "unexpected",
      claimed: true,
      providerWriteAttempted: true,
    };
  }

  return {
    ok: true,
    publicationId,
    attemptId,
    outcome: publishResult.outcome,
    externalPublicationIdPresent: false,
  };
}
