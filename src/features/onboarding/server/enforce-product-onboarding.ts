import "server-only";

import { redirect, RedirectType } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isOnboardingComplete } from "@/features/onboarding/domain/onboarding-types";
import { buildOnboardingPath } from "@/features/onboarding/domain/onboarding-steps";
import { buildOperatingModelOnboardingPath } from "@/features/onboarding/domain/operating-model";
import { resolveOnboardingLifecycleDestination } from "@/features/onboarding/domain/onboarding-lifecycle";
import { buildOnboardingStagePath } from "@/features/onboarding/domain/onboarding-routes";
import { resolveOrganizationOnboardingLifecycle } from "@/features/onboarding/server/resolve-onboarding-lifecycle";
import {
  isCourseSellerContextPack,
  resolveOperatingModelSetupStatus,
} from "@/features/onboarding/server/operating-model-status";
import type { Database } from "@/types/database";

/**
 * Server-side product setup gate.
 * Missing or invalid context is handled before the closed TG1 first-run gate.
 * Non-Knowledge contexts do not enter the Course-Seller-specific wizard.
 * Incomplete V2 organizations are sent to the current onboarding stage, never
 * admitted. Only organization-lifecycle `v2_completed` (or contracted
 * grandfathered/legacy-complete paths) may remain on a product route.
 */
export async function redirectIfOrganizationOnboardingIncomplete(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  membershipRole: string,
): Promise<void> {
  const lifecycle = await resolveOrganizationOnboardingLifecycle(
    supabase,
    organizationId,
  );
  if (!lifecycle.ok) {
    return redirect(buildOnboardingPath(organizationId), RedirectType.push);
  }

  if (lifecycle.state.kind === "v2_completed") {
    return;
  }

  if (
    lifecycle.state.kind.startsWith("v2_") ||
    lifecycle.state.kind === "invalid"
  ) {
    const destination = resolveOnboardingLifecycleDestination(
      lifecycle.state,
      membershipRole,
    );
    return redirect(
      buildOnboardingStagePath(destination.stageRoute, organizationId),
      RedirectType.push,
    );
  }

  const operatingModel = await resolveOperatingModelSetupStatus({
    supabase,
    organizationId,
    role: membershipRole,
  });

  if (operatingModel.kind !== "configured") {
    return redirect(
      buildOperatingModelOnboardingPath(organizationId),
      RedirectType.push,
    );
  }

  if (lifecycle.state.kind === "grandfathered") {
    return;
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
    return redirect(buildOnboardingPath(organizationId), RedirectType.push);
  }

  if (!isOnboardingComplete(data?.onboarding_completed_at ?? null)) {
    return redirect(buildOnboardingPath(organizationId), RedirectType.push);
  }
}
