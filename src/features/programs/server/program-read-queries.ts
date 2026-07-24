import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveProgramPermissions } from "@/features/programs/domain/permissions";
import type {
  ProgramDetailReadModel,
  ProgramListFilters,
  ProgramListReadResult,
  ProgramListSort,
  ProgramPagination,
  ProgramPaginationMeta,
  ProgramStatusHistoryEntry,
} from "@/features/programs/domain/read-types";
import { MAX_PROGRAM_HISTORY_ENTRIES } from "@/features/programs/domain/read-types";
import type { ProgramReadQueryResult, ProgramRole } from "@/features/programs/domain/types";
import {
  PROGRAM_DETAIL_SELECT_COLUMNS,
  PROGRAM_HISTORY_SELECT_COLUMNS,
  PROGRAM_LIST_SELECT_COLUMNS,
} from "@/features/programs/server/program-query-columns";
import {
  mapProgramDetail,
  mapProgramListItem,
  mapProgramStatusHistoryEntry,
  type ProgramDetailRow,
  type ProgramHistoryRow,
  type ProgramListRow,
} from "@/features/programs/server/map-program-read-model";
import {
  invalidInputError,
  mapOrganizationContextError,
  normalizeProgramError,
  permissionDeniedError,
  programUnavailableError,
  zodErrorToFieldMap,
} from "@/features/programs/server/normalize-program-error";
import {
  escapeProgramIlikePattern,
  normalizeProgramPagination,
  validateProgramHistoryQuery,
  validateProgramIdQuery,
  validateProgramListQuery,
} from "@/features/programs/validation/read-query-schemas";

type ListProgramsParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  filters?: ProgramListFilters;
  pagination?: ProgramPagination;
  sort?: ProgramListSort;
};

type ProgramByIdParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  programId: string;
};

type ProgramsListQuery = ReturnType<
  ReturnType<SupabaseClient<Database>["from"]>["select"]
>;

const OPEN_ENROLLMENT_STATUSES = ["pending", "active", "paused"] as const;

function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): ProgramPaginationMeta {
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

function canIncludeArchivedPrograms(
  role: ProgramRole,
  includeArchived: boolean | undefined,
): boolean {
  return includeArchived === true && (role === "owner" || role === "admin");
}

function applyListFilters(
  query: ProgramsListQuery,
  filters: ProgramListFilters,
  organizationId: string,
  role: ProgramRole,
): ProgramsListQuery {
  let nextQuery = query.eq("organization_id", organizationId);

  if (!canIncludeArchivedPrograms(role, filters.includeArchived)) {
    nextQuery = nextQuery.is("archived_at", null);
  }

  if (filters.status) {
    nextQuery = Array.isArray(filters.status)
      ? nextQuery.in("status", filters.status)
      : nextQuery.eq("status", filters.status);
  }

  if (filters.deliveryMode) {
    nextQuery = Array.isArray(filters.deliveryMode)
      ? nextQuery.in("delivery_mode", filters.deliveryMode)
      : nextQuery.eq("delivery_mode", filters.deliveryMode);
  }

  if (filters.search) {
    const pattern = `%${escapeProgramIlikePattern(filters.search)}%`;
    nextQuery = nextQuery.ilike("name", pattern);
  }

  return nextQuery;
}

function applySort(query: ProgramsListQuery, sort: ProgramListSort): ProgramsListQuery {
  const field = sort.field ?? "updated_at";
  const direction = sort.direction ?? "desc";
  const ascending = direction === "asc";

  const nextQuery = query.order(field, { ascending, nullsFirst: false });
  return nextQuery.order("id", { ascending: true });
}

async function ensureProgramReadAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; role: ProgramRole }
  | { ok: false; error: import("@/features/programs/domain/types").ProgramApplicationError }
> {
  const orgResult = await resolveOrganizationContext({ supabase, organizationId });
  if (!orgResult.ok) {
    return { ok: false, error: mapOrganizationContextError(orgResult.error) };
  }

  const permissions = resolveProgramPermissions(orgResult.context.role);
  if (!permissions.canListPrograms && !permissions.canViewArchivedPrograms) {
    return { ok: false, error: permissionDeniedError() };
  }

  return { ok: true, role: orgResult.context.role };
}

