import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { ResolvedOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type {
  CustomerRpcAdapterResult,
  CustomerStatus,
} from "@/features/customers/domain/types";
import {
  mapOrganizationContextError,
  normalizeCustomerError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/customers/server/normalize-customer-error";
import {
  validateArchiveCustomerInput,
  validateCreateCustomerInput,
  validateRestoreCustomerInput,
  validateTransitionCustomerStatusInput,
  type ArchiveCustomerInput,
  type CreateCustomerInput,
  type RestoreCustomerInput,
  type TransitionCustomerStatusInput,
} from "@/features/customers/validation/mutation-schemas";

type CustomerRpcClient = SupabaseClient<Database>;

type AdapterContext = {
  supabase: CustomerRpcClient;
  organizationId: string;
};

export const CUSTOMER_RPC_NAMES = {
  create: "create_customer",
  transitionStatus: "transition_customer_status",
  archive: "archive_customer",
  restore: "restore_customer",
} as const;

async function requireOrganizationContext(
  params: AdapterContext,
): Promise<
  | { ok: true; context: ResolvedOrganizationContext }
  | { ok: false; error: CustomerRpcAdapterResult }
> {
  const resolved = await resolveOrganizationContext({
    supabase: params.supabase,
    organizationId: params.organizationId,
  });

  if (!resolved.ok) {
    return {
      ok: false,
      error: { ok: false, error: mapOrganizationContextError(resolved.error) },
    };
  }

  return { ok: true, context: resolved.context };
}

function optionalString(value: string | null | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export async function callCreateCustomerRpc(
  params: AdapterContext & { input: CreateCustomerInput },
): Promise<CustomerRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateCreateCustomerInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { data, error } = await params.supabase.rpc(CUSTOMER_RPC_NAMES.create, {
    p_organization_id: org.context.organizationId,
    p_display_name: input.displayName,
    p_first_name: optionalString(input.firstName ?? undefined),
    p_last_name: optionalString(input.lastName ?? undefined),
    p_email: optionalString(input.email ?? undefined),
    p_phone: optionalString(input.phone ?? undefined),
    p_owner_member_id: input.ownerMemberId ?? undefined,
  });

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  if (!data) {
    return {
      ok: false,
      error: normalizeCustomerError(new Error("create_customer returned no customer id")),
    };
  }

  return { ok: true, customerId: data };
}

export async function callTransitionCustomerStatusRpc(
  params: AdapterContext & { input: TransitionCustomerStatusInput },
): Promise<CustomerRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateTransitionCustomerStatusInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(CUSTOMER_RPC_NAMES.transitionStatus, {
    p_organization_id: org.context.organizationId,
    p_customer_id: input.customerId,
    p_to_status: input.toStatus as CustomerStatus,
    p_reason: optionalString(input.reason ?? undefined),
  });

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  return { ok: true, customerId: input.customerId };
}

export async function callArchiveCustomerRpc(
  params: AdapterContext & { input: ArchiveCustomerInput },
): Promise<CustomerRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateArchiveCustomerInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(CUSTOMER_RPC_NAMES.archive, {
    p_organization_id: org.context.organizationId,
    p_customer_id: input.customerId,
  });

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  return { ok: true, customerId: input.customerId };
}

export async function callRestoreCustomerRpc(
  params: AdapterContext & { input: RestoreCustomerInput },
): Promise<CustomerRpcAdapterResult> {
  const org = await requireOrganizationContext(params);
  if (!org.ok) {
    return org.error;
  }

  const parsed = validateRestoreCustomerInput(params.input);
  if (!parsed.success) {
    return {
      ok: false,
      error: validationErrorFromZod(zodErrorToFieldMap(parsed.error)),
    };
  }

  const input = parsed.data;

  const { error } = await params.supabase.rpc(CUSTOMER_RPC_NAMES.restore, {
    p_organization_id: org.context.organizationId,
    p_customer_id: input.customerId,
  });

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  return { ok: true, customerId: input.customerId };
}
