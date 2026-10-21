import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  completionRefusalCodeForSnapshot,
  completeOrganizationV2OnboardingRpcSchema,
  hasStaleInvitationEvidence,
  listOnboardingInvitationResultsRpcSchema,
  mapCompleteRpcFailureCode,
  mapReadyListingFailureCode,
  onboardingReadyMessage,
  READY_OPERATING_MODEL_FALLBACK_LABEL,
  toReadyInvitationResult,
  type OnboardingReadyCompletionResult,
  type OnboardingReadyErrorCode,
  type OnboardingReadySnapshot,
  type OnboardingReadySnapshotResult,
} from "@/features/onboarding/domain/onboarding-ready";
import { ensureOrganizationOnboardingCompletionRun } from "@/features/onboarding/server/onboarding-completion-run";
import { loadOnboardingCreatingSnapshot } from "@/features/onboarding/server/onboarding-invite-execution";
import {
  readOnboardingContext,
  resolveOnboardingOrganizationId,
} from "@/features/onboarding/server/read-onboarding-context";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import type { Database } from "@/types/database";

function failure(
  code: OnboardingReadyErrorCode,
): Extract<OnboardingReadySnapshotResult, { ok: false }> {
  return {
    ok: false,
    code,
    message: onboardingReadyMessage(code),
  };
}

function completionFailure(
  code: OnboardingReadyErrorCode,
): OnboardingReadyCompletionResult {
  return {
    ok: false,
    code,
    message: onboardingReadyMessage(code),
  };
}

async function resolveOwnerOrganizationId(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; organizationId: string; role: "owner" }
  | { ok: false; code: OnboardingReadyErrorCode; message: string }
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

  return { ok: true, organizationId: actor.organizationId, role: "owner" };
}

