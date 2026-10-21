import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { isProgressEnrollmentStatus } from "@/features/progress/domain/fact-types";
import { resolveProgressPermissions } from "@/features/progress/domain/permissions";
import type {
  ProgressFactDetailReadModel,
  ProgressListFilters,
  ProgressListReadResult,
  ProgressListSort,
  ProgressPagination,
  ProgressPaginationMeta,
} from "@/features/progress/domain/read-types";
import type {
  ProgressReadQueryResult,
  ProgressRole,
} from "@/features/progress/domain/types";
import {
  PROGRESS_CUSTOMER_SUMMARY_SELECT_COLUMNS,
  PROGRESS_ENROLLMENT_SUMMARY_SELECT_COLUMNS,
  PROGRESS_FACT_DETAIL_SELECT_COLUMNS,
  PROGRESS_FACT_LIST_SELECT_COLUMNS,
  PROGRESS_PROGRAM_SUMMARY_SELECT_COLUMNS,
} from "@/features/progress/server/progress-query-columns";
import {
  mapProgressCustomerSummary,
  mapProgressEnrollmentSummary,
  mapProgressFactDetail,
  mapProgressFactListItem,
  mapProgressProgramSummary,
  type ProgressCustomerSummaryRow,
  type ProgressEnrollmentSummaryRow,
  type ProgressFactDetailRow,
  type ProgressFactListRow,
  type ProgressProgramSummaryRow,
} from "@/features/progress/server/map-progress-read-model";
import {
  invalidInputError,
  mapOrganizationContextError,
  normalizeProgressError,
  permissionDeniedError,
  progressFactUnavailableError,
  zodErrorToFieldMap,
} from "@/features/progress/server/normalize-progress-error";
import {
  escapeProgressIlikePattern,
  normalizeProgressPagination,
  validateProgressFactIdQuery,
  validateProgressListQuery,
} from "@/features/progress/validation/read-query-schemas";

type ListProgressFactsParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  filters?: ProgressListFilters;
  pagination?: ProgressPagination;
  sort?: ProgressListSort;
};

type ProgressFactByIdParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  progressFactId: string;
};

type ProgressListQuery = ReturnType<
  ReturnType<SupabaseClient<Database>["from"]>["select"]
>;

function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): ProgressPaginationMeta {
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

function canIncludeVoidedFacts(
  role: ProgressRole,
  includeVoided: boolean | undefined,
): boolean {
  return includeVoided === true && (role === "owner" || role === "admin");
}

function applyListFilters(
  query: ProgressListQuery,
  filters: ProgressListFilters,
  organizationId: string,
  role: ProgressRole,
): ProgressListQuery {
  let nextQuery = query.eq("organization_id", organizationId);

  if (!canIncludeVoidedFacts(role, filters.includeVoided)) {
    nextQuery = nextQuery.is("voided_at", null);
  }

  if (filters.factType) {
    nextQuery = Array.isArray(filters.factType)
      ? nextQuery.in("fact_type", filters.factType)
      : nextQuery.eq("fact_type", filters.factType);
  }

  if (filters.enrollmentId) {
    nextQuery = nextQuery.eq("enrollment_id", filters.enrollmentId);
  }

  if (filters.customerId) {
    nextQuery = nextQuery.eq("customer_id", filters.customerId);
  }

  if (filters.programId) {
    nextQuery = nextQuery.eq("program_id", filters.programId);
  }

  return nextQuery;
}

function applySort(
  query: ProgressListQuery,
  sort: ProgressListSort,
): ProgressListQuery {
  const field = sort.field ?? "occurred_at";
  const direction = sort.direction ?? "desc";
  const ascending = direction === "asc";

  const nextQuery = query.order(field, { ascending, nullsFirst: false });
  return nextQuery.order("id", { ascending: true });
}

async function ensureProgressReadAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; role: ProgressRole }
  | {
      ok: false;
      error: import("@/features/progress/domain/types").ProgressApplicationError;
    }
