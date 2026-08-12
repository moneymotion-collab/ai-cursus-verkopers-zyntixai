"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageOrganizationInvitation } from "@/features/invitations/domain/permissions";
import { isOrganizationInvitationResendable } from "@/features/invitations/domain/lifecycle";
import { MEMBERS_ROUTE } from "@/features/invitations/domain/members-navigation";
import { validateManageOrganizationInvitationInput } from "@/features/invitations/validation/mutation-schemas";
import { loadInvitationForManage } from "@/features/invitations/server/load-invitation-for-manage";
import { resendOrganizationInvitation } from "@/features/invitations/server/resend-invitation";
import {
  RESEND_INVITATION_MESSAGES,
  toResendInvitationActionResult,
  type ResendInvitationActionResult,
} from "@/features/invitations/server/resend-invitation-result";

export type ResendInvitationActionInput = {
  organizationId: string;
  invitationId: string;
};

/**
 * Pending invitation resend action.
 * Organization id is re-verified; invitation state and manage permission are
 * resolved server-side. RPC bearer material never reaches this return type.
 */
export async function resendInvitationAction(
  input: ResendInvitationActionInput,
): Promise<ResendInvitationActionResult> {
  try {
    const parsed = validateManageOrganizationInvitationInput(input);
    if (!parsed.success) {
      return {
        ok: false,
        code: "invalid_input",
        message: RESEND_INVITATION_MESSAGES.invalid_input,
      };
    }

    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        ok: false,
        code: "auth_required",
        message: RESEND_INVITATION_MESSAGES.auth_required,
      };
    }

    const orgContext = await resolveOrganizationContext({
      supabase,
      organizationId: parsed.data.organizationId,
    });

    if (!orgContext.ok) {
      if (orgContext.error.code === "AUTH_REQUIRED") {
        return {
          ok: false,
          code: "auth_required",
          message: RESEND_INVITATION_MESSAGES.auth_required,
        };
      }
      return {
        ok: false,
        code: "forbidden",
        message: RESEND_INVITATION_MESSAGES.forbidden,
      };
    }

    const { role, organizationId } = orgContext.context;

    const loaded = await loadInvitationForManage(supabase, {
      organizationId,
      invitationId: parsed.data.invitationId,
    });

    if (!loaded.ok) {
      return {
        ok: false,
        code: "invite_not_found_or_unavailable",
        message: RESEND_INVITATION_MESSAGES.invite_not_found_or_unavailable,
      };
    }

    const { invitation } = loaded;

    if (!canManageOrganizationInvitation(role, "active", invitation.role)) {
      return {
        ok: false,
        code: "forbidden",
        message: RESEND_INVITATION_MESSAGES.forbidden,
      };
    }

    if (
      invitation.status !== "pending" ||
      !isOrganizationInvitationResendable({
        status: "pending",
        expiresAt: invitation.expiresAt,
        now: new Date().toISOString(),
      })
    ) {
      return {
        ok: false,
        code: "invite_not_found_or_unavailable",
        message: RESEND_INVITATION_MESSAGES.invite_not_found_or_unavailable,
      };
    }

    const adapterResult = await resendOrganizationInvitation(supabase, {
      organizationId,
      invitationId: invitation.invitationId,
    });

    const actionResult = toResendInvitationActionResult(adapterResult);

    if (actionResult.ok) {
      revalidatePath(MEMBERS_ROUTE);
    }

    return actionResult;
  } catch {
    return {
      ok: false,
      code: "unexpected",
      message: RESEND_INVITATION_MESSAGES.unexpected,
    };
  }
}
