import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveEnrollmentPermissions } from "@/features/enrollments/domain/permissions";
import type {
  EnrollmentDetailReadModel,
  EnrollmentListFilters,
  EnrollmentListReadResult,
  EnrollmentListSort,
  EnrollmentPagination,
  EnrollmentPaginationMeta,
  EnrollmentStatusHistoryEntry,
} from "@/features/enrollments/domain/read-types";
import { MAX_ENROLLMENT_HISTORY_ENTRIES } from "@/features/enrollments/domain/read-types";
import type {
  EnrollmentReadQueryResult,
  EnrollmentRole,
} from "@/features/enrollments/domain/types";
import {
  ENROLLMENT_CUSTOMER_SUMMARY_SELECT_COLUMNS,
  ENROLLMENT_DETAIL_SELECT_COLUMNS,
  ENROLLMENT_HISTORY_SELECT_COLUMNS,
  ENROLLMENT_LIST_SELECT_COLUMNS,
  ENROLLMENT_PROGRAM_SUMMARY_SELECT_COLUMNS,
} from "@/features/enrollments/server/enrollment-query-columns";
import {
  mapEnrollmentCustomerSummary,
  mapEnrollmentDetail,
  mapEnrollmentListItem,
  mapEnrollmentProgramSummary,
  mapEnrollmentStatusHistoryEntry,
  type EnrollmentCustomerSummaryRow,
  type EnrollmentDetailRow,
  type EnrollmentHistoryRow,
  type EnrollmentListRow,
  type EnrollmentProgramSummaryRow,
} from "@/features/enrollments/server/map-enrollment-read-model";
import {
  enrollmentUnavailableError,
  invalidInputError,
  mapOrganizationContextError,
  normalizeEnrollmentError,
  permissionDeniedError,
  zodErrorToFieldMap,
} from "@/features/enrollments/server/normalize-enrollment-error";
import {
  escapeEnrollmentIlikePattern,
  normalizeEnrollmentPagination,
  validateEnrollmentHistoryQuery,
  validateEnrollmentIdQuery,
  validateEnrollmentListQuery,
} from "@/features/enrollments/validation/read-query-schemas";

type ListEnrollmentsParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  filters?: EnrollmentListFilters;
  pagination?: EnrollmentPagination;
  sort?: EnrollmentListSort;
};

type EnrollmentByIdParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  enrollmentId: string;
};

type EnrollmentsListQuery = ReturnType<
  ReturnType<SupabaseClient<Database>["from"]>["select"]
>;

function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): EnrollmentPaginationMeta {
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

function canIncludeArchivedEnrollments(
  role: EnrollmentRole,
  includeArchived: boolean | undefined,
): boolean {
  return includeArchived === true && (role === "owner" || role === "admin");
}

function applyListFilters(
  query: EnrollmentsListQuery,
  filters: EnrollmentListFilters,
  organizationId: string,
  role: EnrollmentRole,
): EnrollmentsListQuery {
  let nextQuery = query.eq("organization_id", organizationId);

  if (!canIncludeArchivedEnrollments(role, filters.includeArchived)) {
    nextQuery = nextQuery.is("archived_at", null);
  }

  if (filters.status) {
    nextQuery = Array.isArray(filters.status)
      ? nextQuery.in("status", filters.status)
      : nextQuery.eq("status", filters.status);
  }

  if (filters.customerId) {
    nextQuery = nextQuery.eq("customer_id", filters.customerId);
  }

  if (filters.programId) {
    nextQuery = nextQuery.eq("program_id", filters.programId);
  }

  if (filters.ownerMemberId) {
    nextQuery = nextQuery.eq("owner_member_id", filters.ownerMemberId);
  }

  return nextQuery;
}

function applySort(
  query: EnrollmentsListQuery,
  sort: EnrollmentListSort,
): EnrollmentsListQuery {
  const field = sort.field ?? "enrolled_at";
  const direction = sort.direction ?? "desc";
  const ascending = direction === "asc";

  const nextQuery = query.order(field, { ascending, nullsFirst: false });
  return nextQuery.order("id", { ascending: true });
}

async function ensureEnrollmentReadAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; role: EnrollmentRole }
  | {
      ok: false;
      error: import("@/features/enrollments/domain/types").EnrollmentApplicationError;
    }
