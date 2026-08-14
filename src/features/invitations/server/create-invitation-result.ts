/**
 * Create-invitation RPC result mapping (Slice 2 + CB-E1-A).
 * Trusted server results may carry rawToken transiently.
 * Action/UI result types never include bearer material.
 * Mapper discards raw_token unless it matches the trusted hex shape.
 */

import type { InvitationDeliveryUiStatus } from "@/features/invitations/domain/delivery-status";
import { isInvitationRawTokenShape } from "@/features/invitations/domain/raw-token-shape";

export const CREATE_ORGANIZATION_INVITATION_RPC =
  "create_organization_invitation" as const;

/** Exact published create RPC business result codes. */
export const CREATE_INVITATION_RESULT_CODES = [
  "success",
  "already_member",
  "existing_membership_requires_admin_action",
  "invite_already_pending",
  "forbidden",
  "invalid_input",
  "rate_limited",
  "unexpected",
] as const;

export type CreateInvitationResultCode =
  (typeof CREATE_INVITATION_RESULT_CODES)[number];

/**
 * Raw RPC row shape for server-side parsing only.
 * raw_token must not leave trusted server mapping except as typed rawToken.
 */
export type CreateInvitationRpcRow = {
  result_code: string;
  invitation_id: string | null;
  expires_at: string | null;
  raw_token: string | null;
};

/**
 * Trusted adapter outcome — success may include rawToken for delivery orchestration only.
 * Never serialize this type to the browser.
 */
export type CreateInvitationTrustedAdapterResult =
  | {
      kind: "success";
      invitationId: string;
      expiresAt: string | null;
      rawToken: string | null;
    }
  | {
      kind: "invite_already_pending";
      invitationId: string | null;
      expiresAt: string | null;
    }
  | {
      kind:
        | "already_member"
        | "existing_membership_requires_admin_action"
        | "forbidden"
        | "invalid_input"
        | "rate_limited"
        | "unexpected";
    }
  | { kind: "transport_error" };

/** Public adapter outcome after rawToken has been discarded. */
export type CreateInvitationAdapterResult =
  | {
      kind: "success";
      invitationId: string;
      expiresAt: string | null;
    }
  | {
      kind: "invite_already_pending";
      invitationId: string | null;
      expiresAt: string | null;
    }
  | {
      kind:
        | "already_member"
        | "existing_membership_requires_admin_action"
        | "forbidden"
        | "invalid_input"
        | "rate_limited"
        | "unexpected";
    }
  | { kind: "transport_error" };

/** Safe client-facing action codes — no bearer material. */
export type CreateInvitationUiCode =
  | "success"
  | "already_member"
  | "existing_membership_requires_admin_action"
  | "invite_already_pending"
  | "forbidden"
  | "invalid_input"
  | "rate_limited"
  | "auth_required"
  | "unexpected";

export type CreateInvitationActionResult =
  | {
      ok: true;
      code: "success";
      message: string;
      delivery?: InvitationDeliveryUiStatus;
    }
  | {
      ok: false;
      code: Exclude<CreateInvitationUiCode, "success">;
      message: string;
      fieldErrors?: {
        email?: string;
        targetRole?: string;
      };
    };

export const CREATE_INVITATION_MESSAGES = {
  success: "Invitation created. It is pending.",
  success_delivery_unavailable:
    "Invitation created, but the invitation email could not be sent. You can try resending later.",
  already_member: "This person is already an active member.",
  existing_membership_requires_admin_action:
    "This person already has a membership that requires administrator action before they can be invited again.",
  invite_already_pending:
    "A pending invitation already exists for this email address.",
  forbidden: "You do not have permission to invite with that role.",
  invalid_input: "Check the email and role, then try again.",
  rate_limited: "Too many invitation attempts. Try again later.",
  auth_required: "Sign in to invite a member.",
  unexpected: "Unable to create the invitation right now. Please try again.",
} as const;

export type CreateInvitationDeliveryOutcome =
  | { kind: "submitted"; providerMessageId: string | null }
  | { kind: "delivery_disabled" }
  | { kind: "delivery_recipient_not_allowed" }
  | { kind: "delivery_configuration_error" }
  | { kind: "delivery_provider_error" };

