import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveOnboardingLifecycle,
  type OnboardingContextState,
  type OnboardingLifecycleState,
} from "@/features/onboarding/domain/onboarding-lifecycle";
import type { OnboardingErrorCode } from "@/features/onboarding/domain/onboarding-types";
import { resolveOperatingModelSetupStatus } from "@/features/onboarding/server/operating-model-status";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import type { Database } from "@/types/database";

type LifecycleOrganizationRow = {
  id: string;
  name: string;
  team_size_band: string | null;
  onboarding_flow_version: number | null;
  onboarding_setup_ready_at: string | null;
  onboarding_completed_at: string | null;
};

export type OnboardingLifecycleReadResult =
  | {
      ok: true;
      organizationId: string;
      membershipRole: string;
      state: OnboardingLifecycleState;
    }
  | {
      ok: false;
      code: OnboardingErrorCode;
    };

export type OperatingModelStatusResolver =
  typeof resolveOperatingModelSetupStatus;

function toContextState(
  status: Awaited<ReturnType<OperatingModelStatusResolver>>,
): OnboardingContextState {
  if (status.kind === "configured") {
    return { kind: "configured", packKey: status.packKey };
  }
  if (status.kind === "requires_assignment") {
    return { kind: "not_configured" };
  }
  return { kind: "unavailable" };
}

/**
 * Live, organization-scoped lifecycle authority for application routing.
 * Persisted timestamps remain authoritative; intermediate stages are derived.
 */
export async function resolveOrganizationOnboardingLifecycle(
  supabase: SupabaseClient<Database>,
  organizationId?: string,
  dependencies?: {
    resolveOperatingModelStatus?: OperatingModelStatusResolver;
  },
): Promise<OnboardingLifecycleReadResult> {
  const actor = await resolveOnboardingOrganizationId(
    supabase,
    organizationId,
  );
  if (!actor.ok) {
    return { ok: false, code: actor.code };
  }

  const { data, error } = await supabase
    .from("organizations")
    .select(
      "id, name, team_size_band, onboarding_flow_version, onboarding_setup_ready_at, onboarding_completed_at",
    )
    .eq("id", actor.organizationId)
    .maybeSingle();

  if (error || !data) {
    return {
      ok: false,
      code: error ? "unexpected_error" : "organization_not_found",
    };
  }

  const organization = data as LifecycleOrganizationRow;
  const baseInput = {
    flowVersion: organization.onboarding_flow_version,
    setupReadyAt: organization.onboarding_setup_ready_at,
    completedAt: organization.onboarding_completed_at,
    membershipRole: actor.role,
  };

  if (
    organization.onboarding_flow_version !== 2 ||
    organization.onboarding_setup_ready_at ||
    organization.onboarding_completed_at ||
    actor.role !== "owner"
  ) {
    return {
      ok: true,
      organizationId: actor.organizationId,
      membershipRole: actor.role,
      state: resolveOnboardingLifecycle({
        ...baseInput,
        context: { kind: "not_required" },
      }),
    };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return {
      ok: false,
      code: userError ? "unexpected_error" : "not_authenticated",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  if (profileError) {
    return {
      ok: false,
      code: "unexpected_error",
    };
  }

  const coreData = {
    displayName: profile?.display_name ?? null,
    organizationName: organization.name,
    teamSizeBand: organization.team_size_band,
  };

  const coreState = resolveOnboardingLifecycle({
    ...baseInput,
    coreData,
    context: { kind: "not_required" },
  });
  if (coreState.kind === "v2_core_incomplete") {
    return {
      ok: true,
      organizationId: actor.organizationId,
      membershipRole: actor.role,
      state: coreState,
    };
  }

  const resolveOperatingModelStatus =
    dependencies?.resolveOperatingModelStatus ??
    resolveOperatingModelSetupStatus;
  const operatingModel = await resolveOperatingModelStatus({
    supabase,
    organizationId: actor.organizationId,
    role: actor.role,
  });

  return {
    ok: true,
    organizationId: actor.organizationId,
    membershipRole: actor.role,
    state: resolveOnboardingLifecycle({
      ...baseInput,
      coreData,
      context: toContextState(operatingModel),
    }),
  };
}
