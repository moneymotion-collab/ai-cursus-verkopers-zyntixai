/**
 * Revoke-invitation RPC result mapping (Slice 3).
 * No bearer material on action/UI result types.
 */

export const REVOKE_ORGANIZATION_INVITATION_RPC =
  "revoke_organization_invitation" as const;

export const REVOKE_INVITATION_RESULT_CODES = [
  "success",
  "invite_not_found_or_unavailable",
  "invite_revoked",
  "unexpected",
] as const;

export type RevokeInvitationResultCode =
  (typeof REVOKE_INVITATION_RESULT_CODES)[number];

export type RevokeInvitationRpcRow = {
  result_code: string;
  invitation_id: string | null;
  expires_at: string | null;
  raw_token: string | null;
};

export type RevokeInvitationAdapterResult =
  | {
      kind: "success";
      invitationId: string;
    }
  | {
      kind: "invite_not_found_or_unavailable" | "invite_revoked" | "unexpected";
    }
  | { kind: "transport_error" };

export type RevokeInvitationUiCode =
  | "success"
  | "invite_not_found_or_unavailable"
  | "invite_revoked"
  | "forbidden"
  | "invalid_input"
  | "auth_required"
  | "unexpected";

export type RevokeInvitationActionResult =
  | {
      ok: true;
      code: "success";
      message: string;
    }
  | {
      ok: false;
      code: Exclude<RevokeInvitationUiCode, "success">;
      message: string;
    };

export const REVOKE_INVITATION_MESSAGES = {
  success: "Invitation revoked.",
  invite_not_found_or_unavailable:
    "This invitation is unavailable. Refresh the page and try again.",
  invite_revoked: "This invitation has already been revoked.",
  forbidden: "You do not have permission to manage this invitation.",
  invalid_input: "Unable to identify the invitation. Refresh and try again.",
  auth_required: "Sign in to manage invitations.",
  unexpected: "Unable to revoke the invitation right now. Please try again.",
} as const;

export function normalizeRevokeInvitationResultCode(
  value: unknown,
): RevokeInvitationResultCode {
  if (
    typeof value === "string" &&
    (REVOKE_INVITATION_RESULT_CODES as readonly string[]).includes(value)
  ) {
    return value as RevokeInvitationResultCode;
  }
  return "unexpected";
}

export function mapRevokeInvitationRpcRow(
  row: RevokeInvitationRpcRow | null | undefined,
): RevokeInvitationAdapterResult {
  if (!row || typeof row !== "object") {
    return { kind: "unexpected" };
  }

  // Revoke success returns null raw_token; still discard any value defensively.
  void row.raw_token;

  const code = normalizeRevokeInvitationResultCode(row.result_code);
  switch (code) {
    case "success": {
      if (typeof row.invitation_id !== "string" || row.invitation_id.length === 0) {
        return { kind: "unexpected" };
      }
      return { kind: "success", invitationId: row.invitation_id };
    }
    case "invite_not_found_or_unavailable":
    case "invite_revoked":
    case "unexpected":
      return { kind: code };
    default:
      return { kind: "unexpected" };
  }
}

export function toRevokeInvitationActionResult(
  adapter: RevokeInvitationAdapterResult,
): RevokeInvitationActionResult {
  switch (adapter.kind) {
    case "success":
      return {
        ok: true,
        code: "success",
        message: REVOKE_INVITATION_MESSAGES.success,
      };
    case "invite_not_found_or_unavailable":
      return {
        ok: false,
        code: "invite_not_found_or_unavailable",
        message: REVOKE_INVITATION_MESSAGES.invite_not_found_or_unavailable,
      };
    case "invite_revoked":
      return {
        ok: false,
        code: "invite_revoked",
        message: REVOKE_INVITATION_MESSAGES.invite_revoked,
      };
    case "transport_error":
    case "unexpected":
    default:
      return {
        ok: false,
        code: "unexpected",
        message: REVOKE_INVITATION_MESSAGES.unexpected,
      };
  }
}
