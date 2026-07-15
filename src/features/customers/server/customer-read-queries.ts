import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import type {
  CustomerListFilters,
  CustomerListReadResult,
  CustomerListSort,
  CustomerPagination,
  CustomerPaginationMeta,
} from "@/features/customers/domain/read-types";
import type { CustomerReadQueryResult, CustomerRole } from "@/features/customers/domain/types";
import {
  CUSTOMER_DETAIL_SELECT_COLUMNS,
  CUSTOMER_ENROLLMENT_SUMMARY_SELECT_COLUMNS,
  CUSTOMER_HISTORY_SELECT_COLUMNS,
  CUSTOMER_LIST_SELECT_COLUMNS,
} from "@/features/customers/server/customer-query-columns";
import {
  mapCustomerDetail,
  mapCustomerEnrollmentSummary,
  mapCustomerListItem,
  mapCustomerStatusHistoryEntry,
  type CustomerDetailRow,
  type CustomerEnrollmentSummaryRow,
  type CustomerHistoryRow,
  type CustomerListRow,
} from "@/features/customers/server/map-customer-read-model";
import {
  customerUnavailableError,
  invalidInputError,
  mapOrganizationContextError,
  normalizeCustomerError,
  permissionDeniedError,
  zodErrorToFieldMap,
} from "@/features/customers/server/normalize-customer-error";
import {
  MEMBER_LABEL_UNASSIGNED,
  resolveMemberLabel,
  resolveMemberLabels,
  resolveProgramLabel,
  resolveProgramLabels,
} from "@/features/customers/server/resolve-customer-labels";
import {
  escapeCustomerIlikePattern,
  MAX_CUSTOMER_ENROLLMENT_SUMMARIES,
  normalizeCustomerPagination,
  validateCustomerEnrollmentSummaryQuery,
  validateCustomerHistoryQuery,
  validateCustomerIdQuery,
  validateCustomerListQuery,
} from "@/features/customers/validation/read-query-schemas";
import type {
  CustomerDetailReadModel,
  CustomerEnrollmentSummary,
  CustomerStatusHistoryEntry,
} from "@/features/customers/domain/read-types";

type ListCustomersParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  filters?: CustomerListFilters;
  pagination?: CustomerPagination;
  sort?: CustomerListSort;
};

type CustomerByIdParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  customerId: string;
};

type CustomersListQuery = ReturnType<
  ReturnType<SupabaseClient<Database>["from"]>["select"]
>;

function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): CustomerPaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    page,
    pageSize,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

function canIncludeArchivedCustomers(
  role: CustomerRole,
  includeArchived: boolean | undefined,
): boolean {
  return includeArchived === true && (role === "owner" || role === "admin");
}

function applyListFilters(
  query: CustomersListQuery,
  filters: CustomerListFilters,
  organizationId: string,
  role: CustomerRole,
): CustomersListQuery {
  let nextQuery = query.eq("organization_id", organizationId);

  if (!canIncludeArchivedCustomers(role, filters.includeArchived)) {
    nextQuery = nextQuery.is("archived_at", null);
  }

  if (filters.status) {
    nextQuery = Array.isArray(filters.status)
      ? nextQuery.in("status", filters.status)
      : nextQuery.eq("status", filters.status);
  }

  if (filters.ownerIsUnassigned) {
    nextQuery = nextQuery.is("owner_member_id", null);
  } else if (filters.ownerMemberId) {
    nextQuery = nextQuery.eq("owner_member_id", filters.ownerMemberId);
  }

  if (filters.search) {
    const pattern = `%${escapeCustomerIlikePattern(filters.search)}%`;
    nextQuery = nextQuery.or(`display_name.ilike.${pattern},email.ilike.${pattern}`);
  }

  return nextQuery;
}

function applySort(query: CustomersListQuery, sort: CustomerListSort): CustomersListQuery {
  const field = sort.field ?? "display_name";
  const direction = sort.direction ?? "asc";
  const ascending = direction === "asc";

  const nextQuery = query.order(field, { ascending, nullsFirst: false });
  return nextQuery.order("id", { ascending: true });
}

async function ensureCustomerReadAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; role: CustomerRole }
  | { ok: false; error: import("@/features/customers/domain/types").CustomerApplicationError }
> {
  const orgResult = await resolveOrganizationContext({ supabase, organizationId });
  if (!orgResult.ok) {
    return { ok: false, error: mapOrganizationContextError(orgResult.error) };
  }

  const permissions = resolveCustomerPermissions(orgResult.context.role);
  if (!permissions.canViewCustomer && !permissions.canViewArchivedCustomers) {
    return { ok: false, error: permissionDeniedError() };
  }

  return { ok: true, role: orgResult.context.role };
}

async function assertCustomerAccessible(
  params: CustomerByIdParams,
): Promise<CustomerReadQueryResult<CustomerDetailReadModel>> {
  return getCustomerById(params);
}