> {
  const orgResult = await resolveOrganizationContext({ supabase, organizationId });
  if (!orgResult.ok) {
    return { ok: false, error: mapOrganizationContextError(orgResult.error) };
  }

  const permissions = resolveEnrollmentPermissions(orgResult.context.role);
  if (!permissions.canListEnrollments && !permissions.canViewArchivedEnrollments) {
    return { ok: false, error: permissionDeniedError() };
  }

  return { ok: true, role: orgResult.context.role };
}

async function resolveSearchScopedIds(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  search: string,
): Promise<{ customerIds: string[]; programIds: string[] }> {
  const pattern = `%${escapeEnrollmentIlikePattern(search)}%`;

  const [customersResult, programsResult] = await Promise.all([
    supabase
      .from("customers")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("display_name", pattern),
    supabase
      .from("programs")
      .select("id")
      .eq("organization_id", organizationId)
      .ilike("name", pattern),
  ]);

  return {
    customerIds: (customersResult.data ?? []).map((row) => row.id),
    programIds: (programsResult.data ?? []).map((row) => row.id),
  };
}

async function loadCustomerLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  customerIds: string[],
): Promise<Record<string, string>> {
  const labels: Record<string, string> = {};
  if (customerIds.length === 0) {
    return labels;
  }

  const { data } = await supabase
    .from("customers")
    .select("id, display_name")
    .eq("organization_id", organizationId)
    .in("id", customerIds);

  for (const row of data ?? []) {
    labels[row.id] = row.display_name;
  }

  return labels;
}

async function loadProgramLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  programIds: string[],
): Promise<Record<string, string>> {
  const labels: Record<string, string> = {};
  if (programIds.length === 0) {
    return labels;
  }

  const { data } = await supabase
    .from("programs")
    .select("id, name")
    .eq("organization_id", organizationId)
    .in("id", programIds);

  for (const row of data ?? []) {
    labels[row.id] = row.name;
  }

  return labels;
}

