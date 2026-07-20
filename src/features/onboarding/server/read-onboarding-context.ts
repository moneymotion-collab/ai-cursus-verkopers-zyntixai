import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import {
  BUSINESS_TYPES,
  PRIMARY_AUDIENCES,
  PRIMARY_GOALS,
  PRIMARY_OFFERINGS,
  TEAM_SIZE_BANDS,
  type BusinessType,
  type PrimaryAudience,
  type PrimaryGoal,
  type PrimaryOffering,
  type TeamSizeBand,
} from "@/features/onboarding/domain/onboarding-options";
import {
  computeMissingRequiredFields,
  isOnboardingComplete,
  type OnboardingContext,
  type OnboardingReadResult,
} from "@/features/onboarding/domain/onboarding-types";
import { onboardingMessage } from "@/features/onboarding/server/normalize-onboarding-error";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";

function asEnum<T extends string>(
  value: string | null | undefined,
  allowed: readonly T[],
): T | null {
  if (!value) {
    return null;
  }
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

type OrgOnboardingRow = {
  id: string;
  name: string;
  business_type: string | null;
  primary_audience: string | null;
  primary_offering: string | null;
  primary_goal: string | null;
  team_size_band: string | null;
  onboarding_completed_at: string | null;
  first_run_checklist_dismissed_at: string | null;
};

export function buildOnboardingContext(params: {
  organizationId: string;
  organizationName: string;
  displayName: string | null;
  businessType: string | null;
  primaryAudience: string | null;
  primaryOffering: string | null;
  primaryGoal: string | null;
  teamSizeBand: string | null;
  onboardingCompletedAt: string | null;
  firstRunChecklistDismissedAt: string | null;
}): OnboardingContext {
  const missingRequiredFields = computeMissingRequiredFields({
    displayName: params.displayName,
    organizationName: params.organizationName,
    businessType: params.businessType,
    primaryAudience: params.primaryAudience,
    primaryOffering: params.primaryOffering,
    primaryGoal: params.primaryGoal,
  });

  return {
    organizationId: params.organizationId,
    displayName: params.displayName,
    organizationName: params.organizationName,
    businessType: asEnum(params.businessType, BUSINESS_TYPES),
    primaryAudience: asEnum(params.primaryAudience, PRIMARY_AUDIENCES),
    primaryOffering: asEnum(params.primaryOffering, PRIMARY_OFFERINGS),
    primaryGoal: asEnum(params.primaryGoal, PRIMARY_GOALS),
    teamSizeBand: asEnum(params.teamSizeBand, TEAM_SIZE_BANDS),
    onboardingCompletedAt: params.onboardingCompletedAt,
    firstRunChecklistDismissedAt: params.firstRunChecklistDismissedAt,
    isComplete: isOnboardingComplete(params.onboardingCompletedAt),
    missingRequiredFields,
  };
}

export function contextFromRpcPayload(payload: Json): OnboardingContext | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }
  const row = payload as Record<string, unknown>;
  if (typeof row.organization_id !== "string" || typeof row.name !== "string") {
    return null;
  }

  return buildOnboardingContext({
    organizationId: row.organization_id,
    organizationName: row.name,
    displayName:
      typeof row.display_name === "string" || row.display_name === null
        ? (row.display_name as string | null)
        : null,
    businessType:
      typeof row.business_type === "string" || row.business_type === null
        ? (row.business_type as string | null)
        : null,
    primaryAudience:
      typeof row.primary_audience === "string" || row.primary_audience === null
        ? (row.primary_audience as string | null)
        : null,
    primaryOffering:
      typeof row.primary_offering === "string" || row.primary_offering === null
        ? (row.primary_offering as string | null)
        : null,
    primaryGoal:
      typeof row.primary_goal === "string" || row.primary_goal === null
        ? (row.primary_goal as string | null)
        : null,
    teamSizeBand:
      typeof row.team_size_band === "string" || row.team_size_band === null
        ? (row.team_size_band as string | null)
        : null,
    onboardingCompletedAt:
      typeof row.onboarding_completed_at === "string" ||
      row.onboarding_completed_at === null
        ? (row.onboarding_completed_at as string | null)
        : null,
    firstRunChecklistDismissedAt:
      typeof row.first_run_checklist_dismissed_at === "string" ||
      row.first_run_checklist_dismissed_at === null
        ? (row.first_run_checklist_dismissed_at as string | null)
        : null,
  });
}

/**
 * Resolve which organization onboarding targets.
 * - Explicit organizationId must match an active membership.
 * - Owner role required for write paths (caller enforces).
 * - Without organizationId: exactly one active membership is required.
 */
export async function resolveOnboardingOrganizationId(
  supabase: SupabaseClient<Database>,
  organizationId?: string,
): Promise<
  | { ok: true; organizationId: string; role: string; userId: string }
  | {
      ok: false;
      code:
        | "not_authenticated"
        | "membership_required"
        | "organization_ambiguous"
        | "organization_not_found"
        | "unexpected_error";
    }
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, code: "not_authenticated" };
  }
  if (authError) {
    return { ok: false, code: "unexpected_error" };
  }

  const memberships = await listActiveOrganizationMemberships(supabase);
  if (!memberships.ok) {
    return { ok: false, code: "unexpected_error" };
  }

  if (memberships.memberships.length === 0) {
    return { ok: false, code: "membership_required" };
  }

  if (organizationId) {
    const match = memberships.memberships.find(
      (membership) => membership.organizationId === organizationId,
    );
    if (!match) {
      return { ok: false, code: "organization_not_found" };
    }
    return {
      ok: true,
      organizationId: match.organizationId,
      role: match.role,
      userId: user.id,
    };
  }

  if (memberships.memberships.length > 1) {
    return { ok: false, code: "organization_ambiguous" };
  }

  const only = memberships.memberships[0]!;
  return {
    ok: true,
    organizationId: only.organizationId,
    role: only.role,
    userId: user.id,
  };
}

export async function readOnboardingContext(
  supabase: SupabaseClient<Database>,
  organizationId?: string,
): Promise<OnboardingReadResult> {
  const resolved = await resolveOnboardingOrganizationId(
    supabase,
    organizationId,
  );
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.code,
      message: onboardingMessage(resolved.code),
    };
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select(
      "id, name, business_type, primary_audience, primary_offering, primary_goal, team_size_band, onboarding_completed_at, first_run_checklist_dismissed_at",
    )
    .eq("id", resolved.organizationId)
    .maybeSingle();

  if (orgError) {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }

  if (!org) {
    return {
      ok: false,
      code: "organization_not_found",
      message: onboardingMessage("organization_not_found"),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", resolved.userId)
    .maybeSingle();

  if (profileError) {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }

  const row = org as OrgOnboardingRow;

  return {
    ok: true,
    context: buildOnboardingContext({
      organizationId: row.id,
      organizationName: row.name,
      displayName: profile?.display_name ?? null,
      businessType: row.business_type,
      primaryAudience: row.primary_audience,
      primaryOffering: row.primary_offering,
      primaryGoal: row.primary_goal,
      teamSizeBand: row.team_size_band,
      onboardingCompletedAt: row.onboarding_completed_at,
      firstRunChecklistDismissedAt: row.first_run_checklist_dismissed_at,
    }),
  };
}

export type {
  BusinessType,
  PrimaryAudience,
  PrimaryGoal,
  PrimaryOffering,
  TeamSizeBand,
};
