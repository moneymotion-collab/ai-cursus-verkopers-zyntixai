import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import {
  isKnownEnrollmentRole,
  resolveEnrollmentPermissions,
} from "@/features/enrollments/domain/permissions";
import type {
  EnrollmentApplicationError,
  EnrollmentMutationCommittedRefreshFailure,
  EnrollmentMutationFailure,
  EnrollmentMutationOperation,
  EnrollmentMutationResult,
  EnrollmentMutationSuccess,
  EnrollmentRefreshHints,
  EnrollmentRole,
} from "@/features/enrollments/domain/types";
import { ENROLLMENT_MUTATION_REFRESH_HINTS } from "@/features/enrollments/domain/types";
import { getEnrollmentById } from "@/features/enrollments/server/enrollment-read-queries";
import {
  archivedRecordError,
  enrollmentUnavailableError,
  insufficientRoleError,
  mutationCommittedRefreshRequiredError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/enrollments/server/normalize-enrollment-error";
import {
  callArchiveEnrollmentRpc,
  callCreateEnrollmentRpc,
  callRestoreEnrollmentRpc,
  callTransitionEnrollmentStatusRpc,
  callUpdateEnrollmentOwnerMetadata,
} from "@/features/enrollments/server/enrollment-rpc-adapters";
import {
  validateArchiveEnrollmentInput,
  validateCreateEnrollmentInput,
  validateRestoreEnrollmentInput,
  validateTransitionEnrollmentStatusInput,
  validateUpdateEnrollmentOwnerMetadataInput,
} from "@/features/enrollments/validation/mutation-schemas";

type MutationContext = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: EnrollmentRole;
  input: unknown;
};

function validationFailure(
  operation: EnrollmentMutationOperation,
  error: import("zod").ZodError,
): EnrollmentMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function requiresRefreshOnFailure(error: EnrollmentApplicationError): boolean {
  return error.code === "INVALID_STATE";
}

function adapterFailure(
  operation: EnrollmentMutationOperation,
  error: EnrollmentApplicationError,
): EnrollmentMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: requiresRefreshOnFailure(error)
      ? { ...error, refreshRequired: true }
      : error,
  };
}

function committedRefreshFailure(
  operation: EnrollmentMutationOperation,
  enrollmentId: string,
  refreshHints: EnrollmentRefreshHints,
): EnrollmentMutationCommittedRefreshFailure {
  const base = mutationCommittedRefreshRequiredError();
  return {
    ok: false,
    operation,
    committed: true,
    enrollmentId,
    refreshHints,
    error: {
      ...base,
      refreshRequired: true,
      retryable: false,
    },
  };
}

function successResult(
  operation: EnrollmentMutationOperation,
  enrollmentId: string,
  enrollment: EnrollmentDetailReadModel,
  refreshHints: EnrollmentRefreshHints,
): EnrollmentMutationSuccess {
  return {
    ok: true,
    operation,
    enrollmentId,
    enrollment,
    committed: true,
    refreshRequired: false,
    refreshHints,
  };
}

async function refetchEnrollment(
  context: Omit<MutationContext, "input">,
  enrollmentId: string,
): Promise<EnrollmentDetailReadModel | null> {
  const result = await getEnrollmentById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    enrollmentId,
  });
  return result.ok ? result.data : null;
}

export function resolveVerifiedEnrollmentRole(
  role: string | null | undefined,
): EnrollmentRole | null {
  if (!role || !isKnownEnrollmentRole(role)) {
    return null;
  }
  return role;
}

export async function createEnrollmentMutation(
  context: MutationContext,
): Promise<EnrollmentMutationResult> {
  const operation: EnrollmentMutationOperation = "create";
  const parsed = validateCreateEnrollmentInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const permissions = resolveEnrollmentPermissions(context.role);
  if (!permissions.canCreateEnrollment) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callCreateEnrollmentRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.enrollmentId) {
    return adapterFailure(operation, enrollmentUnavailableError());
  }

  const enrollmentId = rpcResult.enrollmentId;
  const enrollment = await refetchEnrollment(context, enrollmentId);
  const refreshHints = ENROLLMENT_MUTATION_REFRESH_HINTS.create;
  if (!enrollment) {
    return committedRefreshFailure(operation, enrollmentId, refreshHints);
  }

  return successResult(operation, enrollmentId, enrollment, refreshHints);
}

