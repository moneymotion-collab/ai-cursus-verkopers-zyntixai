import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isOnboardingComplete } from "@/features/onboarding/domain/onboarding-types";
import { buildOnboardingPath } from "@/features/onboarding/domain/onboarding-steps";
import { buildOperatingModelOnboardingPath } from "@/features/onboarding/domain/operating-model";
import {
  isCourseSellerContextPack,
  resolveOperatingModelSetupStatus,
} from "@/features/onboarding/server/operating-model-status";
import type { Database } from "@/types/database";

/**
 * Server-side product setup gate.
 * Missing or invalid context is handled before the closed TG1 first-run gate.
 * Non-Knowledge contexts do not enter the Course-Seller-specific wizard.
 */
export async function redirectIfOrganizationOnboardingIncomplete(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  membershipRole: string,
): Promise<void> {
  const operatingModel = await resolveOperatingModelSetupStatus({
    supabase,
    organizationId,
    role: membershipRole,
  });

  if (operatingModel.kind !== "configured") {
    redirect(buildOperatingModelOnboardingPath(organizationId));
  }

  if (!isCourseSellerContextPack(operatingModel.packKey)) {
    return;
  }

  if (membershipRole !== "owner") {
    return;
  }

  const { data, error } = await supabase
    .from("organizations")
    .select("onboarding_completed_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    redirect(buildOnboardingPath(organizationId));
  }

  if (!isOnboardingComplete(data?.onboarding_completed_at ?? null)) {
    redirect(buildOnboardingPath(organizationId));
  }
}
