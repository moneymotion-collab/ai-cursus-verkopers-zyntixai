/**
 * Narrow Accept RPC result vocabulary (Slice C).
 * Maps only published Acceptance business codes — no generated DB types.
 */

export const ACCEPT_ORGANIZATION_INVITATION_RPC =
  "accept_organization_invitation" as const;

/** Exact published Acceptance RPC business result codes. */
export const ACCEPT_INVITATION_RESULT_CODES = [
  "success",
  "already_member",
  "existing_membership_requires_admin_action",
  "invite_not_found_or_unavailable",
  "email_mismatch",
  "forbidden",
  "unexpected",
] as const;

export type AcceptInvitationResultCode =
  (typeof ACCEPT_INVITATION_RESULT_CODES)[number];

export type AcceptInvitationRpcRow = {
  result_code: string;
  invitation_id: string | null;
  organization_id: string | null;
  membership_id: string | null;
};

export type AcceptInvitationAdapterResult =
  | {
      kind: "success" | "already_member";
      organizationId: string;
      membershipId: string;
      invitationId: string | null;
    }
  | {
      kind:
        | "existing_membership_requires_admin_action"
        | "invite_not_found_or_unavailable"
        | "email_mismatch"
        | "forbidden"
        | "unexpected";
    }
  | {
      kind: "transport_error";
    };

/** Safe UI-facing codes (no DB IDs). */
export type AcceptInvitationUiCode =
  | "email_mismatch"
  | "verification_required"
  | "admin_action_required"
  | "invitation_unavailable"
  | "auth_required"
  | "origin_rejected"
  | "unexpected";

export type AcceptInvitationActionResult =
  | {
      ok: false;
      code: AcceptInvitationUiCode;
      message: string;
    };

export const ACCEPT_INVITATION_MESSAGES = {
  email_mismatch:
    "Sign in with the email address that received this invitation.",
  verification_required:
    "Verify your email address before accepting this invitation.",
  admin_action_required:
    "Your existing membership requires administrator action.",
  invitation_unavailable:
    "This invitation is unavailable. Reopen the latest invitation link if you still need access.",
  auth_required: "Sign in to accept this invitation.",
  origin_rejected: "Unable to accept this invitation. Please try again.",
  unexpected: "Unable to accept this invitation right now. Please try again.",
} as const;

export function normalizeAcceptInvitationResultCode(
  value: unknown,
): AcceptInvitationResultCode {
  if (
    typeof value === "string" &&
    (ACCEPT_INVITATION_RESULT_CODES as readonly string[]).includes(value)
  ) {
    return value as AcceptInvitationResultCode;
  }
  return "unexpected";
}

export function mapAcceptInvitationRpcRow(
  row: AcceptInvitationRpcRow | null | undefined,
): AcceptInvitationAdapterResult {
  if (!row || typeof row !== "object") {
    return { kind: "unexpected" };
  }

  const code = normalizeAcceptInvitationResultCode(row.result_code);

  if (code === "success" || code === "already_member") {
    const organizationId =
      typeof row.organization_id === "string" ? row.organization_id : null;
    const membershipId =
      typeof row.membership_id === "string" ? row.membership_id : null;
    if (!organizationId || !membershipId) {
      return { kind: "unexpected" };
    }
    return {
      kind: code,
      organizationId,
      membershipId,
      invitationId:
        typeof row.invitation_id === "string" ? row.invitation_id : null,
    };
  }

  return { kind: code };
}

export function toAcceptInvitationUiResult(
  kind: AcceptInvitationAdapterResult["kind"] | "auth_required" | "origin_rejected",
): AcceptInvitationActionResult {
  switch (kind) {
    case "email_mismatch":
      return {
        ok: false,
        code: "email_mismatch",
        message: ACCEPT_INVITATION_MESSAGES.email_mismatch,
      };
    case "forbidden":
      return {
        ok: false,
        code: "verification_required",
        message: ACCEPT_INVITATION_MESSAGES.verification_required,
      };
    case "existing_membership_requires_admin_action":
      return {
        ok: false,
        code: "admin_action_required",
        message: ACCEPT_INVITATION_MESSAGES.admin_action_required,
      };
    case "invite_not_found_or_unavailable":
      return {
        ok: false,
        code: "invitation_unavailable",
        message: ACCEPT_INVITATION_MESSAGES.invitation_unavailable,
      };
    case "auth_required":
      return {
        ok: false,
        code: "auth_required",
        message: ACCEPT_INVITATION_MESSAGES.auth_required,
      };
    case "origin_rejected":
      return {
        ok: false,
        code: "origin_rejected",
        message: ACCEPT_INVITATION_MESSAGES.origin_rejected,
      };
    case "success":
    case "already_member":
    case "unexpected":
    case "transport_error":
    default:
      return {
        ok: false,
        code: "unexpected",
        message: ACCEPT_INVITATION_MESSAGES.unexpected,
      };
  }
}
