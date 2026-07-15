import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import { resolveCustomerPermissions, isKnownCustomerRole } from "@/features/customers/domain/permissions";
import type {
  CustomerApplicationError,
  CustomerMutationCommittedRefreshFailure,
  CustomerMutationFailure,
  CustomerMutationOperation,
  CustomerMutationResult,
  CustomerMutationSuccess,
  CustomerRefreshHints,
  CustomerRole,
} from "@/features/customers/domain/types";
import { CUSTOMER_MUTATION_REFRESH_HINTS } from "@/features/customers/domain/types";
import { getCustomerById } from "@/features/customers/server/customer-read-queries";
import {
  archivedRecordError,
  customerUnavailableError,
  insufficientRoleError,
  invalidOwnerError,
  mutationCommittedRefreshRequiredError,
  normalizeCustomerError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/customers/server/normalize-customer-error";
import {
  callArchiveCustomerRpc,
  callCreateCustomerRpc,
  callRestoreCustomerRpc,
  callTransitionCustomerStatusRpc,
} from "@/features/customers/server/customer-rpc-adapters";
import {
  validateArchiveCustomerInput,
  validateCreateCustomerInput,
  validateRestoreCustomerInput,
  validateTransitionCustomerStatusInput,
  validateUpdateCustomerProfileInput,
  type ArchiveCustomerInput,
  type CreateCustomerInput,
  type RestoreCustomerInput,
  type TransitionCustomerStatusInput,
  type UpdateCustomerProfileInput,
} from "@/features/customers/validation/mutation-schemas";

type MutationContext = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: CustomerRole;
};

function validationFailure(
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

function requiresRefreshOnFailure(error: CustomerApplicationError): boolean {
  return error.code === "INVALID_STATE";
}

function adapterFailure(
  operation: CustomerMutationOperation,
  error: CustomerApplicationError,
): CustomerMutationFailure {
  return {
    ok: false,
    operation,
    committed: false,
    error: requiresRefreshOnFailure(error) ? { ...error, refreshRequired: true } : error,
  };
}

function committedRefreshFailure(
  operation: CustomerMutationOperation,
  customerId: string,
  refreshHints: CustomerRefreshHints,
): CustomerMutationCommittedRefreshFailure {
  const base = mutationCommittedRefreshRequiredError();
  return {
    ok: false,
    operation,
    committed: true,
    customerId,
    refreshHints,
    error: {
      ...base,
      refreshRequired: true,
      retryable: false,
    },
  };
}

function successResult(
  operation: CustomerMutationOperation,
  customerId: string,
  customer: CustomerDetailReadModel,
  refreshHints: CustomerRefreshHints,
): CustomerMutationSuccess {
  return {
    ok: true,
    operation,
    customerId,
    customer,
    committed: true,
    refreshRequired: false,
    refreshHints,
  };
}

async function refetchCustomer(
  context: MutationContext,
  customerId: string,
): Promise<CustomerDetailReadModel | null> {
  const result = await getCustomerById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    customerId,
  });

  if (!result.ok) {
    return null;
  }

  return result.data;
}

async function afterSuccessfulMutation(
  context: MutationContext,
  operation: CustomerMutationOperation,
  customerId: string,
  refreshHints: CustomerRefreshHints,
): Promise<CustomerMutationResult> {
  const customer = await refetchCustomer(context, customerId);

  if (!customer) {
    return committedRefreshFailure(operation, customerId, refreshHints);
  }

  return successResult(operation, customerId, customer, refreshHints);
}

async function validateOwnerMemberId(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  ownerMemberId: string,
): Promise<CustomerApplicationError | null> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", ownerMemberId)
    .eq("status", "active")
    .maybeSingle();

  if (error) {
    return normalizeCustomerError(error);
  }

  if (!data) {
    return invalidOwnerError();
  }

  return null;
}

function buildProfileUpdatePayload(input: UpdateCustomerProfileInput) {
  return {
    display_name: input.displayName,
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email,
    phone: input.phone,
    owner_member_id: input.ownerMemberId,
  };
}

function assertRole(
  role: CustomerRole,
  check: (permissions: ReturnType<typeof resolveCustomerPermissions>) => boolean,
): CustomerApplicationError | null {
  const permissions = resolveCustomerPermissions(role);
  return check(permissions) ? null : insufficientRoleError();
}

