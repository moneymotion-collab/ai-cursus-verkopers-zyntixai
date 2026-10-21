"use server";

import { revalidatePath } from "next/cache";
import { CREATING_ONBOARDING_PATH } from "@/features/onboarding/domain/onboarding-routes";
import {
  executeOnboardingInviteIntentInputSchema,
  listFrozenTeamInviteIntentsInputSchema,
  onboardingInviteExecutionMessage,
  reconcileOnboardingInviteIntentInputSchema,
  type OnboardingCreatingSnapshot,
  type OnboardingFrozenIntentListResult,
  type OnboardingInviteExecutionFailure,
  type OnboardingInviteExecutionResult,
} from "@/features/onboarding/domain/onboarding-invite-execution";
import {
  executeOrganizationOnboardingInviteIntent,
  listOrganizationOnboardingFrozenTeamInviteIntents,
  loadOnboardingCreatingSnapshot,
  reconcileOrganizationOnboardingInviteIntent,
} from "@/features/onboarding/server/onboarding-invite-execution";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function invalidInput(): OnboardingInviteExecutionFailure {
  return {
    ok: false,
    code: "INVALID_INPUT",
    message: onboardingInviteExecutionMessage("INVALID_INPUT"),
  };
}

function transportFailure(): OnboardingInviteExecutionFailure {
  return {
    ok: false,
    code: "TRANSPORT_ERROR",
    message: onboardingInviteExecutionMessage("TRANSPORT_ERROR"),
  };
}

export async function listFrozenOnboardingTeamInviteIntentsAction(
  input: unknown,
): Promise<OnboardingFrozenIntentListResult> {
  const parsed = listFrozenTeamInviteIntentsInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await listOrganizationOnboardingFrozenTeamInviteIntents(
      supabase,
      parsed.data.organizationId,
    );
  } catch {
    return transportFailure();
  }
}

export async function executeOnboardingInviteIntentAction(
  input: unknown,
): Promise<OnboardingInviteExecutionResult> {
  const parsed = executeOnboardingInviteIntentInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await executeOrganizationOnboardingInviteIntent(
      supabase,
      parsed.data.organizationId,
      parsed.data.intentId,
    );
    if (result.ok) {
      revalidatePath(CREATING_ONBOARDING_PATH);
    }
    return result;
  } catch {
    return transportFailure();
  }
}

export async function reconcileOnboardingInviteIntentAction(
  input: unknown,
): Promise<OnboardingInviteExecutionResult> {
  const parsed = reconcileOnboardingInviteIntentInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await reconcileOrganizationOnboardingInviteIntent(
      supabase,
      parsed.data.organizationId,
      parsed.data.intentId,
    );
    if (result.ok) {
      revalidatePath(CREATING_ONBOARDING_PATH);
    }
    return result;
  } catch {
    return transportFailure();
  }
}

export async function recoverOnboardingCreatingStateAction(
  input: unknown,
): Promise<OnboardingCreatingSnapshot> {
  const parsed = listFrozenTeamInviteIntentsInputSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput();
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await loadOnboardingCreatingSnapshot(
      supabase,
      parsed.data.organizationId,
    );
  } catch {
    return transportFailure();
  }
}