async function readOwnerOperatingModelPresentationLabel(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string> {
  try {
    const repository = new OrganizationContextRepository(supabase as never);
    const primary = await repository.getPrimaryBusinessActivity(organizationId);
    if (!primary.ok || !primary.value) {
      return READY_OPERATING_MODEL_FALLBACK_LABEL;
    }
    if (primary.value.organizationId !== organizationId) {
      return READY_OPERATING_MODEL_FALLBACK_LABEL;
    }
    const label = primary.value.displayName.trim();
    return label || READY_OPERATING_MODEL_FALLBACK_LABEL;
  } catch {
    return READY_OPERATING_MODEL_FALLBACK_LABEL;
  }
}

/**
 * Owner-only read of the governed invitation-result listing. Organization
 * identity is re-derived from membership; the client identifier cannot widen
 * access. Tokens, invitation ids, and idempotency keys are discarded here.
 */
export async function listOrganizationOnboardingInvitationResults(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | {
      ok: true;
      organizationId: string;
      results: ReturnType<typeof toReadyInvitationResult>[];
    }
  | { ok: false; code: OnboardingReadyErrorCode; message: string }
> {
  const actor = await resolveOwnerOrganizationId(supabase, organizationId);
  if (!actor.ok) {
    return actor;
  }

  try {
    const { data, error } = await supabase.rpc(
      "list_organization_onboarding_invitation_results",
      { p_organization_id: actor.organizationId },
    );
    if (error) {
      return failure("TRANSPORT_ERROR");
    }

    const parsed = listOnboardingInvitationResultsRpcSchema.safeParse(data);
    if (!parsed.success) {
      return failure("INVALID_RESPONSE");
    }
    if (!parsed.data.ok) {
      return failure(mapReadyListingFailureCode(parsed.data.code));
    }
    if (parsed.data.organization_id !== actor.organizationId) {
      return failure("INVALID_RESPONSE");
    }

    return {
      ok: true,
      organizationId: actor.organizationId,
      results: parsed.data.results.map(toReadyInvitationResult),
    };
  } catch {
    return failure("TRANSPORT_ERROR");
  }
}

/**
 * Reconstructs the current Ready view from current-evidence reconciliation,
 * the governed invitation-result listing, and the durable completion run.
 * Page load never completes onboarding.
 */
export async function loadOnboardingReadySnapshot(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<OnboardingReadySnapshotResult> {
  const actor = await resolveOwnerOrganizationId(supabase, organizationId);
  if (!actor.ok) {
    return actor;
  }

  const reconciled = await loadOnboardingCreatingSnapshot(
    supabase,
    actor.organizationId,
  );
  if (!reconciled.ok) {
    return failure(mapReadyListingFailureCode(reconciled.code));
  }

  const listed = await listOrganizationOnboardingInvitationResults(
    supabase,
    actor.organizationId,
  );
  if (!listed.ok) {
    return listed;
  }

  const run = await ensureOrganizationOnboardingCompletionRun(
    supabase,
    actor.organizationId,
  );
  if (!run.ok) {
    return failure(mapReadyListingFailureCode(run.code));
  }

  const context = await readOnboardingContext(supabase, actor.organizationId);
  if (!context.ok) {
    return failure(
      context.code === "not_authenticated"
        ? "NOT_AUTHENTICATED"
        : "NOT_AUTHORIZED",
    );
  }

  const operatingModelLabel = await readOwnerOperatingModelPresentationLabel(
    supabase,
    actor.organizationId,
  );

  const snapshot: OnboardingReadySnapshot = {
    organizationId: actor.organizationId,
    workspaceName: context.context.organizationName,
    operatingModelLabel,
    runStatus: run.run.status,
    readyForCutoverAt: run.run.readyForCutoverAt,
    runCompletedAt: run.run.completedAt,
    organizationCompletedAt: context.context.onboardingCompletedAt,
    results: listed.results,
  };

  return { ok: true, snapshot };
}

/**
 * Explicit Owner completion. Reconstructs current Ready authority first and
 * refuses unless the completion run is currently `ready_for_cutover`. Already
 * completed organizations replay the governed idempotent RPC.
 */
export async function completeReadyOnboarding(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<OnboardingReadyCompletionResult> {
  const snapshotResult = await loadOnboardingReadySnapshot(
    supabase,
    organizationId,
  );
  if (!snapshotResult.ok) {
    return snapshotResult;
  }

  const refusal = completionRefusalCodeForSnapshot(snapshotResult.snapshot);
  if (refusal) {
    return completionFailure(refusal);
  }

  try {
    const { data, error } = await supabase.rpc(
      "complete_organization_v2_onboarding",
      { p_organization_id: snapshotResult.snapshot.organizationId },
    );
    if (error) {
      const recovered = await loadOnboardingReadySnapshot(
        supabase,
        snapshotResult.snapshot.organizationId,
      );
      if (
        recovered.ok &&
        recovered.snapshot.organizationCompletedAt &&
        !hasStaleInvitationEvidence(recovered.snapshot.results)
      ) {
        return {
          ok: true,
          organizationId: recovered.snapshot.organizationId,
          idempotent: true,
          completedAt: recovered.snapshot.organizationCompletedAt,
          snapshot: recovered.snapshot,
        };
      }
      return completionFailure("TRANSPORT_ERROR");
    }

    const parsed = completeOrganizationV2OnboardingRpcSchema.safeParse(data);
    if (!parsed.success) {
      return completionFailure("INVALID_RESPONSE");
    }
    if (!parsed.data.ok) {
      const mapped = mapCompleteRpcFailureCode(parsed.data.code);
      const reconstructed = await loadOnboardingReadySnapshot(
        supabase,
        snapshotResult.snapshot.organizationId,
      );
      if (!reconstructed.ok) {
        return completionFailure(mapped);
      }
      const currentRefusal = completionRefusalCodeForSnapshot(
        reconstructed.snapshot,
      );
      if (currentRefusal) {
        return completionFailure(currentRefusal);
      }
      return completionFailure(mapped);
    }
    if (
      parsed.data.organization_id !== snapshotResult.snapshot.organizationId
    ) {
      return completionFailure("INVALID_RESPONSE");
    }

    const reconstructed = await loadOnboardingReadySnapshot(
      supabase,
      snapshotResult.snapshot.organizationId,
    );
    const completedAt =
      (reconstructed.ok && reconstructed.snapshot.organizationCompletedAt) ||
      parsed.data.onboarding_completed_at;
    if (!completedAt) {
      return completionFailure("TRANSPORT_ERROR");
    }

    return {
      ok: true,
      organizationId: snapshotResult.snapshot.organizationId,
      idempotent: parsed.data.idempotent,
      completedAt,
      snapshot: reconstructed.ok
        ? {
            ...reconstructed.snapshot,
            organizationCompletedAt: completedAt,
          }
        : {
            ...snapshotResult.snapshot,
            organizationCompletedAt: completedAt,
          },
    };
  } catch {
    return completionFailure("TRANSPORT_ERROR");
  }
}
