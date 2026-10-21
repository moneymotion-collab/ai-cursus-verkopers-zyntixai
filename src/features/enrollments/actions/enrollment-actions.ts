"use server";

import { revalidatePath } from "next/cache";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type {
  EnrollmentMutationFailure,
  EnrollmentMutationOperation,
  EnrollmentMutationResult,
} from "@/features/enrollments/domain/types";
import { ENROLLMENTS_ROUTE } from "@/features/enrollments/domain/enrollments-navigation";
import {
  parseArchiveEnrollmentActionInput,
  parseCreateEnrollmentActionInput,
  parseRestoreEnrollmentActionInput,
  parseTransitionEnrollmentStatusActionInput,
  parseUpdateEnrollmentOwnerMetadataActionInput,
} from "@/features/enrollments/actions/enrollment-action-schemas";
import {
  archiveEnrollmentMutation,
  createEnrollmentMutation,
  resolveVerifiedEnrollmentRole,
  restoreEnrollmentMutation,
  transitionEnrollmentStatusMutation,
  updateEnrollmentOwnerMetadataMutation,
} from "@/features/enrollments/server/enrollment-mutations";
import {
  insufficientRoleError,
  mapOrganizationContextError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/enrollments/server/normalize-enrollment-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
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

function unexpectedActionFailure(
  operation: EnrollmentMutationOperation,
): EnrollmentMutationFailure {
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

function revalidateEnrollmentPaths(enrollmentId?: string) {
  revalidatePath(ENROLLMENTS_ROUTE);
  if (enrollmentId) {
    revalidatePath(`${ENROLLMENTS_ROUTE}/${enrollmentId}`);
  }
}

async function runEnrollmentMutation(
  operation: EnrollmentMutationOperation,
  organizationId: string,
  invoke: (params: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    organizationId: string;
    role: NonNullable<ReturnType<typeof resolveVerifiedEnrollmentRole>>;
    input: unknown;
  }) => Promise<EnrollmentMutationResult>,
  input: unknown,
): Promise<EnrollmentMutationResult> {
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

    const role = resolveVerifiedEnrollmentRole(org.context.role);
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
      const enrollmentId =
        "enrollmentId" in result && typeof result.enrollmentId === "string"
          ? result.enrollmentId
          : undefined;
      revalidateEnrollmentPaths(enrollmentId);
    }

    return result;
  } catch {
    return unexpectedActionFailure(operation);
  }
}

export async function createEnrollmentAction(
  input: unknown,
): Promise<EnrollmentMutationResult> {
  const parsed = parseCreateEnrollmentActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("create", parsed.error);
  }

  const { organizationId, ...enrollmentInput } = parsed.data;

  return runEnrollmentMutation("create", organizationId, createEnrollmentMutation, {
    organizationId,
    ...enrollmentInput,
  });
}

export async function updateEnrollmentOwnerMetadataAction(
  input: unknown,
): Promise<EnrollmentMutationResult> {
  const parsed = parseUpdateEnrollmentOwnerMetadataActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("update_owner_metadata", parsed.error);
  }

  const { organizationId, ...updateInput } = parsed.data;

  return runEnrollmentMutation(
    "update_owner_metadata",
    organizationId,
    updateEnrollmentOwnerMetadataMutation,
    {
      organizationId,
      ...updateInput,
    },
  );
}

export async function transitionEnrollmentStatusAction(
  input: unknown,
): Promise<EnrollmentMutationResult> {
  const parsed = parseTransitionEnrollmentStatusActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("transition_status", parsed.error);
  }

  const { organizationId, ...transitionInput } = parsed.data;

  return runEnrollmentMutation(
    "transition_status",
    organizationId,
    transitionEnrollmentStatusMutation,
    {
      organizationId,
      ...transitionInput,
    },
  );
}

export async function archiveEnrollmentAction(
  input: unknown,
): Promise<EnrollmentMutationResult> {
  const parsed = parseArchiveEnrollmentActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("archive", parsed.error);
  }

  const { organizationId, ...archiveInput } = parsed.data;

  return runEnrollmentMutation(
    "archive",
    organizationId,
    archiveEnrollmentMutation,
    {
      organizationId,
      ...archiveInput,
    },
  );
}

export async function restoreEnrollmentAction(
  input: unknown,
): Promise<EnrollmentMutationResult> {
  const parsed = parseRestoreEnrollmentActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("restore", parsed.error);
  }

  const { organizationId, ...restoreInput } = parsed.data;

  return runEnrollmentMutation(
    "restore",
    organizationId,
    restoreEnrollmentMutation,
    {
      organizationId,
      ...restoreInput,
    },
  );
}
