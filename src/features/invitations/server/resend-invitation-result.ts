/**
 * Resend-invitation RPC result mapping (Slice 3 + CB-E1-A).
 * Trusted server results may carry rawToken transiently.
 * Action/UI result types never include bearer material.
 * Mapper discards raw_token unless it matches the trusted hex shape.
 */

import type { InvitationDeliveryUiStatus } from "@/features/invitations/domain/delivery-status";
import { isInvitationRawTokenShape } from "@/features/invitations/domain/raw-token-shape";

export const RESEND_ORGANIZATION_INVITATION_RPC =
  "resend_organization_invitation" as const;

export const RESEND_INVITATION_RESULT_CODES = [
  "success",
  "invite_not_found_or_unavailable",
  "invite_revoked",
  "invite_expired",
  "rate_limited",
  "unexpected",
] as const;

export type ResendInvitationResultCode =
  (typeof RESEND_INVITATION_RESULT_CODES)[number];

/** Raw RPC row for server parsing only. */
export type ResendInvitationRpcRow = {
  result_code: string;
  invitation_id: string | null;
  expires_at: string | null;
  raw_token: string | null;
};

/**
 * Trusted adapter outcome — success may include rawToken for delivery only.
 * Never serialize this type to the browser.
 */
export type ResendInvitationTrustedAdapterResult =
  | {
      kind: "success";
      invitationId: string;
      expiresAt: string | null;
      rawToken: string | null;
    }
  | {
      kind:
        | "invite_not_found_or_unavailable"
        | "invite_revoked"
        | "invite_expired"
        | "rate_limited"
        | "unexpected";
    }
  | { kind: "transport_error" };

export type ResendInvitationAdapterResult =
  | {
      kind: "success";
      invitationId: string;
      expiresAt: string | null;
    }
  | {
      kind:
        | "invite_not_found_or_unavailable"
        | "invite_revoked"
        | "invite_expired"
        | "rate_limited"
        | "unexpected";
    }
  | { kind: "transport_error" };

export type ResendInvitationUiCode =
  | "success"
  | "invite_not_found_or_unavailable"
  | "invite_revoked"
  | "invite_expired"
  | "rate_limited"
  | "forbidden"
  | "invalid_input"
  | "auth_required"
  | "unexpected";

export type ResendInvitationActionResult =
  | {
      ok: true;
      code: "success";
      message: string;
      delivery?: InvitationDeliveryUiStatus;
    }
  | {
      ok: false;
      code: Exclude<ResendInvitationUiCode, "success">;
      message: string;
    };

export const RESEND_INVITATION_MESSAGES = {
  success: "Invitation refreshed. The pending invitation was updated.",
  success_submitted: "Invitation refreshed and email submitted.",
  success_delivery_disabled:
    "Invitation refreshed. Email delivery is currently disabled.",
  success_delivery_unavailable:
    "Invitation refreshed, but the email could not be submitted. The previous link is no longer valid. You can try Resend again later.",
  success_delivery_recipient_not_allowed:
    "Invitation refreshed, but email delivery is not available for this recipient yet. The previous link is no longer valid.",
  success_delivery_configuration_error:
    "Invitation refreshed, but email delivery is not configured. The previous link is no longer valid.",
  invite_not_found_or_unavailable:
    "This invitation is unavailable. Refresh the page and try again.",
  invite_revoked: "This invitation has already been revoked.",
  invite_expired: "This invitation has expired. Create a new invitation instead.",
  rate_limited: "Too many invitation attempts. Try again later.",
  forbidden: "You do not have permission to manage this invitation.",
  invalid_input: "Unable to identify the invitation. Refresh and try again.",
  auth_required: "Sign in to manage invitations.",
  unexpected: "Unable to resend the invitation right now. Please try again.",
} as const;

export type ResendInvitationDeliveryOutcome =
  | { kind: "submitted"; providerMessageId: string | null }
  | { kind: "delivery_disabled" }
  | { kind: "delivery_recipient_not_allowed" }
  | { kind: "delivery_configuration_error" }
  | { kind: "delivery_provider_error" };

