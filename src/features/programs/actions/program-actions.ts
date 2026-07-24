"use server";

import { revalidatePath } from "next/cache";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type {
  ProgramMutationFailure,
  ProgramMutationOperation,
  ProgramMutationResult,
} from "@/features/programs/domain/types";
import { PROGRAMS_ROUTE } from "@/features/programs/domain/programs-navigation";
import {
  parseArchiveProgramActionInput,
  parseCreateProgramActionInput,
  parseRestoreProgramActionInput,
  parseTransitionProgramStatusActionInput,
  parseUpdateProgramActionInput,
} from "@/features/programs/actions/program-action-schemas";
import {
  archiveProgramMutation,
  createProgramMutation,
  resolveVerifiedProgramRole,
  restoreProgramMutation,
  transitionProgramStatusMutation,
  updateProgramMutation,
} from "@/features/programs/server/program-mutations";
import {
  insufficientRoleError,
  mapOrganizationContextError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/programs/server/normalize-program-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
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

function unexpectedActionFailure(
  operation: ProgramMutationOperation,
): ProgramMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: {
      code: "UNEXPECTED_ERROR",
      message: "Something went wrong. Please try again.",
      retryable: true,
      category: "server",
    },
  };
}

function revalidateProgramPaths(programId?: string) {
  revalidatePath(PROGRAMS_ROUTE);
  if (programId) {
    revalidatePath(`${PROGRAMS_ROUTE}/${programId}`);
  }
}

async function runProgramMutation(
  operation: ProgramMutationOperation,
  organizationId: string,
  invoke: (params: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    organizationId: string;
    role: NonNullable<ReturnType<typeof resolveVerifiedProgramRole>>;
    input: unknown;
  }) => Promise<ProgramMutationResult>,
  input: unknown,
): Promise<ProgramMutationResult> {
  try {
    const supabase = await createSupabaseServerClient();
    const org = await resolveOrganizationContext({ supabase, organizationId });

    if (!org.ok) {
      return {
        ok: false,
        operation,
        committed: false,
        error: mapOrganizationContextError(org.error),
      };
    }

    const role = resolveVerifiedProgramRole(org.context.role);
    if (!role) {
      return {
        ok: false,
        operation,
        committed: false,
        error: insufficientRoleError(),
      };
    }

    const result = await invoke({
      supabase,
      organizationId: org.context.organizationId,
      role,
      input,
    });

    if (result.ok || ("committed" in result && result.committed)) {
      const programId =
        "programId" in result && typeof result.programId === "string"
          ? result.programId
          : undefined;
      revalidateProgramPaths(programId);
    }

    return result;
  } catch {
    return unexpectedActionFailure(operation);
  }
}

export async function createProgramAction(
  input: unknown,
): Promise<ProgramMutationResult> {
  const parsed = parseCreateProgramActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("create", parsed.error);
  }

  const { organizationId, ...programInput } = parsed.data;

  return runProgramMutation("create", organizationId, createProgramMutation, {
    organizationId,
    ...programInput,
  });
}

export async function updateProgramAction(
  input: unknown,
): Promise<ProgramMutationResult> {
  const parsed = parseUpdateProgramActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("update", parsed.error);
  }

  const { organizationId, ...programInput } = parsed.data;

  return runProgramMutation("update", organizationId, updateProgramMutation, {
    organizationId,
    ...programInput,
  });
}

export async function transitionProgramStatusAction(
  input: unknown,
): Promise<ProgramMutationResult> {
  const parsed = parseTransitionProgramStatusActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("transition_status", parsed.error);
  }

  const { organizationId, ...transitionInput } = parsed.data;

  return runProgramMutation(
    "transition_status",
    organizationId,
    transitionProgramStatusMutation,
    {
      organizationId,
      ...transitionInput,
    },
  );
}

export async function archiveProgramAction(
  input: unknown,
): Promise<ProgramMutationResult> {
  const parsed = parseArchiveProgramActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("archive", parsed.error);
  }

  const { organizationId, ...archiveInput } = parsed.data;

  return runProgramMutation("archive", organizationId, archiveProgramMutation, {
    organizationId,
    ...archiveInput,
  });
}

export async function restoreProgramAction(
  input: unknown,
): Promise<ProgramMutationResult> {
  const parsed = parseRestoreProgramActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("restore", parsed.error);
  }

  const { organizationId, ...restoreInput } = parsed.data;

  return runProgramMutation("restore", organizationId, restoreProgramMutation, {
    organizationId,
    ...restoreInput,
  });
}
