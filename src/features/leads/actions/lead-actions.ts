"use server";

import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type {
  LeadMutationFailure,
  LeadMutationOperation,
  LeadMutationResult,
} from "@/features/leads/domain/types";
import {
  parseArchiveLeadActionInput,
  parseConvertLeadActionInput,
  parseCreateLeadActionInput,
  parseRestoreLeadActionInput,
  parseTransitionLeadStageActionInput,
  parseTransitionLeadStatusActionInput,
  parseUpdateLeadProfileActionInput,
} from "@/features/leads/actions/lead-action-schemas";
import {
  archiveLeadMutation,
  convertLeadToCustomerMutation,
  createLeadMutation,
  resolveVerifiedLeadRole,
  restoreLeadMutation,
  transitionLeadStageMutation,
  transitionLeadStatusMutation,
  updateLeadProfileMutation,
} from "@/features/leads/server/lead-mutations";
import {
  insufficientRoleError,
  mapOrganizationContextError,
  permissionDeniedError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/leads/server/normalize-lead-error";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
  operation: LeadMutationOperation,
  error: import("zod").ZodError,
): LeadMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function unexpectedActionFailure(operation: LeadMutationOperation): LeadMutationFailure {
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

async function runLeadMutation(
  operation: LeadMutationOperation,
  organizationId: string,
  invoke: (params: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    organizationId: string;
    role: NonNullable<ReturnType<typeof resolveVerifiedLeadRole>>;
    input: unknown;
  }) => Promise<LeadMutationResult>,
  input: unknown,
): Promise<LeadMutationResult> {
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

    const moduleAccess = await loadProductModuleAccess(org.context.organizationId);
    const routeAccess = evaluateProductModuleRouteAccess({
      moduleId: "leads",
      access: moduleAccess,
    });
    if (!routeAccess.allowed) {
      return {
        ok: false,
        operation,
        committed: false,
        error: permissionDeniedError(),
      };
    }

    const role = resolveVerifiedLeadRole(org.context.role);
    if (!role) {
      return {
        ok: false,
        operation,
        committed: false,
        error: insufficientRoleError(),
      };
    }

    return await invoke({
      supabase,
      organizationId: org.context.organizationId,
      role,
      input,
    });
  } catch {
    return unexpectedActionFailure(operation);
  }
}

export async function createLeadAction(input: unknown): Promise<LeadMutationResult> {
  const parsed = parseCreateLeadActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("create", parsed.error);
  }

  const { organizationId, ...leadInput } = parsed.data;

  return runLeadMutation("create", organizationId, createLeadMutation, {
    organizationId,
    ...leadInput,
  });
}

export async function updateLeadProfileAction(input: unknown): Promise<LeadMutationResult> {
  const parsed = parseUpdateLeadProfileActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("update_profile", parsed.error);
  }

  const { organizationId, ...profileInput } = parsed.data;

  return runLeadMutation("update_profile", organizationId, updateLeadProfileMutation, {
    organizationId,
    ...profileInput,
  });
}

export async function transitionLeadStageAction(input: unknown): Promise<LeadMutationResult> {
  const parsed = parseTransitionLeadStageActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("transition_stage", parsed.error);
  }

  const { organizationId, ...stageInput } = parsed.data;

  return runLeadMutation("transition_stage", organizationId, transitionLeadStageMutation, {
    organizationId,
    ...stageInput,
  });
}

export async function transitionLeadStatusAction(input: unknown): Promise<LeadMutationResult> {
  const parsed = parseTransitionLeadStatusActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("transition_status", parsed.error);
  }

  const { organizationId, ...statusInput } = parsed.data;

  return runLeadMutation("transition_status", organizationId, transitionLeadStatusMutation, {
    organizationId,
    ...statusInput,
  });
}

export async function convertLeadToCustomerAction(input: unknown): Promise<LeadMutationResult> {
  const parsed = parseConvertLeadActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("convert", parsed.error);
  }

  const { organizationId, ...convertInput } = parsed.data;

  return runLeadMutation("convert", organizationId, convertLeadToCustomerMutation, {
    organizationId,
    ...convertInput,
  });
}

export async function archiveLeadAction(input: unknown): Promise<LeadMutationResult> {
  const parsed = parseArchiveLeadActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("archive", parsed.error);
  }

  const { organizationId, leadId } = parsed.data;

  return runLeadMutation("archive", organizationId, archiveLeadMutation, {
    organizationId,
    leadId,
  });
}

export async function restoreLeadAction(input: unknown): Promise<LeadMutationResult> {
  const parsed = parseRestoreLeadActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("restore", parsed.error);
  }

  const { organizationId, leadId } = parsed.data;

  return runLeadMutation("restore", organizationId, restoreLeadMutation, {
    organizationId,
    leadId,
  });
}