export function normalizeResendInvitationResultCode(
  value: unknown,
): ResendInvitationResultCode {
  if (
    typeof value === "string" &&
    (RESEND_INVITATION_RESULT_CODES as readonly string[]).includes(value)
  ) {
    return value as ResendInvitationResultCode;
  }
  return "unexpected";
}

function takeTrustedRawToken(value: string | null): string | null {
  if (value === null) {
    return null;
  }
  return isInvitationRawTokenShape(value) ? value : null;
}

function toDeliveryUiStatus(
  delivery: ResendInvitationDeliveryOutcome,
): InvitationDeliveryUiStatus {
  switch (delivery.kind) {
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

export function mapResendInvitationRpcRow(
  row: ResendInvitationRpcRow | null | undefined,
): ResendInvitationTrustedAdapterResult {
  if (!row || typeof row !== "object") {
    return { kind: "unexpected" };
  }

  const code = normalizeResendInvitationResultCode(row.result_code);
  switch (code) {
    case "success": {
      if (typeof row.invitation_id !== "string" || row.invitation_id.length === 0) {
        return { kind: "unexpected" };
      }
      return {
        kind: "success",
        invitationId: row.invitation_id,
        expiresAt: typeof row.expires_at === "string" ? row.expires_at : null,
        rawToken: takeTrustedRawToken(row.raw_token),
      };
    }
    case "invite_not_found_or_unavailable":
    case "invite_revoked":
    case "invite_expired":
    case "rate_limited":
    case "unexpected":
      void row.raw_token;
      return { kind: code };
    default:
      void row.raw_token;
      return { kind: "unexpected" };
  }
}

export function toPublicResendInvitationAdapterResult(
  trusted: ResendInvitationTrustedAdapterResult,
): ResendInvitationAdapterResult {
  if (trusted.kind !== "success") {
    return trusted;
  }
  return {
    kind: "success",
    invitationId: trusted.invitationId,
    expiresAt: trusted.expiresAt,
  };
}

function resendSuccessMessage(
  delivery: ResendInvitationDeliveryOutcome | undefined,
): string {
  if (!delivery) {
    return RESEND_INVITATION_MESSAGES.success;
  }
  switch (delivery.kind) {
    case "submitted":
      return RESEND_INVITATION_MESSAGES.success_submitted;
    case "delivery_disabled":
      return RESEND_INVITATION_MESSAGES.success_delivery_disabled;
    case "delivery_recipient_not_allowed":
      return RESEND_INVITATION_MESSAGES.success_delivery_recipient_not_allowed;
    case "delivery_configuration_error":
      return RESEND_INVITATION_MESSAGES.success_delivery_configuration_error;
    case "delivery_provider_error":
      return RESEND_INVITATION_MESSAGES.success_delivery_unavailable;
    default:
      return RESEND_INVITATION_MESSAGES.success_delivery_unavailable;
  }
}

export function toResendInvitationActionResult(
  adapter: ResendInvitationAdapterResult,
  delivery?: ResendInvitationDeliveryOutcome,
): ResendInvitationActionResult {
  switch (adapter.kind) {
    case "success": {
      const deliveryStatus = delivery
        ? toDeliveryUiStatus(delivery)
        : undefined;
      return {
        ok: true,
        code: "success",
        message: resendSuccessMessage(delivery),
        ...(deliveryStatus ? { delivery: deliveryStatus } : {}),
      };
    }
    case "invite_not_found_or_unavailable":
      return {
        ok: false,
        code: "invite_not_found_or_unavailable",
        message: RESEND_INVITATION_MESSAGES.invite_not_found_or_unavailable,
      };
    case "invite_revoked":
      return {
        ok: false,
        code: "invite_revoked",
        message: RESEND_INVITATION_MESSAGES.invite_revoked,
      };
    case "invite_expired":
      return {
        ok: false,
        code: "invite_expired",
        message: RESEND_INVITATION_MESSAGES.invite_expired,
      };
    case "rate_limited":
      return {
        ok: false,
        code: "rate_limited",
        message: RESEND_INVITATION_MESSAGES.rate_limited,
      };
    case "transport_error":
    case "unexpected":
    default:
      return {
        ok: false,
        code: "unexpected",
        message: RESEND_INVITATION_MESSAGES.unexpected,
      };
  }
}
