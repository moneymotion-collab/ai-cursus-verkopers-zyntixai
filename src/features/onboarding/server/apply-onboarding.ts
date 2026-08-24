import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  OnboardingCompleteInput,
  OnboardingDraftInput,
} from "@/features/onboarding/domain/onboarding-schema";
import type { OnboardingWriteResult } from "@/features/onboarding/domain/onboarding-types";
import {
  mapOnboardingRpcError,
  onboardingMessage,
} from "@/features/onboarding/server/normalize-onboarding-error";
import {
  contextFromRpcPayload,
  resolveOnboardingOrganizationId,
} from "@/features/onboarding/server/read-onboarding-context";

type ApplyArgs = {
  mode: "draft" | "complete";
  organizationId: string;
  displayName?: string;
  organizationName?: string;
  businessType?: string;
  primaryAudience?: string;
  primaryOffering?: string;
  primaryGoal?: string;
  teamSizeBand?: string;
  clearTeamSizeBand?: boolean;
};

async function applyOrganizationOnboarding(
  supabase: SupabaseClient<Database>,
  args: ApplyArgs,
): Promise<OnboardingWriteResult> {
  const resolved = await resolveOnboardingOrganizationId(
    supabase,
    args.organizationId,
  );
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.code,
      message: onboardingMessage(resolved.code),
    };
  }

  if (resolved.role !== "owner") {
    return {
      ok: false,
      code: "owner_required",
      message: onboardingMessage("owner_required"),
    };
  }

  const { data, error } = await supabase.rpc("apply_organization_onboarding", {
    p_organization_id: args.organizationId,
    p_mode: args.mode,
    p_organization_name: args.organizationName ?? undefined,
    p_display_name: args.displayName ?? undefined,
    p_business_type: args.businessType ?? undefined,
    p_primary_audience: args.primaryAudience ?? undefined,
    p_primary_offering: args.primaryOffering ?? undefined,
    p_primary_goal: args.primaryGoal ?? undefined,
    p_team_size_band: args.teamSizeBand ?? undefined,
    p_clear_team_size_band: Boolean(args.clearTeamSizeBand),
  });

  if (error) {
    const code = mapOnboardingRpcError(error);
    return {
      ok: false,
      code,
      message: onboardingMessage(code),
    };
  }

  const context = contextFromRpcPayload(data);
  if (!context) {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }

  return { ok: true, context };
}

export async function saveOnboardingDraft(
  supabase: SupabaseClient<Database>,
  input: OnboardingDraftInput,
): Promise<OnboardingWriteResult> {
  return applyOrganizationOnboarding(supabase, {
    mode: "draft",
    organizationId: input.organizationId,
    displayName: input.displayName,
    organizationName: input.organizationName,
    businessType: input.businessType,
    primaryAudience: input.primaryAudience,
    primaryOffering: input.primaryOffering,
    primaryGoal: input.primaryGoal,
    teamSizeBand: input.teamSizeBand,
    clearTeamSizeBand: input.clearTeamSizeBand,
  });
}

export async function completeOnboarding(
  supabase: SupabaseClient<Database>,
  input: OnboardingCompleteInput,
): Promise<OnboardingWriteResult> {
  return applyOrganizationOnboarding(supabase, {
    mode: "complete",
    organizationId: input.organizationId,
    displayName: input.displayName,
    organizationName: input.organizationName,
    businessType: input.businessType,
    primaryAudience: input.primaryAudience,
    primaryOffering: input.primaryOffering,
    primaryGoal: input.primaryGoal,
    teamSizeBand: input.teamSizeBand,
    clearTeamSizeBand: input.clearTeamSizeBand,
  });
}