export async function updateEnrollmentOwnerMetadataMutation(
  context: MutationContext,
): Promise<EnrollmentMutationResult> {
  const operation: EnrollmentMutationOperation = "update_owner_metadata";
  const parsed = validateUpdateEnrollmentOwnerMetadataInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getEnrollmentById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    enrollmentId: parsed.data.enrollmentId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveEnrollmentPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canUpdateOwnerOrMetadata) {
    return adapterFailure(
      operation,
      existing.data.derived.isArchived
        ? archivedRecordError()
        : insufficientRoleError(),
    );
  }

  const rpcResult = await callUpdateEnrollmentOwnerMetadata({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const enrollment = await refetchEnrollment(context, parsed.data.enrollmentId);
  const refreshHints = ENROLLMENT_MUTATION_REFRESH_HINTS.update_owner_metadata;
  if (!enrollment) {
    return committedRefreshFailure(
      operation,
      parsed.data.enrollmentId,
      refreshHints,
    );
  }

  return successResult(
    operation,
    parsed.data.enrollmentId,
    enrollment,
    refreshHints,
  );
}

export async function transitionEnrollmentStatusMutation(
  context: MutationContext,
): Promise<EnrollmentMutationResult> {
  const operation: EnrollmentMutationOperation = "transition_status";
  const parsed = validateTransitionEnrollmentStatusInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getEnrollmentById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    enrollmentId: parsed.data.enrollmentId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveEnrollmentPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canTransitionEnrollmentStatus) {
    return adapterFailure(
      operation,
      existing.data.derived.isArchived
        ? archivedRecordError()
        : insufficientRoleError(),
    );
  }

  const rpcResult = await callTransitionEnrollmentStatusRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const enrollment = await refetchEnrollment(context, parsed.data.enrollmentId);
  const refreshHints = ENROLLMENT_MUTATION_REFRESH_HINTS.transition_status;
  if (!enrollment) {
    return committedRefreshFailure(
      operation,
      parsed.data.enrollmentId,
      refreshHints,
    );
  }

  return successResult(
    operation,
    parsed.data.enrollmentId,
    enrollment,
    refreshHints,
  );
}

export async function archiveEnrollmentMutation(
  context: MutationContext,
): Promise<EnrollmentMutationResult> {
  const operation: EnrollmentMutationOperation = "archive";
  const parsed = validateArchiveEnrollmentInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getEnrollmentById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    enrollmentId: parsed.data.enrollmentId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveEnrollmentPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canArchiveEnrollment) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callArchiveEnrollmentRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const enrollment = await refetchEnrollment(context, parsed.data.enrollmentId);
  const refreshHints = ENROLLMENT_MUTATION_REFRESH_HINTS.archive;
  if (!enrollment) {
    return committedRefreshFailure(
      operation,
      parsed.data.enrollmentId,
      refreshHints,
    );
  }

  return successResult(
    operation,
    parsed.data.enrollmentId,
    enrollment,
    refreshHints,
  );
}

export async function restoreEnrollmentMutation(
  context: MutationContext,
): Promise<EnrollmentMutationResult> {
  const operation: EnrollmentMutationOperation = "restore";
  const parsed = validateRestoreEnrollmentInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getEnrollmentById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    enrollmentId: parsed.data.enrollmentId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveEnrollmentPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canRestoreEnrollment) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callRestoreEnrollmentRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const enrollment = await refetchEnrollment(context, parsed.data.enrollmentId);
  const refreshHints = ENROLLMENT_MUTATION_REFRESH_HINTS.restore;
  if (!enrollment) {
    return committedRefreshFailure(
      operation,
      parsed.data.enrollmentId,
      refreshHints,
    );
  }

  return successResult(
    operation,
    parsed.data.enrollmentId,
    enrollment,
    refreshHints,
  );
}
