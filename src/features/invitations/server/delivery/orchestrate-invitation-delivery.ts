import "server-only";

import { isInvitationRawTokenShape } from "@/features/invitations/domain/raw-token-shape";
import { buildInvitationAcceptanceUrl } from "@/features/invitations/server/delivery/acceptance-url";
import type { InvitationDeliveryAttemptStore } from "@/features/invitations/server/delivery/attempt-store";
import {
  isInvitationEmailRecipientAllowlisted,
  resolveInvitationEmailDeliveryRuntimeConfig,
} from "@/features/invitations/server/delivery/config";
import { deliverInvitation } from "@/features/invitations/server/delivery/deliver-invitation";
import type { DeliverInvitationDeps } from "@/features/invitations/server/delivery/deliver-invitation";
import {
  buildInvitationDeliveryGenerationKey,
  buildInvitationDeliveryIdempotencyKey,
} from "@/features/invitations/server/delivery/idempotency";
import type {
  DeliverInvitationResult,
  InvitationDeliveryOperation,
} from "@/features/invitations/server/delivery/types";

export type OrchestrateInvitationDeliveryParams = {
  /** Transient raw credential; must not be logged or returned. */
  rawToken: string | null;
  invitationId: string;
  organizationId: string;
  recipientEmail: string;
  targetRole: string;
  expiresAt: string | null;
  operation: InvitationDeliveryOperation;
  loadOrganizationName: () => Promise<string | null>;
};

export type OrchestrateInvitationDeliveryDeps = DeliverInvitationDeps & {
  attemptStore?: InvitationDeliveryAttemptStore;
};

function failureCategoryForResult(
  result: DeliverInvitationResult,
): "provider_error" | "configuration_error" | "template_error" | null {
  switch (result.kind) {
    case "delivery_provider_error":
      return "provider_error";
    case "delivery_configuration_error":
      return "configuration_error";
    default:
      return null;
  }
}

/**
 * Post-mutation delivery orchestration.
 * Feature gate / allowlist / config fail closed before any provider call.
 * Application + provider idempotency protect one logical credential generation.
 * Does not log acceptance URLs or raw tokens.
 * Zero automatic provider retries (CB-E1-C): uncertain responses rely on
 * provider idempotency + attempt store for safe later same-request re-entry.
 */
export async function orchestrateInvitationDelivery(
  params: OrchestrateInvitationDeliveryParams,
  deps: OrchestrateInvitationDeliveryDeps = {},
): Promise<DeliverInvitationResult> {
  const env = deps.env ?? process.env;
  const runtime = resolveInvitationEmailDeliveryRuntimeConfig(env);

  if (runtime.kind === "disabled") {
    return { kind: "delivery_disabled" };
  }

  if (runtime.kind === "configuration_error") {
    return { kind: "delivery_configuration_error" };
  }

  if (!params.rawToken || !isInvitationRawTokenShape(params.rawToken)) {
    return { kind: "delivery_configuration_error" };
  }

  if (
    !isInvitationEmailRecipientAllowlisted(
      params.recipientEmail,
      runtime.allowlist,
    )
  ) {
    return { kind: "delivery_recipient_not_allowed" };
  }

  const acceptanceUrl = buildInvitationAcceptanceUrl(params.rawToken, env);
  if (!acceptanceUrl) {
    return { kind: "delivery_configuration_error" };
  }

  const organizationName = await params.loadOrganizationName();
  if (!organizationName) {
    return { kind: "delivery_configuration_error" };
  }

  const generationKey = buildInvitationDeliveryGenerationKey({
    invitationId: params.invitationId,
    operation: params.operation,
    expiresAt: params.expiresAt,
  });
  const idempotencyKey = buildInvitationDeliveryIdempotencyKey({
    invitationId: params.invitationId,
    operation: params.operation,
    expiresAt: params.expiresAt,
  });

  let attemptId: string | null = null;
  const store = deps.attemptStore;

  if (store) {
    const resolved = await store.resolveAttempt({
      organizationId: params.organizationId,
      invitationId: params.invitationId,
      operation: params.operation,
      generationKey,
      idempotencyKey,
    });

    if (resolved.outcome === "already_submitted") {
      return {
        kind: "submitted",
        providerMessageId: resolved.providerMessageId,
      };
    }

    if (resolved.outcome === "proceed") {
      attemptId = resolved.attemptId;
    }
    // store_unavailable → continue without blocking delivery (provider idempotency remains)
  }

  const result = await deliverInvitation(
    {
      invitationId: params.invitationId,
      organizationId: params.organizationId,
      organizationName,
      recipientEmail: params.recipientEmail,
      targetRole: params.targetRole,
      expiresAt: params.expiresAt,
      acceptanceUrl,
      operation: params.operation,
      idempotencyKey,
    },
    deps,
  );

  if (store && attemptId) {
    if (result.kind === "submitted") {
      await store.completeAttempt({
        organizationId: params.organizationId,
        attemptId,
        status: "submitted",
        providerMessageId: result.providerMessageId,
      });
    } else {
      const failureCategory = failureCategoryForResult(result);
      if (failureCategory) {
        await store.completeAttempt({
          organizationId: params.organizationId,
          attemptId,
          status: "failed",
          failureCategory,
        });
      }
    }
  }

  return result;
}