async function loadRelatedSummaries(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  customerId: string,
  programId: string,
): Promise<{
  customer: ReturnType<typeof mapEnrollmentCustomerSummary> | null;
  program: ReturnType<typeof mapEnrollmentProgramSummary> | null;
}> {
  const [customerResult, programResult] = await Promise.all([
    supabase
      .from("customers")
      .select(ENROLLMENT_CUSTOMER_SUMMARY_SELECT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", customerId)
      .maybeSingle(),
    supabase
      .from("programs")
      .select(ENROLLMENT_PROGRAM_SUMMARY_SELECT_COLUMNS)
      .eq("organization_id", organizationId)
      .eq("id", programId)
      .maybeSingle(),
  ]);

  return {
    customer: customerResult.data
      ? mapEnrollmentCustomerSummary(
          customerResult.data as EnrollmentCustomerSummaryRow,
        )
      : null,
    program: programResult.data
      ? mapEnrollmentProgramSummary(
          programResult.data as EnrollmentProgramSummaryRow,
        )
      : null,
  };
}

export async function listEnrollments(
  params: ListEnrollmentsParams,
): Promise<EnrollmentReadQueryResult<EnrollmentListReadResult>> {
  const parsed = validateEnrollmentListQuery({
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

  const access = await ensureEnrollmentReadAccess(
    params.supabase,
    parsed.data.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const role = access.role;
  const { page, pageSize, offset, limit } = normalizeEnrollmentPagination(
    parsed.data.pagination,
  );

  let query = params.supabase
    .from("enrollments")
    .select(ENROLLMENT_LIST_SELECT_COLUMNS, { count: "exact" });

  query = applyListFilters(
    query,
    parsed.data.filters,
    parsed.data.organizationId,
    role,
  );

  if (parsed.data.filters.search) {
    const scoped = await resolveSearchScopedIds(
      params.supabase,
      parsed.data.organizationId,
      parsed.data.filters.search,
    );

    if (scoped.customerIds.length === 0 && scoped.programIds.length === 0) {
      return {
        ok: true,
        data: {
          items: [],
          pagination: buildPaginationMeta(page, pageSize, 0),
        },
      };
    }

    const orParts: string[] = [];
    if (scoped.customerIds.length > 0) {
      orParts.push(`customer_id.in.(${scoped.customerIds.join(",")})`);
    }
    if (scoped.programIds.length > 0) {
      orParts.push(`program_id.in.(${scoped.programIds.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }

  query = applySort(query, parsed.data.sort);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  const rows = (data ?? []) as EnrollmentListRow[];
  const total = count ?? rows.length;
  const customerLabels = await loadCustomerLabels(
    params.supabase,
    parsed.data.organizationId,
    [...new Set(rows.map((row) => row.customer_id))],
  );
  const programLabels = await loadProgramLabels(
    params.supabase,
    parsed.data.organizationId,
    [...new Set(rows.map((row) => row.program_id))],
  );

  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        mapEnrollmentListItem(row, {
          customerDisplayName: customerLabels[row.customer_id] ?? null,
          programName: programLabels[row.program_id] ?? null,
        }),
      ),
      pagination: buildPaginationMeta(page, pageSize, total),
    },
  };
}

export async function getEnrollmentById(
  params: EnrollmentByIdParams,
): Promise<EnrollmentReadQueryResult<EnrollmentDetailReadModel>> {
  const parsed = validateEnrollmentIdQuery({
    organizationId: params.organizationId,
    enrollmentId: params.enrollmentId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureEnrollmentReadAccess(
    params.supabase,
    parsed.data.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const { data, error } = await params.supabase
    .from("enrollments")
    .select(ENROLLMENT_DETAIL_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("id", parsed.data.enrollmentId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  if (!data) {
    return { ok: false, error: enrollmentUnavailableError() };
  }

  const row = data as EnrollmentDetailRow;
  const permissions = resolveEnrollmentPermissions(access.role, {
    isArchived: row.archived_at != null,
  });

  if (!permissions.canViewEnrollment) {
    return { ok: false, error: enrollmentUnavailableError() };
  }

  const related = await loadRelatedSummaries(
    params.supabase,
    parsed.data.organizationId,
    row.customer_id,
    row.program_id,
  );

  return {
    ok: true,
    data: mapEnrollmentDetail(row, related),
  };
}

export async function listEnrollmentStatusHistory(
  params: EnrollmentByIdParams,
): Promise<EnrollmentReadQueryResult<EnrollmentStatusHistoryEntry[]>> {
  const parsed = validateEnrollmentHistoryQuery({
    organizationId: params.organizationId,
    enrollmentId: params.enrollmentId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const enrollmentResult = await getEnrollmentById(params);
  if (!enrollmentResult.ok) {
    return enrollmentResult;
  }

  const access = await ensureEnrollmentReadAccess(
    params.supabase,
    parsed.data.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const historyPermissions = resolveEnrollmentPermissions(access.role, {
    isArchived: enrollmentResult.data.derived.isArchived,
  });
  if (!historyPermissions.canViewEnrollmentHistory) {
    return { ok: false, error: permissionDeniedError() };
  }

  const { data, error } = await params.supabase
    .from("enrollment_status_history")
    .select(ENROLLMENT_HISTORY_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("enrollment_id", parsed.data.enrollmentId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MAX_ENROLLMENT_HISTORY_ENTRIES);

  if (error) {
    return { ok: false, error: normalizeEnrollmentError(error) };
  }

  const rows = (data ?? []) as EnrollmentHistoryRow[];
  return {
    ok: true,
    data: rows.map(mapEnrollmentStatusHistoryEntry),
  };
}
