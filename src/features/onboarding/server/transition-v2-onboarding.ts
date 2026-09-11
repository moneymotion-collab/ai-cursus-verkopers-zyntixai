import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  v2OnboardingTransitionMessage,
  type OnboardingLifecycleState,
  type V2OnboardingTransitionErrorCode,
  type V2OnboardingTransitionResult,
} from "@/features/onboarding/domain/onboarding-lifecycle";
import {
  resolveOrganizationOnboardingLifecycle,
  type OnboardingLifecycleReadResult,
} from "@/features/onboarding/server/resolve-onboarding-lifecycle";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import type { Database, Json } from "@/types/database";

type V2Transition = "setup_ready" | "complete";
type LifecycleResolver = typeof resolveOrganizationOnboardingLifecycle;

const RPC_BY_TRANSITION = {
  setup_ready: "mark_organization_onboarding_setup_ready",
  complete: "complete_organization_v2_onboarding",
} as const;

function failure(
  code: V2OnboardingTransitionErrorCode,
): V2OnboardingTransitionResult {
  return { ok: false, code, message: v2OnboardingTransitionMessage(code) };
}

function asPayload(value: Json): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function mapDatabaseCode(value: unknown): V2OnboardingTransitionErrorCode {
  switch (value) {
    case "NOT_AUTHENTICATED":
    case "NOT_AUTHORIZED":
    case "ORGANIZATION_NOT_FOUND":
      return "unauthorized";
    case "WRONG_FLOW_VERSION":
      return "invalid_flow";
    case "ALREADY_COMPLETED":
    case "SETUP_NOT_READY":
    case "NOT_READY":
      return "invalid_state";
    case "DISPLAY_NAME_REQUIRED":
    case "ORGANIZATION_NAME_REQUIRED":
    case "TEAM_SIZE_REQUIRED":
      return "core_data_incomplete";
    case "CONFIGURED_CONTEXT_REQUIRED":
      return "context_not_configured";
    default:
      return "retryable_error";
  }
}

function stateReached(
  transition: V2Transition,
  state: OnboardingLifecycleState,
): state is Extract<
  OnboardingLifecycleState,
  { kind: "v2_ready" | "v2_completed" }
> {
  return transition === "complete"
    ? state.kind === "v2_completed"
    : state.kind === "v2_ready" || state.kind === "v2_completed";
}

async function confirmTransition(
  transition: V2Transition,
  organizationId: string,
  resolveLifecycle: LifecycleResolver,
  supabase: SupabaseClient<Database>,
  options: {
    idempotent: boolean;
    recovered: boolean;
  },
): Promise<V2OnboardingTransitionResult> {
  const lifecycle: OnboardingLifecycleReadResult = await resolveLifecycle(
    supabase,
    organizationId,
  );
  if (!lifecycle.ok || !stateReached(transition, lifecycle.state)) {
    return failure("retryable_error");
  }

  return {
    ok: true,
    organizationId,
    idempotent: options.idempotent,
    recovered: options.recovered,
    state: lifecycle.state,
  };
}

async function applyV2Transition(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  transition: V2Transition,
  dependencies?: {
    resolveLifecycle?: LifecycleResolver;
  },
): Promise<V2OnboardingTransitionResult> {
  const actor = await resolveOnboardingOrganizationId(
    supabase,
    organizationId,
  );
  if (!actor.ok || actor.role !== "owner") {
    return failure("unauthorized");
  }

  const resolveLifecycle =
    dependencies?.resolveLifecycle ?? resolveOrganizationOnboardingLifecycle;
  const { data, error } = await supabase.rpc(RPC_BY_TRANSITION[transition], {
    p_organization_id: actor.organizationId,
  });

  if (error) {
    return confirmTransition(
      transition,
      actor.organizationId,
      resolveLifecycle,
      supabase,
      { idempotent: true, recovered: true },
    );
  }

  const payload = asPayload(data);
  if (!payload || payload.ok !== true) {
    return failure(mapDatabaseCode(payload?.code));
  }

  return confirmTransition(
    transition,
    actor.organizationId,
    resolveLifecycle,
    supabase,
    {
      idempotent: payload.idempotent === true,
      recovered: false,
    },
  );
}

export async function markV2OnboardingSetupReady(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dependencies?: {
    resolveLifecycle?: LifecycleResolver;
  },
): Promise<V2OnboardingTransitionResult> {
  return applyV2Transition(
    supabase,
    organizationId,
    "setup_ready",
    dependencies,
  );
}

export async function completeV2Onboarding(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  dependencies?: {
    resolveLifecycle?: LifecycleResolver;
  },
): Promise<V2OnboardingTransitionResult> {
  return applyV2Transition(
    supabase,
    organizationId,
    "complete",
    dependencies,
  );
}
