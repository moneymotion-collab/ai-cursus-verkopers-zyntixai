import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";
import {
  isKnownProgramRole,
  resolveProgramPermissions,
} from "@/features/programs/domain/permissions";
import type {
  ProgramApplicationError,
  ProgramMutationCommittedRefreshFailure,
  ProgramMutationFailure,
  ProgramMutationOperation,
  ProgramMutationResult,
  ProgramMutationSuccess,
  ProgramRefreshHints,
  ProgramRole,
} from "@/features/programs/domain/types";
import { PROGRAM_MUTATION_REFRESH_HINTS } from "@/features/programs/domain/types";
import { getProgramById } from "@/features/programs/server/program-read-queries";
import {
  archivedRecordError,
  insufficientRoleError,
  mutationCommittedRefreshRequiredError,
  programUnavailableError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/programs/server/normalize-program-error";
import {
  callArchiveProgramRpc,
  callCreateProgramRpc,
  callRestoreProgramRpc,
  callTransitionProgramStatusRpc,
  callUpdateProgramRpc,
} from "@/features/programs/server/program-rpc-adapters";
import {
  validateArchiveProgramInput,
  validateCreateProgramInput,
  validateRestoreProgramInput,
  validateTransitionProgramStatusInput,
  validateUpdateProgramInput,
} from "@/features/programs/validation/mutation-schemas";

type MutationContext = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: ProgramRole;
  input: unknown;
};

function validationFailure(
  operation: ProgramMutationOperation,
  error: import("zod").ZodError,
): ProgramMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function requiresRefreshOnFailure(error: ProgramApplicationError): boolean {
  return error.code === "INVALID_STATE";
}

function adapterFailure(
  operation: ProgramMutationOperation,
  error: ProgramApplicationError,
): ProgramMutationFailure {
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
  operation: ProgramMutationOperation,
  programId: string,
  refreshHints: ProgramRefreshHints,
): ProgramMutationCommittedRefreshFailure {
  const base = mutationCommittedRefreshRequiredError();
  return {
    ok: false,
    operation,
    committed: true,
    programId,
    refreshHints,
    error: {
      ...base,
      refreshRequired: true,
      retryable: false,
    },
  };
}

function successResult(
  operation: ProgramMutationOperation,
  programId: string,
  program: ProgramDetailReadModel,
  refreshHints: ProgramRefreshHints,
): ProgramMutationSuccess {
  return {
    ok: true,
    operation,
    programId,
    program,
    committed: true,
    refreshRequired: false,
    refreshHints,
  };
}

async function refetchProgram(
  context: Omit<MutationContext, "input">,
  programId: string,
): Promise<ProgramDetailReadModel | null> {
  const result = await getProgramById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    programId,
  });
  return result.ok ? result.data : null;
}

export function resolveVerifiedProgramRole(
  role: string | null | undefined,
): ProgramRole | null {
  if (!role || !isKnownProgramRole(role)) {
    return null;
  }
  return role;
}

export async function createProgramMutation(
  context: MutationContext,
): Promise<ProgramMutationResult> {
  const operation: ProgramMutationOperation = "create";
  const parsed = validateCreateProgramInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const permissions = resolveProgramPermissions(context.role);
  if (!permissions.canCreateProgram) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callCreateProgramRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.programId) {
    return adapterFailure(operation, programUnavailableError());
  }

  const programId = rpcResult.programId;
  const program = await refetchProgram(context, programId);
  const refreshHints = PROGRAM_MUTATION_REFRESH_HINTS.create;
  if (!program) {
    return committedRefreshFailure(operation, programId, refreshHints);
  }

  return successResult(operation, programId, program, refreshHints);
}

export async function updateProgramMutation(
  context: MutationContext,
): Promise<ProgramMutationResult> {
  const operation: ProgramMutationOperation = "update";
  const parsed = validateUpdateProgramInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getProgramById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    programId: parsed.data.programId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveProgramPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canUpdateProgram) {
    return adapterFailure(
      operation,
      existing.data.derived.isArchived
        ? archivedRecordError()
        : insufficientRoleError(),
    );
  }

  const rpcResult = await callUpdateProgramRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const program = await refetchProgram(context, parsed.data.programId);
  const refreshHints = PROGRAM_MUTATION_REFRESH_HINTS.update;
  if (!program) {
    return committedRefreshFailure(operation, parsed.data.programId, refreshHints);
  }

  return successResult(operation, parsed.data.programId, program, refreshHints);
}

export async function transitionProgramStatusMutation(
  context: MutationContext,
): Promise<ProgramMutationResult> {
  const operation: ProgramMutationOperation = "transition_status";
  const parsed = validateTransitionProgramStatusInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getProgramById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    programId: parsed.data.programId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveProgramPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canTransitionProgramStatus) {
    return adapterFailure(
      operation,
      existing.data.derived.isArchived
        ? archivedRecordError()
        : insufficientRoleError(),
    );
  }

  const rpcResult = await callTransitionProgramStatusRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const program = await refetchProgram(context, parsed.data.programId);
  const refreshHints = PROGRAM_MUTATION_REFRESH_HINTS.transition_status;
  if (!program) {
    return committedRefreshFailure(operation, parsed.data.programId, refreshHints);
  }

  return successResult(operation, parsed.data.programId, program, refreshHints);
}

export async function archiveProgramMutation(
  context: MutationContext,
): Promise<ProgramMutationResult> {
  const operation: ProgramMutationOperation = "archive";
  const parsed = validateArchiveProgramInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getProgramById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    programId: parsed.data.programId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveProgramPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canArchiveProgram) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callArchiveProgramRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const program = await refetchProgram(context, parsed.data.programId);
  const refreshHints = PROGRAM_MUTATION_REFRESH_HINTS.archive;
  if (!program) {
    return committedRefreshFailure(operation, parsed.data.programId, refreshHints);
  }

  return successResult(operation, parsed.data.programId, program, refreshHints);
}

export async function restoreProgramMutation(
  context: MutationContext,
): Promise<ProgramMutationResult> {
  const operation: ProgramMutationOperation = "restore";
  const parsed = validateRestoreProgramInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const existing = await getProgramById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    programId: parsed.data.programId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  const permissions = resolveProgramPermissions(context.role, {
    isArchived: existing.data.derived.isArchived,
  });
  if (!permissions.canRestoreProgram) {
    return adapterFailure(operation, insufficientRoleError());
  }

  const rpcResult = await callRestoreProgramRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  const program = await refetchProgram(context, parsed.data.programId);
  const refreshHints = PROGRAM_MUTATION_REFRESH_HINTS.restore;
  if (!program) {
    return committedRefreshFailure(operation, parsed.data.programId, refreshHints);
  }

  return successResult(operation, parsed.data.programId, program, refreshHints);
}
