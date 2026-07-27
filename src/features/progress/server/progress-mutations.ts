import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { isProgressEnrollmentStatus } from "@/features/progress/domain/fact-types";
import {
  isKnownProgressRole,
  resolveProgressPermissions,
} from "@/features/progress/domain/permissions";
import type { ProgressFactDetailReadModel } from "@/features/progress/domain/read-types";
import type {
  ProgressApplicationError,
  ProgressMutationCommittedRefreshFailure,
  ProgressMutationFailure,
  ProgressMutationOperation,
  ProgressMutationResult,
  ProgressMutationSuccess,
  ProgressRefreshHints,
  ProgressRole,
} from "@/features/progress/domain/types";
import { PROGRESS_MUTATION_REFRESH_HINTS } from "@/features/progress/domain/types";
import { getProgressFactById } from "@/features/progress/server/progress-read-queries";
import {
  insufficientRoleError,
  mutationCommittedRefreshRequiredError,
  progressFactUnavailableError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/progress/server/normalize-progress-error";
import {
  callRecordProgressFactRpc,
  callVoidProgressFactRpc,
} from "@/features/progress/server/progress-rpc-adapters";
import {
  validateRecordProgressFactInput,
  validateVoidProgressFactInput,
} from "@/features/progress/validation/mutation-schemas";

type MutationContext = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: ProgressRole;
  input: unknown;
};

function validationFailure(
  operation: ProgressMutationOperation,
  error: import("zod").ZodError,
): ProgressMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function adapterFailure(
  operation: ProgressMutationOperation,
  error: ProgressApplicationError,
): ProgressMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error,
  };
}

function committedRefreshFailure(
  operation: ProgressMutationOperation,
  progressFactId: string,
  refreshHints: ProgressRefreshHints,
): ProgressMutationCommittedRefreshFailure {
  const base = mutationCommittedRefreshRequiredError();
  return {
    ok: false,
    operation,
    committed: true,
    progressFactId,
    refreshHints,
    error: {
      ...base,
      refreshRequired: true,
      retryable: false,
    },
  };
}

function successResult(
  operation: ProgressMutationOperation,
  progressFactId: string,
  fact: ProgressFactDetailReadModel,
  refreshHints: ProgressRefreshHints,
): ProgressMutationSuccess {
  return {
    ok: true,
    operation,
    progressFactId,
    fact,
    committed: true,
    refreshRequired: false,
    refreshHints,
  };
}

async function refetchProgressFact(
  context: Omit<MutationContext, "input">,
  progressFactId: string,
): Promise<ProgressFactDetailReadModel | null> {
  const result = await getProgressFactById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    progressFactId,
  });
  return result.ok ? result.data : null;
}

async function loadEnrollmentPermissionContext(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  enrollmentId: string,
): Promise<{
  enrollmentStatus: import("@/features/progress/domain/types").ProgressEnrollmentStatus | null;
  enrollmentArchivedAt: string | null;
}> {
  const { data } = await supabase
    .from("enrollments")
    .select("status, archived_at")
    .eq("organization_id", organizationId)
    .eq("id", enrollmentId)
    .maybeSingle();

  if (!data) {
    return { enrollmentStatus: null, enrollmentArchivedAt: null };
  }

  return {
    enrollmentStatus: isProgressEnrollmentStatus(data.status) ? data.status : null,
    enrollmentArchivedAt: data.archived_at,
  };
}

/**
 * Technical permission-gated Progress mutations.
 * No route redirects or UI action handlers — those belong to B1.6.3.
 */
export async function recordProgressFactMutation(
  context: MutationContext,
): Promise<ProgressMutationResult> {
  const operation: ProgressMutationOperation = "record";
  const refreshHints = PROGRESS_MUTATION_REFRESH_HINTS.record;

  if (!isKnownProgressRole(context.role)) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const parsed = validateRecordProgressFactInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const input = parsed.data;
  const enrollmentContext = await loadEnrollmentPermissionContext(
    context.supabase,
    context.organizationId,
    input.enrollmentId,
  );
  const permissions = resolveProgressPermissions(context.role, enrollmentContext);

  const isCorrection = input.correctedFromFactId != null;
  if (isCorrection) {
    if (!permissions.canCorrectFact) {
      return adapterFailure(operation, insufficientRoleError());
    }
  } else if (!permissions.canRecordManualFact) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callRecordProgressFactRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input,
  });

  if (!rpcResult.ok) {
    return adapterFailure(isCorrection ? "correct" : operation, rpcResult.error);
  }

  const progressFactId = rpcResult.progressFactId;
  if (!progressFactId) {
    return adapterFailure(
      isCorrection ? "correct" : operation,
      progressFactUnavailableError(),
    );
  }

  const fact = await refetchProgressFact(context, progressFactId);
  if (!fact) {
    return committedRefreshFailure(
      isCorrection ? "correct" : operation,
      progressFactId,
      refreshHints,
    );
  }

  return successResult(
    isCorrection ? "correct" : operation,
    progressFactId,
    fact,
    refreshHints,
  );
}

export async function voidProgressFactMutation(
  context: MutationContext,
): Promise<ProgressMutationResult> {
  const operation: ProgressMutationOperation = "void";
  const refreshHints = PROGRESS_MUTATION_REFRESH_HINTS.void;

  if (!isKnownProgressRole(context.role)) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const parsed = validateVoidProgressFactInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getProgressFactById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    progressFactId: parsed.data.progressFactId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveProgressPermissions(context.role, {
    isVoided: existing.data.derived.isVoided,
    enrollmentStatus: isProgressEnrollmentStatus(
      existing.data.enrollment?.status ?? "",
    )
      ? (existing.data.enrollment?.status as import("@/features/progress/domain/types").ProgressEnrollmentStatus)
      : null,
    enrollmentArchivedAt: existing.data.enrollment?.archivedAt ?? null,
  });

  if (!permissions.canVoidFact) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callVoidProgressFactRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const progressFactId = parsed.data.progressFactId;
  const fact = await refetchProgressFact(context, progressFactId);
  if (!fact) {
    return committedRefreshFailure(operation, progressFactId, refreshHints);
  }

  return successResult(operation, progressFactId, fact, refreshHints);
}