async function countOpenEnrollmentsByProgramId(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  programIds: string[],
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const id of programIds) {
    counts[id] = 0;
  }

  if (programIds.length === 0) {
    return counts;
  }

  const { data, error } = await supabase
    .from("enrollments")
    .select("program_id")
    .eq("organization_id", organizationId)
    .in("program_id", programIds)
    .in("status", [...OPEN_ENROLLMENT_STATUSES])
    .is("archived_at", null);

  if (error || !data) {
    return counts;
  }

  for (const row of data) {
    const programId = row.program_id;
    counts[programId] = (counts[programId] ?? 0) + 1;
  }

  return counts;
}

export async function countOpenEnrollmentsForProgram(
  params: ProgramByIdParams,
): Promise<ProgramReadQueryResult<number>> {
  const parsed = validateProgramIdQuery({
    organizationId: params.organizationId,
    programId: params.programId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureProgramReadAccess(
    params.supabase,
    parsed.data.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const { count, error } = await params.supabase
    .from("enrollments")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", parsed.data.organizationId)
    .eq("program_id", parsed.data.programId)
    .in("status", [...OPEN_ENROLLMENT_STATUSES])
    .is("archived_at", null);

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  return { ok: true, data: count ?? 0 };
}

export async function listPrograms(
  params: ListProgramsParams,
): Promise<ProgramReadQueryResult<ProgramListReadResult>> {
  const parsed = validateProgramListQuery({
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

  const access = await ensureProgramReadAccess(
    params.supabase,
    parsed.data.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const role = access.role;
  const { page, pageSize, offset, limit } = normalizeProgramPagination(
    parsed.data.pagination,
  );

  let query = params.supabase
    .from("programs")
    .select(PROGRAM_LIST_SELECT_COLUMNS, { count: "exact" });

  query = applyListFilters(
    query,
    parsed.data.filters,
    parsed.data.organizationId,
    role,
  );
  query = applySort(query, parsed.data.sort);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  const rows = (data ?? []) as ProgramListRow[];
  const total = count ?? rows.length;
  const openCounts = await countOpenEnrollmentsByProgramId(
    params.supabase,
    parsed.data.organizationId,
    rows.map((row) => row.id),
  );

  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        mapProgramListItem(row, openCounts[row.id] ?? 0),
      ),
      pagination: buildPaginationMeta(page, pageSize, total),
    },
  };
}

export async function getProgramById(
  params: ProgramByIdParams,
): Promise<ProgramReadQueryResult<ProgramDetailReadModel>> {
  const parsed = validateProgramIdQuery({
    organizationId: params.organizationId,
    programId: params.programId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureProgramReadAccess(
    params.supabase,
    parsed.data.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const { data, error } = await params.supabase
    .from("programs")
    .select(PROGRAM_DETAIL_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("id", parsed.data.programId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  if (!data) {
    return { ok: false, error: programUnavailableError() };
  }

  const row = data as ProgramDetailRow;
  const permissions = resolveProgramPermissions(access.role, {
    isArchived: row.archived_at != null,
  });

  if (!permissions.canViewProgram) {
    return { ok: false, error: programUnavailableError() };
  }

  const openCountResult = await countOpenEnrollmentsForProgram(params);
  const openEnrollmentCount = openCountResult.ok ? openCountResult.data : 0;

  return {
    ok: true,
    data: mapProgramDetail(row, openEnrollmentCount),
  };
}

export async function listProgramStatusHistory(
  params: ProgramByIdParams,
): Promise<ProgramReadQueryResult<ProgramStatusHistoryEntry[]>> {
  const parsed = validateProgramHistoryQuery({
    organizationId: params.organizationId,
    programId: params.programId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const programResult = await getProgramById(params);
  if (!programResult.ok) {
    return programResult;
  }

  const access = await ensureProgramReadAccess(
    params.supabase,
    parsed.data.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const historyPermissions = resolveProgramPermissions(access.role, {
    isArchived: programResult.data.derived.isArchived,
  });
  if (!historyPermissions.canViewProgramHistory) {
    return { ok: false, error: permissionDeniedError() };
  }

  const { data, error } = await params.supabase
    .from("program_status_history")
    .select(PROGRAM_HISTORY_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("program_id", parsed.data.programId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MAX_PROGRAM_HISTORY_ENTRIES);

  if (error) {
    return { ok: false, error: normalizeProgramError(error) };
  }

  const rows = (data ?? []) as ProgramHistoryRow[];
  return {
    ok: true,
    data: rows.map(mapProgramStatusHistoryEntry),
  };
}