export async function createCustomerMutation(
  context: MutationContext & { input: unknown },
): Promise<CustomerMutationResult> {
  const operation: CustomerMutationOperation = "create";
  const parsed = validateCreateCustomerInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertRole(context.role, (permissions) => permissions.canCreateCustomer);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callCreateCustomerRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.customerId) {
    return adapterFailure(
      operation,
      normalizeCustomerError(new Error("create_customer returned no customer id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.customerId,
    CUSTOMER_MUTATION_REFRESH_HINTS.create,
  );
}

export async function updateCustomerProfileMutation(
  context: MutationContext & { input: unknown },
): Promise<CustomerMutationResult> {
  const operation: CustomerMutationOperation = "update_profile";
  const parsed = validateUpdateCustomerProfileInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertRole(context.role, (permissions) => permissions.canEditCustomer);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const input = parsed.data;

  const existing = await getCustomerById({
    supabase: context.supabase,
    organizationId: context.organizationId,
    customerId: input.customerId,
  });

  if (!existing.ok) {
    return adapterFailure(operation, existing.error);
  }

  if (existing.data.archivedAt != null) {
    return adapterFailure(operation, archivedRecordError());
  }

  if (input.ownerMemberId != null) {
    const ownerError = await validateOwnerMemberId(
      context.supabase,
      context.organizationId,
      input.ownerMemberId,
    );
    if (ownerError) {
      return adapterFailure(operation, ownerError);
    }
  }

  const updatePayload = buildProfileUpdatePayload(input);

  const { data, error } = await context.supabase
    .from("customers")
    .update(updatePayload)
    .eq("organization_id", context.organizationId)
    .eq("id", input.customerId)
    .select("id");

  if (error) {
    return adapterFailure(operation, normalizeCustomerError(error));
  }

  if (!data || data.length !== 1) {
    return adapterFailure(operation, customerUnavailableError());
  }

  return afterSuccessfulMutation(
    context,
    operation,
    input.customerId,
    CUSTOMER_MUTATION_REFRESH_HINTS.update_profile,
  );
}

export async function transitionCustomerStatusMutation(
  context: MutationContext & { input: unknown },
): Promise<CustomerMutationResult> {
  const operation: CustomerMutationOperation = "transition_status";
  const parsed = validateTransitionCustomerStatusInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertRole(context.role, (permissions) => permissions.canTransitionCustomer);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callTransitionCustomerStatusRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.customerId) {
    return adapterFailure(
      operation,
      normalizeCustomerError(new Error("transition_customer_status returned no customer id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.customerId,
    CUSTOMER_MUTATION_REFRESH_HINTS.transition_status,
  );
}

export async function archiveCustomerMutation(
  context: MutationContext & { input: unknown },
): Promise<CustomerMutationResult> {
  const operation: CustomerMutationOperation = "archive";
  const parsed = validateArchiveCustomerInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertOwnerOrAdminRole(context.role);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callArchiveCustomerRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.customerId) {
    return adapterFailure(
      operation,
      normalizeCustomerError(new Error("archive_customer returned no customer id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.customerId,
    CUSTOMER_MUTATION_REFRESH_HINTS.archive,
  );
}

function assertOwnerOrAdminRole(role: CustomerRole): CustomerApplicationError | null {
  return role === "owner" || role === "admin" ? null : insufficientRoleError();
}

export async function restoreCustomerMutation(
  context: MutationContext & { input: unknown },
): Promise<CustomerMutationResult> {
  const operation: CustomerMutationOperation = "restore";
  const parsed = validateRestoreCustomerInput(context.input);
  if (!parsed.success) {
    return validationFailure(operation, parsed.error);
  }

  const roleCheck = assertOwnerOrAdminRole(context.role);
  if (roleCheck) {
    return adapterFailure(operation, roleCheck);
  }

  const rpcResult = await callRestoreCustomerRpc({
    supabase: context.supabase,
    organizationId: context.organizationId,
    input: parsed.data,
  });

  if (!rpcResult.ok) {
    return adapterFailure(operation, rpcResult.error);
  }

  if (!rpcResult.customerId) {
    return adapterFailure(
      operation,
      normalizeCustomerError(new Error("restore_customer returned no customer id")),
    );
  }

  return afterSuccessfulMutation(
    context,
    operation,
    rpcResult.customerId,
    CUSTOMER_MUTATION_REFRESH_HINTS.restore,
  );
}

export function resolveVerifiedCustomerRole(role: string): CustomerRole | null {
  return isKnownCustomerRole(role) ? role : null;
}

export type {
  CreateCustomerInput,
  UpdateCustomerProfileInput,
  TransitionCustomerStatusInput,
  ArchiveCustomerInput,
  RestoreCustomerInput,
};
