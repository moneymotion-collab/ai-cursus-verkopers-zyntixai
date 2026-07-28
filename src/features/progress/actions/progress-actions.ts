"use server";

import { revalidatePath } from "next/cache";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { isKnownProgressRole } from "@/features/progress/domain/permissions";
import type {
  ProgressMutationFailure,
  ProgressMutationOperation,
  ProgressMutationResult,
  ProgressRole,
} from "@/features/progress/domain/types";
import { PROGRESS_ROUTE } from "@/features/progress/domain/progress-navigation";
import {
  parseCorrectProgressFactActionInput,
  parseRecordProgressFactActionInput,
  parseVoidProgressFactActionInput,
} from "@/features/progress/actions/progress-action-schemas";
import {
  recordProgressFactMutation,
  voidProgressFactMutation,
} from "@/features/progress/server/progress-mutations";
import {
  insufficientRoleError,
  mapOrganizationContextError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/progress/server/normalize-progress-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
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

function unexpectedActionFailure(
  operation: ProgressMutationOperation,
): ProgressMutationFailure {
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

function revalidateProgressPaths(progressFactId?: string) {
  revalidatePath(PROGRESS_ROUTE);
  if (progressFactId) {
    revalidatePath(`${PROGRESS_ROUTE}/${progressFactId}`);
  }
}

/**
 * Resolves organization membership and role from the server session, then
 * delegates to the requested mutation foundation. The client-provided
 * organizationId is never trusted directly — resolveOrganizationContext
 * re-derives it from verified membership before any mutation runs.
 */
async function runProgressMutation(
  operation: ProgressMutationOperation,
  organizationId: string,
  input: unknown,
  invoke: (params: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    organizationId: string;
    role: ProgressRole;
    input: unknown;
  }) => Promise<ProgressMutationResult>,
): Promise<ProgressMutationResult> {
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

    if (!isKnownProgressRole(org.context.role)) {
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
      role: org.context.role,
      input,
    });

    if (result.committed) {
      revalidateProgressPaths(result.progressFactId);
    }

    return result;
  } catch {
    return unexpectedActionFailure(operation);
  }
}

export async function recordProgressFactAction(
  input: unknown,
): Promise<ProgressMutationResult> {
  const parsed = parseRecordProgressFactActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("record", parsed.error);
  }

  return runProgressMutation(
    "record",
    parsed.data.organizationId,
    parsed.data,
    recordProgressFactMutation,
  );
}

export async function voidProgressFactAction(
  input: unknown,
): Promise<ProgressMutationResult> {
  const parsed = parseVoidProgressFactActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("void", parsed.error);
  }

  return runProgressMutation(
    "void",
    parsed.data.organizationId,
    parsed.data,
    voidProgressFactMutation,
  );
}

/**
 * Corrections are recorded through the same record foundation — the RPC
 * derives the "correct" operation and correction lineage from
 * correctedFromFactId, which is required by the correction action schema.
 */
export async function correctProgressFactAction(
  input: unknown,
): Promise<ProgressMutationResult> {
  const parsed = parseCorrectProgressFactActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("correct", parsed.error);
  }

  return runProgressMutation(
    "correct",
    parsed.data.organizationId,
    parsed.data,
    recordProgressFactMutation,
  );
}
