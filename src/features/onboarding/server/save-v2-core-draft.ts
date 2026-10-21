import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { V2CoreDraftInput } from "@/features/onboarding/domain/onboarding-schema";
import type { OnboardingWriteResult } from "@/features/onboarding/domain/onboarding-types";
import { saveOnboardingDraft } from "@/features/onboarding/server/apply-onboarding";
import { onboardingMessage } from "@/features/onboarding/server/normalize-onboarding-error";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import type { Database } from "@/types/database";

/**
 * V2-only application guard around the existing atomic onboarding draft RPC.
 * The authenticated RPC remains the mutation authority and rechecks ownership.
 */
export async function saveV2CoreDraft(
  supabase: SupabaseClient<Database>,
  input: V2CoreDraftInput,
): Promise<OnboardingWriteResult> {
  const actor = await resolveOnboardingOrganizationId(
    supabase,
    input.organizationId,
  );
  if (!actor.ok) {
    return {
      ok: false,
      code: actor.code,
      message: onboardingMessage(actor.code),
    };
  }
  if (actor.role !== "owner") {
    return {
      ok: false,
      code: "owner_required",
      message: onboardingMessage("owner_required"),
    };
  }

  const { data: organization, error } = await supabase
    .from("organizations")
    .select("onboarding_flow_version")
    .eq("id", actor.organizationId)
    .maybeSingle();
  if (error || !organization) {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }
  if (organization.onboarding_flow_version !== 2) {
    return {
      ok: false,
      code: "validation_error",
      message: "This organization does not use the current setup flow.",
    };
  }

  return saveOnboardingDraft(supabase, {
    organizationId: actor.organizationId,
    displayName: input.displayName,
    organizationName: input.organizationName,
    teamSizeBand: input.teamSizeBand,
  });
}
