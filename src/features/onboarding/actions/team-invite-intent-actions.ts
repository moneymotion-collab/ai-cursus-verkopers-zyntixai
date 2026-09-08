"use server";

import { revalidatePath } from "next/cache";
import {
  createTeamInviteIntentInputSchema,
  deleteTeamInviteIntentInputSchema,
  listTeamInviteIntentsInputSchema,
  teamInviteIntentMessage,
  updateTeamInviteIntentInputSchema,
  type TeamInviteIntentDeleteResult,
  type TeamInviteIntentListResult,
  type TeamInviteIntentSaveResult,
} from "@/features/onboarding/domain/team-invite-intents";
import { TEAM_ONBOARDING_PATH } from "@/features/onboarding/domain/onboarding-routes";
import {
  createOrganizationTeamInviteIntent,
  deleteOrganizationTeamInviteIntent,
  listOrganizationTeamInviteIntents,
  updateOrganizationTeamInviteIntent,
} from "@/features/onboarding/server/team-invite-intents";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listTeamInviteIntentsAction(
  input: unknown,
): Promise<TeamInviteIntentListResult> {
  const parsed = listTeamInviteIntentsInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await listOrganizationTeamInviteIntents(
      supabase,
      parsed.data.organizationId,
    );
  } catch {
    return transportFailure();
  }
}

export async function createTeamInviteIntentAction(
  input: unknown,
): Promise<TeamInviteIntentSaveResult> {
  const parsed = createTeamInviteIntentInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: { email?: string; role?: string } = {};
    for (const issue of parsed.error.issues) {
      if (issue.path[0] === "email" && !fieldErrors.email) {
        fieldErrors.email = "Enter a valid email address.";
      }
      if (issue.path[0] === "role" && !fieldErrors.role) {
        fieldErrors.role = "Choose Admin, Staff, or Viewer.";
      }
    }
    return {
      ...invalidInput(),
      fieldErrors,
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await createOrganizationTeamInviteIntent(
      supabase,
      parsed.data,
    );
    if (result.ok) {
      revalidatePath(TEAM_ONBOARDING_PATH);
    }
    return result;
  } catch {
    return transportFailure();
  }
}

export async function updateTeamInviteIntentAction(
  input: unknown,
): Promise<TeamInviteIntentSaveResult> {
  const parsed = updateTeamInviteIntentInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await updateOrganizationTeamInviteIntent(
      supabase,
      parsed.data,
    );
    if (result.ok) {
      revalidatePath(TEAM_ONBOARDING_PATH);
    }
    return result;
  } catch {
    return transportFailure();
  }
}

export async function deleteTeamInviteIntentAction(
  input: unknown,
): Promise<TeamInviteIntentDeleteResult> {
  const parsed = deleteTeamInviteIntentInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await deleteOrganizationTeamInviteIntent(
      supabase,
      parsed.data,
    );
    if (result.ok) {
      revalidatePath(TEAM_ONBOARDING_PATH);
    }
    return result;
  } catch {
    return transportFailure();
  }
}

function invalidInput() {
  return {
    ok: false as const,
    code: "INVALID_INPUT" as const,
    message: teamInviteIntentMessage("INVALID_INPUT"),
  };
}

function transportFailure() {
  return {
    ok: false as const,
    code: "TRANSPORT_ERROR" as const,
    message: teamInviteIntentMessage("TRANSPORT_ERROR"),
  };
}