export async function listCustomers(
  params: ListCustomersParams,
): Promise<CustomerReadQueryResult<CustomerListReadResult>> {
  const parsed = validateCustomerListQuery({
    organizationId: params.organizationId,
    filters: params.filters ?? {},
    pagination: params.pagination ?? {},
    sort: params.sort ?? {},
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureCustomerReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const role = access.role;
  const { page, pageSize, offset, limit } = normalizeCustomerPagination(parsed.data.pagination);

  let query = params.supabase
    .from("customers")
    .select(CUSTOMER_LIST_SELECT_COLUMNS, { count: "exact" });

  query = applyListFilters(query, parsed.data.filters, parsed.data.organizationId, role);
  query = applySort(query, parsed.data.sort);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  const rows = (data ?? []) as CustomerListRow[];
  const total = count ?? rows.length;

  const ownerLabels = await resolveMemberLabels(
    params.supabase,
    parsed.data.organizationId,
    rows.map((row) => row.owner_member_id),
  );

  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        mapCustomerListItem(
          row,
          resolveMemberLabel(row.owner_member_id, ownerLabels),
        ),
      ),
      pagination: buildPaginationMeta(page, pageSize, total),
    },
  };
}

export async function getCustomerById(
  params: CustomerByIdParams,
): Promise<CustomerReadQueryResult<CustomerDetailReadModel>> {
  const parsed = validateCustomerIdQuery({
    organizationId: params.organizationId,
    customerId: params.customerId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureCustomerReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const { data, error } = await params.supabase
    .from("customers")
    .select(CUSTOMER_DETAIL_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("id", parsed.data.customerId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  if (!data) {
    return { ok: false, error: customerUnavailableError() };
  }

  const row = data as CustomerDetailRow;
  const memberLabels = await resolveMemberLabels(params.supabase, parsed.data.organizationId, [
    row.owner_member_id,
    row.created_by_member_id,
  ]);

  return {
    ok: true,
    data: mapCustomerDetail(row, {
      ownerLabel: resolveMemberLabel(row.owner_member_id, memberLabels),
      createdByLabel: row.created_by_member_id
        ? resolveMemberLabel(row.created_by_member_id, memberLabels)
        : MEMBER_LABEL_UNASSIGNED,
    }),
  };
}

export async function listCustomerStatusHistory(
  params: CustomerByIdParams,
): Promise<CustomerReadQueryResult<CustomerStatusHistoryEntry[]>> {
  const parsed = validateCustomerHistoryQuery({
    organizationId: params.organizationId,
    customerId: params.customerId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const customerResult = await assertCustomerAccessible({
    supabase: params.supabase,
    organizationId: parsed.data.organizationId,
    customerId: parsed.data.customerId,
  });

  if (!customerResult.ok) {
    return { ok: false, error: customerResult.error };
  }

  const { data, error } = await params.supabase
    .from("customer_status_history")
    .select(CUSTOMER_HISTORY_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("customer_id", parsed.data.customerId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  const rows = (data ?? []) as CustomerHistoryRow[];
  const actorLabels = await resolveMemberLabels(
    params.supabase,
    parsed.data.organizationId,
    rows.map((row) => row.changed_by_member_id),
  );

  return {
    ok: true,
    data: rows.map((row) =>
      mapCustomerStatusHistoryEntry(
        row,
        resolveMemberLabel(row.changed_by_member_id, actorLabels),
      ),
    ),
  };
}

export async function listCustomerEnrollmentSummaries(
  params: CustomerByIdParams,
): Promise<CustomerReadQueryResult<CustomerEnrollmentSummary[]>> {
  const parsed = validateCustomerEnrollmentSummaryQuery({
    organizationId: params.organizationId,
    customerId: params.customerId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const customerResult = await assertCustomerAccessible({
    supabase: params.supabase,
    organizationId: parsed.data.organizationId,
    customerId: parsed.data.customerId,
  });

  if (!customerResult.ok) {
    return { ok: false, error: customerResult.error };
  }

  const { data, error } = await params.supabase
    .from("enrollments")
    .select(CUSTOMER_ENROLLMENT_SUMMARY_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("customer_id", parsed.data.customerId)
    .is("archived_at", null)
    .order("enrolled_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MAX_CUSTOMER_ENROLLMENT_SUMMARIES);

  if (error) {
    return { ok: false, error: normalizeCustomerError(error) };
  }

  const rows = (data ?? []) as CustomerEnrollmentSummaryRow[];
  const programLabels = await resolveProgramLabels(
    params.supabase,
    parsed.data.organizationId,
    rows.map((row) => row.program_id),
  );

  return {
    ok: true,
    data: rows.map((row) =>
      mapCustomerEnrollmentSummary(
        row,
        resolveProgramLabel(row.program_id, programLabels),
      ),
    ),
  };
}