export function normalizeCreateInvitationResultCode(
  value: unknown,
): CreateInvitationResultCode {
  if (
    typeof value === "string" &&
    (CREATE_INVITATION_RESULT_CODES as readonly string[]).includes(value)
  ) {
    return value as CreateInvitationResultCode;
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
  delivery: CreateInvitationDeliveryOutcome,
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

/**
 * Map RPC row to trusted adapter result.
 * Intentionally discards raw_token values that are not valid invitation credentials.
 */
export function mapCreateInvitationRpcRow(
  row: CreateInvitationRpcRow | null | undefined,
): CreateInvitationTrustedAdapterResult {
  if (!row || typeof row !== "object") {
    return { kind: "unexpected" };
  }

  const code = normalizeCreateInvitationResultCode(row.result_code);

  switch (code) {
    case "success": {
      if (typeof row.invitation_id !== "string" || row.invitation_id.length === 0) {
        return { kind: "unexpected" };
      }
      return {
        kind: "success",
        invitationId: row.invitation_id,
        expiresAt:
          typeof row.expires_at === "string" ? row.expires_at : null,
        rawToken: takeTrustedRawToken(row.raw_token),
      };
    }
    case "invite_already_pending":
      // Discard any bearer material on non-success paths.
      void row.raw_token;
      return {
        kind: "invite_already_pending",
        invitationId:
          typeof row.invitation_id === "string" ? row.invitation_id : null,
        expiresAt:
          typeof row.expires_at === "string" ? row.expires_at : null,
      };
    case "already_member":
    case "existing_membership_requires_admin_action":
    case "forbidden":
    case "invalid_input":
    case "rate_limited":
    case "unexpected":
      void row.raw_token;
      return { kind: code };
    default:
      void row.raw_token;
      return { kind: "unexpected" };
  }
}

export function toPublicCreateInvitationAdapterResult(
  trusted: CreateInvitationTrustedAdapterResult,
): CreateInvitationAdapterResult {
  if (trusted.kind !== "success") {
    return trusted;
  }
  return {
    kind: "success",
    invitationId: trusted.invitationId,
    expiresAt: trusted.expiresAt,
  };
}

function createSuccessMessage(
  delivery: CreateInvitationDeliveryOutcome | undefined,
): string {
  if (!delivery) {
    return CREATE_INVITATION_MESSAGES.success;
  }
  switch (delivery.kind) {
    case "submitted":
    case "delivery_disabled":
      return CREATE_INVITATION_MESSAGES.success;
    case "delivery_recipient_not_allowed":
    case "delivery_configuration_error":
    case "delivery_provider_error":
      return CREATE_INVITATION_MESSAGES.success_delivery_unavailable;
    default:
      return CREATE_INVITATION_MESSAGES.success_delivery_unavailable;
  }
}

export function toCreateInvitationActionResult(
  adapter: CreateInvitationAdapterResult,
  delivery?: CreateInvitationDeliveryOutcome,
): CreateInvitationActionResult {
  switch (adapter.kind) {
    case "success": {
      const deliveryStatus = delivery
        ? toDeliveryUiStatus(delivery)
        : undefined;
      return {
        ok: true,
        code: "success",
        message: createSuccessMessage(delivery),
        ...(deliveryStatus ? { delivery: deliveryStatus } : {}),
      };
    }
    case "already_member":
      return {
        ok: false,
        code: "already_member",
        message: CREATE_INVITATION_MESSAGES.already_member,
      };
    case "existing_membership_requires_admin_action":
      return {
        ok: false,
        code: "existing_membership_requires_admin_action",
        message:
          CREATE_INVITATION_MESSAGES.existing_membership_requires_admin_action,
      };
    case "invite_already_pending":
      return {
        ok: false,
        code: "invite_already_pending",
        message: CREATE_INVITATION_MESSAGES.invite_already_pending,
      };
    case "forbidden":
      return {
        ok: false,
        code: "forbidden",
        message: CREATE_INVITATION_MESSAGES.forbidden,
      };
    case "invalid_input":
      return {
        ok: false,
        code: "invalid_input",
        message: CREATE_INVITATION_MESSAGES.invalid_input,
      };
    case "rate_limited":
      return {
        ok: false,
        code: "rate_limited",
        message: CREATE_INVITATION_MESSAGES.rate_limited,
      };
    case "transport_error":
    case "unexpected":
    default:
      return {
        ok: false,
        code: "unexpected",
        message: CREATE_INVITATION_MESSAGES.unexpected,
      };
  }
}
