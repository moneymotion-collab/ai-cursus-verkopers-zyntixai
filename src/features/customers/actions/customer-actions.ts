"use server";

import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type {
  CustomerMutationFailure,
  CustomerMutationOperation,
  CustomerMutationResult,
} from "@/features/customers/domain/types";
import {
  parseArchiveCustomerActionInput,
  parseCreateCustomerActionInput,
  parseRestoreCustomerActionInput,
  parseTransitionCustomerStatusActionInput,
  parseUpdateCustomerProfileActionInput,
} from "@/features/customers/actions/customer-action-schemas";
import {
  archiveCustomerMutation,
  createCustomerMutation,
  resolveVerifiedCustomerRole,
  restoreCustomerMutation,
  transitionCustomerStatusMutation,
  updateCustomerProfileMutation,
} from "@/features/customers/server/customer-mutations";
import {
  insufficientRoleError,
  mapOrganizationContextError,
  permissionDeniedError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/customers/server/normalize-customer-error";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
  operation: CustomerMutationOperation,
  error: import("zod").ZodError,
): CustomerMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
  };
}

function unexpectedActionFailure(operation: CustomerMutationOperation): CustomerMutationFailure {
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

async function runCustomerMutation(
  operation: CustomerMutationOperation,
  organizationId: string,
  invoke: (params: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    organizationId: string;
    role: NonNullable<ReturnType<typeof resolveVerifiedCustomerRole>>;
    input: unknown;
  }) => Promise<CustomerMutationResult>,
  input: unknown,
): Promise<CustomerMutationResult> {
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
      moduleId: "customers",
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

    const role = resolveVerifiedCustomerRole(org.context.role);
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

export async function createCustomerAction(input: unknown): Promise<CustomerMutationResult> {
  const parsed = parseCreateCustomerActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("create", parsed.error);
  }

  const { organizationId, ...customerInput } = parsed.data;

  return runCustomerMutation("create", organizationId, createCustomerMutation, {
    organizationId,
    ...customerInput,
  });
}

export async function updateCustomerProfileAction(
  input: unknown,
): Promise<CustomerMutationResult> {
  const parsed = parseUpdateCustomerProfileActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("update_profile", parsed.error);
  }

  const { organizationId, ...profileInput } = parsed.data;

  return runCustomerMutation("update_profile", organizationId, updateCustomerProfileMutation, {
    organizationId,
    ...profileInput,
  });
}

export async function transitionCustomerStatusAction(
  input: unknown,
): Promise<CustomerMutationResult> {
  const parsed = parseTransitionCustomerStatusActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("transition_status", parsed.error);
  }

  const { organizationId, ...transitionInput } = parsed.data;

  return runCustomerMutation(
    "transition_status",
    organizationId,
    transitionCustomerStatusMutation,
    {
      organizationId,
      ...transitionInput,
    },
  );
}

export async function archiveCustomerAction(input: unknown): Promise<CustomerMutationResult> {
  const parsed = parseArchiveCustomerActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("archive", parsed.error);
  }

  const { organizationId, customerId } = parsed.data;

  return runCustomerMutation("archive", organizationId, archiveCustomerMutation, {
    organizationId,
    customerId,
  });
}

export async function restoreCustomerAction(input: unknown): Promise<CustomerMutationResult> {
  const parsed = parseRestoreCustomerActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("restore", parsed.error);
  }

  const { organizationId, customerId } = parsed.data;

  return runCustomerMutation("restore", organizationId, restoreCustomerMutation, {
    organizationId,
    customerId,
  });
}
