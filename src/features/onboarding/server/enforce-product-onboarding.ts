import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isOnboardingComplete } from "@/features/onboarding/domain/onboarding-types";
import { buildOnboardingPath } from "@/features/onboarding/domain/onboarding-steps";
import type { Database } from "@/types/database";

/**
 * Server-side product gate for incomplete onboarding.
 * Owners of incomplete organizations are redirected to /onboarding.
 * Non-owners keep product access and see an owner-required state on /onboarding.
 */
export async function redirectIfOrganizationOnboardingIncomplete(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  membershipRole: string,
): Promise<void> {
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
