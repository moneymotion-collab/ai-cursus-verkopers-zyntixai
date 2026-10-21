import "server-only";

import type { InvitationDeliveryUiStatus } from "@/features/invitations/domain/delivery-status";

export type InvitationDeliveryOperation = "create" | "resend";

/**
 * Trusted delivery request — assembled only on the server after mutation success.
 * Must not be constructed from client-supplied org name / URL / role authority.
 */
export type DeliverInvitationInput = {
  invitationId: string;
  organizationId: string;
  organizationName: string;
  recipientEmail: string;
  targetRole: string;
  expiresAt: string | null;
  /** Already-built trusted acceptance URL (may contain raw token). */
  acceptanceUrl: string;
  operation: InvitationDeliveryOperation;
  /** Optional idempotency key for provider; never derived from raw token. */
  idempotencyKey?: string;
};

export type DeliverInvitationResult =
  | { kind: "submitted"; providerMessageId: string | null }
  | { kind: "delivery_disabled" }
  | { kind: "delivery_recipient_not_allowed" }
  | { kind: "delivery_configuration_error" }
  | { kind: "delivery_provider_error" };

export type InvitationEmailProviderSendParams = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
};

export type InvitationEmailProviderSendResult =
  | { ok: true; id: string | null }
  | { ok: false };

/**
 * Narrow injectable provider boundary (Resend adapter or test mock).
 */
export type InvitationEmailProvider = {
  sendInvitationEmail: (
    params: InvitationEmailProviderSendParams,
  ) => Promise<InvitationEmailProviderSendResult>;
};

export type { InvitationDeliveryUiStatus };

export function toInvitationDeliveryUiStatus(
  result: DeliverInvitationResult,
): InvitationDeliveryUiStatus {
  switch (result.kind) {
    case "submitted":
      return "submitted";
    case "delivery_disabled":
      return "disabled";
    case "delivery_recipient_not_allowed":
      return "recipient_not_allowed";
    case "delivery_configuration_error":
      return "configuration_error";
    case "delivery_provider_error":
      return "provider_error";
    default:
      return "provider_error";
  }
}
