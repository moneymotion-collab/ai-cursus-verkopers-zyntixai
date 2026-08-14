"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canCreateOrganizationInvitation } from "@/features/invitations/domain/permissions";
import { MEMBERS_ROUTE } from "@/features/invitations/domain/members-navigation";
import { validateCreateOrganizationInvitationInput } from "@/features/invitations/validation/mutation-schemas";
import { createOrganizationInvitation } from "@/features/invitations/server/create-invitation";
import {
  CREATE_INVITATION_MESSAGES,
  toCreateInvitationActionResult,
  toPublicCreateInvitationAdapterResult,
  type CreateInvitationActionResult,
} from "@/features/invitations/server/create-invitation-result";
import { loadOrganizationDisplayNameForDelivery } from "@/features/invitations/server/delivery/load-organization-display-name";
import { createSupabaseInvitationDeliveryAttemptStore } from "@/features/invitations/server/delivery/attempt-store";
import { orchestrateInvitationDelivery } from "@/features/invitations/server/delivery/orchestrate-invitation-delivery";

export type CreateInvitationActionInput = {
  organizationId: string;
  email: string;
  targetRole: string;
};

/**
 * Invite Member create action.
 * Organization id is re-verified against active membership — never trusted alone.
 * RPC bearer material never reaches this return type.
 * Delivery runs only after successful mutation (CB-R1 denials → zero provider calls).
 */
export async function createInvitationAction(
  input: CreateInvitationActionInput,
): Promise<CreateInvitationActionResult> {
  try {
    const parsed = validateCreateOrganizationInvitationInput(input);
    if (!parsed.success) {
      const fieldErrors: { email?: string; targetRole?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "email" && !fieldErrors.email) {
          fieldErrors.email = issue.message;
        }
        if (key === "targetRole" && !fieldErrors.targetRole) {
          fieldErrors.targetRole = issue.message;
        }
      }
      return {
        ok: false,
        code: "invalid_input",
        message: CREATE_INVITATION_MESSAGES.invalid_input,
        fieldErrors:
          Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined,
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
        message: CREATE_INVITATION_MESSAGES.auth_required,
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
          message: CREATE_INVITATION_MESSAGES.auth_required,
        };
      }
      return {
        ok: false,
        code: "forbidden",
        message: CREATE_INVITATION_MESSAGES.forbidden,
      };
    }

    const { role, organizationId } = orgContext.context;

    if (
      !canCreateOrganizationInvitation(role, "active", parsed.data.targetRole)
    ) {
      return {
        ok: false,
        code: "forbidden",
        message: CREATE_INVITATION_MESSAGES.forbidden,
      };
    }

    const trustedResult = await createOrganizationInvitation(supabase, {
      organizationId,
      email: parsed.data.email,
      targetRole: parsed.data.targetRole,
    });

    if (trustedResult.kind !== "success") {
      return toCreateInvitationActionResult(trustedResult);
    }

    const { rawToken, invitationId, expiresAt } = trustedResult;
    const publicResult = toPublicCreateInvitationAdapterResult(trustedResult);

    const delivery = await orchestrateInvitationDelivery(
      {
        rawToken,
        invitationId,
        organizationId,
        recipientEmail: parsed.data.email,
        targetRole: parsed.data.targetRole,
        expiresAt,
        operation: "create",
        loadOrganizationName: () =>
          loadOrganizationDisplayNameForDelivery(supabase, organizationId),
      },
      {
        attemptStore: createSupabaseInvitationDeliveryAttemptStore(supabase),
      },
    );

    const actionResult = toCreateInvitationActionResult(publicResult, delivery);

    if (actionResult.ok) {
      revalidatePath(MEMBERS_ROUTE);
    }

    return actionResult;
  } catch {
    return {
      ok: false,
      code: "unexpected",
      message: CREATE_INVITATION_MESSAGES.unexpected,
    };
  }
}