> {
  const orgResult = await resolveOrganizationContext({ supabase, organizationId });
  if (!orgResult.ok) {
    return { ok: false, error: mapOrganizationContextError(orgResult.error) };
  }

  const permissions = resolveProgressPermissions(orgResult.context.role);
  if (!permissions.canListFacts && !permissions.canViewVoidedFacts) {
    return { ok: false, error: permissionDeniedError() };
  }

  return { ok: true, role: orgResult.context.role };
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
    .select(PROGRESS_CUSTOMER_SUMMARY_SELECT_COLUMNS)
    .eq("organization_id", organizationId)
    .in("id", customerIds);

  for (const row of (data ?? []) as ProgressCustomerSummaryRow[]) {
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
    .select(PROGRESS_PROGRAM_SUMMARY_SELECT_COLUMNS)
    .eq("organization_id", organizationId)
    .in("id", programIds);

  for (const row of (data ?? []) as ProgressProgramSummaryRow[]) {
    labels[row.id] = row.name;
  }

  return labels;
}

export async function listProgressFacts(
  params: ListProgressFactsParams,
): Promise<ProgressReadQueryResult<ProgressListReadResult>> {
  const parsed = validateProgressListQuery({
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

  const access = await ensureProgressReadAccess(
    params.supabase,
    params.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const filters = parsed.data.filters;
  const pagination = normalizeProgressPagination(parsed.data.pagination);
  const sort = parsed.data.sort;

  let query = applyListFilters(
    params.supabase
      .from("enrollment_progress_facts")
      .select(PROGRESS_FACT_LIST_SELECT_COLUMNS, { count: "exact" }),
    filters,
    params.organizationId,
    access.role,
  );

  if (filters.search) {
    const pattern = `%${escapeProgressIlikePattern(filters.search)}%`;
    query = query.ilike("title", pattern);
  }

  query = applySort(query, sort);
  query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { ok: false, error: normalizeProgressError(error) };
  }

  const rows = (data ?? []) as ProgressFactListRow[];
  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const programIds = [...new Set(rows.map((row) => row.program_id))];
  const [customerLabels, programLabels] = await Promise.all([
    loadCustomerLabels(params.supabase, params.organizationId, customerIds),
    loadProgramLabels(params.supabase, params.organizationId, programIds),
  ]);

  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        mapProgressFactListItem(row, {
          customerDisplayName: customerLabels[row.customer_id] ?? null,
          programName: programLabels[row.program_id] ?? null,
        }),
      ),
      pagination: buildPaginationMeta(
        pagination.page,
        pagination.pageSize,
        count ?? rows.length,
      ),
    },
  };
}

export async function getProgressFactById(
  params: ProgressFactByIdParams,
): Promise<ProgressReadQueryResult<ProgressFactDetailReadModel>> {
  const parsed = validateProgressFactIdQuery({
    organizationId: params.organizationId,
    progressFactId: params.progressFactId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureProgressReadAccess(
    params.supabase,
    params.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const { data, error } = await params.supabase
    .from("enrollment_progress_facts")
    .select(PROGRESS_FACT_DETAIL_SELECT_COLUMNS)
    .eq("organization_id", params.organizationId)
    .eq("id", params.progressFactId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeProgressError(error) };
  }

  if (!data) {
    return { ok: false, error: progressFactUnavailableError() };
  }

  const row = data as ProgressFactDetailRow;
  const permissions = resolveProgressPermissions(access.role, {
    isVoided: row.voided_at != null,
  });

  if (row.voided_at != null && !permissions.canViewVoidedFacts) {
    return { ok: false, error: progressFactUnavailableError() };
  }

  if (!permissions.canViewFact && row.voided_at == null) {
    return { ok: false, error: progressFactUnavailableError() };
  }

  const [enrollmentResult, customerResult, programResult] = await Promise.all([
    params.supabase
      .from("enrollments")
      .select(PROGRESS_ENROLLMENT_SUMMARY_SELECT_COLUMNS)
      .eq("organization_id", params.organizationId)
      .eq("id", row.enrollment_id)
      .maybeSingle(),
    params.supabase
      .from("customers")
      .select(PROGRESS_CUSTOMER_SUMMARY_SELECT_COLUMNS)
      .eq("organization_id", params.organizationId)
      .eq("id", row.customer_id)
      .maybeSingle(),
    params.supabase
      .from("programs")
      .select(PROGRESS_PROGRAM_SUMMARY_SELECT_COLUMNS)
      .eq("organization_id", params.organizationId)
      .eq("id", row.program_id)
      .maybeSingle(),
  ]);

  const enrollmentRow = enrollmentResult.data as ProgressEnrollmentSummaryRow | null;
  if (enrollmentRow?.archived_at != null && access.role !== "owner" && access.role !== "admin") {
    return { ok: false, error: progressFactUnavailableError() };
  }

  return {
    ok: true,
    data: mapProgressFactDetail(row, {
      enrollment: enrollmentRow
        ? mapProgressEnrollmentSummary(enrollmentRow)
        : null,
      customer: customerResult.data
        ? mapProgressCustomerSummary(
            customerResult.data as ProgressCustomerSummaryRow,
          )
        : null,
      program: programResult.data
        ? mapProgressProgramSummary(programResult.data as ProgressProgramSummaryRow)
        : null,
    }),
  };
}

export function resolveEnrollmentStatusForPermissions(
  status: string | null | undefined,
) {
  if (status == null) {
    return null;
  }
  return isProgressEnrollmentStatus(status) ? status : null;
}
