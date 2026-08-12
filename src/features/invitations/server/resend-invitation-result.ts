/**
 * Resend-invitation RPC result mapping (Slice 3).
 * Server-only vocabulary — raw_token never appears on action/UI result types.
 */

export const RESEND_ORGANIZATION_INVITATION_RPC =
  "resend_organization_invitation" as const;

export const RESEND_INVITATION_RESULT_CODES = [
  "success",
  "invite_not_found_or_unavailable",
  "invite_revoked",
  "invite_expired",
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
        | "unexpected";
    }
  | { kind: "transport_error" };

export type ResendInvitationUiCode =
  | "success"
  | "invite_not_found_or_unavailable"
  | "invite_revoked"
  | "invite_expired"
  | "forbidden"
  | "invalid_input"
  | "auth_required"
  | "unexpected";

export type ResendInvitationActionResult =
  | {
      ok: true;
      code: "success";
      message: string;
    }
  | {
      ok: false;
      code: Exclude<ResendInvitationUiCode, "success">;
      message: string;
    };

export const RESEND_INVITATION_MESSAGES = {
  success: "Invitation refreshed. The pending invitation was updated.",
  invite_not_found_or_unavailable:
    "This invitation is unavailable. Refresh the page and try again.",
  invite_revoked: "This invitation has already been revoked.",
  invite_expired: "This invitation has expired. Create a new invitation instead.",
  forbidden: "You do not have permission to manage this invitation.",
  invalid_input: "Unable to identify the invitation. Refresh and try again.",
  auth_required: "Sign in to manage invitations.",
  unexpected: "Unable to resend the invitation right now. Please try again.",
} as const;

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

export function mapResendInvitationRpcRow(
  row: ResendInvitationRpcRow | null | undefined,
): ResendInvitationAdapterResult {
  if (!row || typeof row !== "object") {
    return { kind: "unexpected" };
  }

  // Discard bearer material immediately — never forward it.
  void row.raw_token;

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
      };
    }
    case "invite_not_found_or_unavailable":
    case "invite_revoked":
    case "invite_expired":
    case "unexpected":
      return { kind: code };
    default:
      return { kind: "unexpected" };
  }
}

export function toResendInvitationActionResult(
  adapter: ResendInvitationAdapterResult,
): ResendInvitationActionResult {
  switch (adapter.kind) {
    case "success":
      return {
        ok: true,
        code: "success",
        message: RESEND_INVITATION_MESSAGES.success,
      };
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
