import "server-only";

import { isInvitationRawTokenShape } from "@/features/invitations/domain/raw-token-shape";
import { buildInvitationAcceptanceUrl } from "@/features/invitations/server/delivery/acceptance-url";
import {
  isInvitationEmailRecipientAllowlisted,
  resolveInvitationEmailDeliveryRuntimeConfig,
} from "@/features/invitations/server/delivery/config";
import { deliverInvitation } from "@/features/invitations/server/delivery/deliver-invitation";
import type { DeliverInvitationDeps } from "@/features/invitations/server/delivery/deliver-invitation";
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

/**
 * Post-mutation delivery orchestration.
 * Feature gate / allowlist / config fail closed before any provider call.
 * Does not log acceptance URLs or raw tokens.
 */
export async function orchestrateInvitationDelivery(
  params: OrchestrateInvitationDeliveryParams,
  deps: DeliverInvitationDeps = {},
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

  // Idempotency key must never be derived from raw token contents.
  const idempotencyKey = [
    "invitation-email",
    params.operation,
    params.invitationId,
    params.expiresAt ?? "none",
  ].join(":");

  return deliverInvitation(
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
}
