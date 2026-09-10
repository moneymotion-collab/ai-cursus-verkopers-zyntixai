import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ensureCompletionRunRpcSchema,
  onboardingCompletionRunMessage,
  toOnboardingCompletionRun,
  type OnboardingCompletionRunErrorCode,
  type OnboardingCompletionRunResult,
} from "@/features/onboarding/domain/onboarding-completion-run";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import type { Database } from "@/types/database";

function failure(
  code: OnboardingCompletionRunErrorCode,
): OnboardingCompletionRunResult {
  return {
    ok: false,
    code,
    message: onboardingCompletionRunMessage(code),
  };
}

/**
 * Ensures the governed V2 onboarding completion run exists and returns it.
 *
 * The organization is re-derived from the caller's active membership, so a
 * client-supplied identifier can never widen access. Owner authority, the
 * Setup Ready precondition and organization-scoped serialization all remain in
 * the governed RPC; nothing here duplicates them.
 */
export async function ensureOrganizationOnboardingCompletionRun(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<OnboardingCompletionRunResult> {
  const actor = await resolveOnboardingOrganizationId(
    supabase,
    organizationId,
  );
  if (!actor.ok) {
    return failure(
      actor.code === "not_authenticated"
        ? "NOT_AUTHENTICATED"
        : "NOT_AUTHORIZED",
    );
  }
  if (actor.role !== "owner") {
    return failure("NOT_AUTHORIZED");
  }

  try {
    const { data, error } = await supabase.rpc(
      "ensure_organization_onboarding_completion_run",
      { p_organization_id: actor.organizationId },
    );
    if (error) {
      return failure("TRANSPORT_ERROR");
    }

    const parsed = ensureCompletionRunRpcSchema.safeParse(data);
    if (!parsed.success) {
      return failure("INVALID_RESPONSE");
    }
    if (!parsed.data.ok) {
      return failure(parsed.data.code);
    }

    return { ok: true, run: toOnboardingCompletionRun(parsed.data) };
  } catch {
    return failure("TRANSPORT_ERROR");
  }
}
