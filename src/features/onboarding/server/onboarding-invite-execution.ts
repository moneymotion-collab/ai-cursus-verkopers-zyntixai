import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureOrganizationOnboardingCompletionRun } from "@/features/onboarding/server/onboarding-completion-run";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import {
  executeOnboardingInviteIntentRpcSchema,
  listFrozenTeamInviteIntentsRpcSchema,
  onboardingInviteExecutionMessage,
  reconcileOnboardingInviteIntentRpcSchema,
  toFrozenTeamInviteIntents,
  toOnboardingInviteIntentOutcome,
  type OnboardingCreatingSnapshot,
  type OnboardingFrozenIntentListResult,
  type OnboardingInviteExecutionErrorCode,
  type OnboardingInviteExecutionFailure,
  type OnboardingInviteExecutionResult,
  type OnboardingInviteIntentOutcome,
} from "@/features/onboarding/domain/onboarding-invite-execution";
import type { Database } from "@/types/database";

function failure(
  code: OnboardingInviteExecutionErrorCode,
): OnboardingInviteExecutionFailure {
  return {
    ok: false,
    code,
    message: onboardingInviteExecutionMessage(code),
  };
}

async function resolveOwnerOrganizationId(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; organizationId: string }
  | OnboardingInviteExecutionFailure
> {
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

  return { ok: true, organizationId: actor.organizationId };
}

/**
 * Owner-only read of the frozen Team invite-intent snapshot after Setup Ready.
 * Organization identity is re-derived from membership; the client identifier
 * cannot widen access.
 */
export async function listOrganizationOnboardingFrozenTeamInviteIntents(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<OnboardingFrozenIntentListResult> {
  const actor = await resolveOwnerOrganizationId(supabase, organizationId);
  if (!actor.ok) {
    return actor;
  }

  try {
    const { data, error } = await supabase.rpc(
      "list_organization_onboarding_frozen_team_invite_intents",
      { p_organization_id: actor.organizationId },
    );
    if (error) {
      return failure("TRANSPORT_ERROR");
    }

    const parsed = listFrozenTeamInviteIntentsRpcSchema.safeParse(data);
    if (!parsed.success) {
      return failure("INVALID_RESPONSE");
    }
    if (!parsed.data.ok) {
      return failure(parsed.data.code);
    }

    return {
      ok: true,
      intents: toFrozenTeamInviteIntents(parsed.data),
    };
  } catch {
    return failure("TRANSPORT_ERROR");
  }
}

/**
 * Executes exactly one frozen invite intent through governed authority.
 *
 * The application never supplies an outcome, evidence value, invitation id,
 * or idempotency key. Any plaintext token in the RPC payload is discarded here
 * and is never returned to the browser.
 */
export async function executeOrganizationOnboardingInviteIntent(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  intentId: string,
): Promise<OnboardingInviteExecutionResult> {
  const actor = await resolveOwnerOrganizationId(supabase, organizationId);
  if (!actor.ok) {
    return actor;
  }

  try {
    const { data, error } = await supabase.rpc(
      "execute_organization_onboarding_invite_intent",
      {
        p_organization_id: actor.organizationId,
        p_intent_id: intentId,
      },
    );
    if (error) {
      return failure("TRANSPORT_ERROR");
    }

    const parsed = executeOnboardingInviteIntentRpcSchema.safeParse(data);
    if (!parsed.success) {
      return failure("INVALID_RESPONSE");
    }
    if (!parsed.data.ok) {
      return failure(parsed.data.code);
    }

    void parsed.data.raw_token;
    void parsed.data.expires_at;
    void parsed.data.fresh_create;
    void parsed.data.result.invitation_id;
    void parsed.data.result.idempotency_key;

    return {
      ok: true,
      outcome: toOnboardingInviteIntentOutcome(parsed.data),
    };
  } catch {
    return failure("TRANSPORT_ERROR");
  }
}

/**
 * Recovers the current governed outcome for one frozen intent without creating
 * an invitation, consuming a create rate limit, or reconstructing a token.
 *
 * Contract authority: ENG-ONB-1H-P1-CONTRACT §9.2 — recovery is exclusively via
 * `reconcile_organization_onboarding_invite_intent`.
 */
export async function reconcileOrganizationOnboardingInviteIntent(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  intentId: string,
): Promise<OnboardingInviteExecutionResult> {
  const actor = await resolveOwnerOrganizationId(supabase, organizationId);
  if (!actor.ok) {
    return actor;
  }

  try {
    const { data, error } = await supabase.rpc(
      "reconcile_organization_onboarding_invite_intent",
      {
        p_organization_id: actor.organizationId,
        p_intent_id: intentId,
      },
    );
    if (error) {
      return failure("TRANSPORT_ERROR");
    }

    const parsed = reconcileOnboardingInviteIntentRpcSchema.safeParse(data);
    if (!parsed.success) {
      return failure("INVALID_RESPONSE");
    }
    if (!parsed.data.ok) {
      return failure(parsed.data.code);
    }

    void parsed.data.result.invitation_id;
    void parsed.data.result.idempotency_key;

    return {
      ok: true,
      outcome: toOnboardingInviteIntentOutcome(parsed.data),
    };
  } catch {
    return failure("TRANSPORT_ERROR");
  }
}

/**
 * Restores Creating-state progress after refresh or re-entry by listing the
 * frozen snapshot and reconciling each intent. This is not a batch invitation
 * operation and never calls an invitation-creating RPC.
 */
export async function loadOnboardingCreatingSnapshot(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<OnboardingCreatingSnapshot> {
  const listed = await listOrganizationOnboardingFrozenTeamInviteIntents(
    supabase,
    organizationId,
  );
  if (!listed.ok) {
    return listed;
  }

  if (listed.intents.length === 0) {
    const run = await ensureOrganizationOnboardingCompletionRun(
      supabase,
      organizationId,
    );
    if (!run.ok) {
      return {
        ok: false,
        code: run.code,
        message: run.message,
      };
    }

    return {
      ok: true,
      intents: [],
      outcomes: [],
      runStatus: run.run.status,
    };
  }

  const outcomes: OnboardingInviteIntentOutcome[] = [];
  let runStatus: OnboardingInviteIntentOutcome["runStatus"] | null = null;

  for (const intent of listed.intents) {
    const reconciled = await reconcileOrganizationOnboardingInviteIntent(
      supabase,
      organizationId,
      intent.id,
    );
    if (!reconciled.ok) {
      return reconciled;
    }
    outcomes.push(reconciled.outcome);
    runStatus = reconciled.outcome.runStatus;
  }

  return {
    ok: true,
    intents: listed.intents,
    outcomes,
    runStatus,
  };
}
