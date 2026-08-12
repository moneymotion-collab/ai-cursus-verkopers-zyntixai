/**
 * Create-invitation RPC result mapping (Slice 2).
 * Server-only vocabulary — raw_token never appears on action/UI result types.
 */

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
  "unexpected",
] as const;

export type CreateInvitationResultCode =
  (typeof CREATE_INVITATION_RESULT_CODES)[number];

/**
 * Raw RPC row shape for server-side parsing only.
 * raw_token must be discarded immediately after classification.
 */
export type CreateInvitationRpcRow = {
  result_code: string;
  invitation_id: string | null;
  expires_at: string | null;
  raw_token: string | null;
};

/** Adapter outcome after raw_token has been discarded. */
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
  | "auth_required"
  | "unexpected";

export type CreateInvitationActionResult =
  | {
      ok: true;
      code: "success";
      message: string;
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
  already_member: "This person is already an active member.",
  existing_membership_requires_admin_action:
    "This person already has a membership that requires administrator action before they can be invited again.",
  invite_already_pending:
    "A pending invitation already exists for this email address.",
  forbidden: "You do not have permission to invite with that role.",
  invalid_input: "Check the email and role, then try again.",
  auth_required: "Sign in to invite a member.",
  unexpected: "Unable to create the invitation right now. Please try again.",
} as const;

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

/**
 * Map RPC row to adapter result.
 * Intentionally ignores / discards raw_token — never forward it.
 */
export function mapCreateInvitationRpcRow(
  row: CreateInvitationRpcRow | null | undefined,
): CreateInvitationAdapterResult {
  if (!row || typeof row !== "object") {
    return { kind: "unexpected" };
  }

  // Discard bearer material immediately — do not assign to result.
  void row.raw_token;

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
      };
    }
    case "invite_already_pending":
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
    case "unexpected":
      return { kind: code };
    default:
      return { kind: "unexpected" };
  }
}

export function toCreateInvitationActionResult(
  adapter: CreateInvitationAdapterResult,
): CreateInvitationActionResult {
  switch (adapter.kind) {
    case "success":
      return {
        ok: true,
        code: "success",
        message: CREATE_INVITATION_MESSAGES.success,
      };
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
