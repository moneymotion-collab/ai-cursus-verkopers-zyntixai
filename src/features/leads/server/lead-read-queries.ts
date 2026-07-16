import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveLeadPermissions } from "@/features/leads/domain/permissions";
import type { LeadPipelineStageOption } from "@/features/leads/domain/pipeline-stage";
import type {
  LeadDetailReadModel,
  LeadListFilters,
  LeadListReadResult,
  LeadListSort,
  LeadPagination,
  LeadPaginationMeta,
  LeadStageHistoryEntry,
  LeadStatusHistoryEntry,
} from "@/features/leads/domain/read-types";
import type { LeadReadQueryResult, LeadRole } from "@/features/leads/domain/types";
import type { TaskListReadResult } from "@/features/tasks/domain/read-types";
import { listTasksForLead } from "@/features/tasks/server/task-read-queries";
import {
  LEAD_DETAIL_SELECT_COLUMNS,
  LEAD_LIST_SELECT_COLUMNS,
  LEAD_PIPELINE_STAGE_SELECT_COLUMNS,
  LEAD_STAGE_HISTORY_SELECT_COLUMNS,
  LEAD_STATUS_HISTORY_SELECT_COLUMNS,
} from "@/features/leads/server/lead-query-columns";
import {
  mapLeadDetail,
  mapLeadListItem,
  mapLeadPipelineStageOption,
  mapLeadStageHistoryEntry,
  mapLeadStatusHistoryEntry,
  mapLeadConvertedCustomerSummary,
  type LeadDetailRow,
  type LeadListRow,
  type LeadPipelineStageQueryRow,
  type LeadStageHistoryQueryRow,
  type LeadStatusHistoryQueryRow,
} from "@/features/leads/server/map-lead-read-model";
import {
  invalidInputError,
  leadUnavailableError,
  mapOrganizationContextError,
  mapTaskReadError,
  normalizeLeadError,
  permissionDeniedError,
  zodErrorToFieldMap,
} from "@/features/leads/server/normalize-lead-error";
import {
  MEMBER_LABEL_UNASSIGNED,
  resolveConvertedCustomerRow,
  resolveMemberLabel,
  resolveMemberLabels,
  resolveStageLabelBundle,
  resolveStageLabelBundles,
  toLeadStageSummary,
} from "@/features/leads/server/resolve-lead-labels";
import {
  escapeLeadIlikePattern,
  normalizeLeadPagination,
  validateLeadHistoryQuery,
  validateLeadIdQuery,
  validateLeadListQuery,
} from "@/features/leads/validation/read-query-schemas";

type ListLeadsParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  filters?: LeadListFilters;
  pagination?: LeadPagination;
  sort?: LeadListSort;
};

type LeadByIdParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  leadId: string;
};

type LeadsListQuery = ReturnType<ReturnType<SupabaseClient<Database>["from"]>["select"]>;

const LEAD_SORT_FIELDS = new Set(["display_name", "updated_at", "status", "created_at"]);

function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): LeadPaginationMeta {
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

function canIncludeArchivedLeads(
  role: LeadRole,
  includeArchived: boolean | undefined,
): boolean {
  return includeArchived === true && (role === "owner" || role === "admin");
}

function applyListFilters(
  query: LeadsListQuery,
  filters: LeadListFilters,
  organizationId: string,
  role: LeadRole,
): LeadsListQuery {
  let nextQuery = query.eq("organization_id", organizationId);

  if (!canIncludeArchivedLeads(role, filters.includeArchived)) {
    nextQuery = nextQuery.is("archived_at", null);
  }

  if (filters.status) {
    nextQuery = Array.isArray(filters.status)
      ? nextQuery.in("status", filters.status)
      : nextQuery.eq("status", filters.status);
  }

  if (filters.stageId) {
    nextQuery = nextQuery.eq("stage_id", filters.stageId);
  }

  if (filters.ownerIsUnassigned) {
    nextQuery = nextQuery.is("owner_member_id", null);
  } else if (filters.ownerMemberId) {
    nextQuery = nextQuery.eq("owner_member_id", filters.ownerMemberId);
  }

  if (filters.search) {
    const pattern = `%${escapeLeadIlikePattern(filters.search)}%`;
    nextQuery = nextQuery.or(`display_name.ilike.${pattern},email.ilike.${pattern}`);
  }

  return nextQuery;
}

function applySort(query: LeadsListQuery, sort: LeadListSort): LeadsListQuery {
  const field =
    sort.field && LEAD_SORT_FIELDS.has(sort.field) ? sort.field : "display_name";
  const direction = sort.direction ?? "asc";
  const ascending = direction === "asc";

  const nextQuery = query.order(field, { ascending, nullsFirst: false });
  return nextQuery.order("id", { ascending: true });
}

async function ensureLeadReadAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; role: LeadRole }
  | { ok: false; error: import("@/features/leads/domain/types").LeadApplicationError }
> {
  const orgResult = await resolveOrganizationContext({ supabase, organizationId });
  if (!orgResult.ok) {
    return { ok: false, error: mapOrganizationContextError(orgResult.error) };
  }

  const permissions = resolveLeadPermissions(orgResult.context.role);
  if (!permissions.canViewLead && !permissions.canViewArchivedLeads) {
    return { ok: false, error: permissionDeniedError() };
  }

  return { ok: true, role: orgResult.context.role };
}

export async function listLeads(
  params: ListLeadsParams,
): Promise<LeadReadQueryResult<LeadListReadResult>> {
  const parsed = validateLeadListQuery({
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

  const access = await ensureLeadReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const role = access.role;
  const { page, pageSize, offset, limit } = normalizeLeadPagination(parsed.data.pagination);

  let query = params.supabase.from("leads").select(LEAD_LIST_SELECT_COLUMNS, { count: "exact" });

  query = applyListFilters(query, parsed.data.filters, parsed.data.organizationId, role);
  query = applySort(query, parsed.data.sort);

  const { data, error, count } = await query.range(offset, offset + limit - 1);

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  const rows = (data ?? []) as LeadListRow[];
  const total = count ?? rows.length;

  const [ownerLabels, stageBundles] = await Promise.all([
    resolveMemberLabels(
      params.supabase,
      parsed.data.organizationId,
      rows.map((row) => row.owner_member_id),
    ),
    resolveStageLabelBundles(
      params.supabase,
      parsed.data.organizationId,
      rows.map((row) => row.stage_id),
    ),
  ]);

  return {
    ok: true,
    data: {
      items: rows.map((row) =>
        mapLeadListItem(
          row,
          resolveMemberLabel(row.owner_member_id, ownerLabels),
          resolveStageLabelBundle(row.stage_id, stageBundles),
        ),
      ),
      pagination: buildPaginationMeta(page, pageSize, total),
    },
  };
}

export async function getLeadById(
  params: LeadByIdParams,
): Promise<LeadReadQueryResult<LeadDetailReadModel>> {
  const parsed = validateLeadIdQuery({
    organizationId: params.organizationId,
    leadId: params.leadId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureLeadReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const { data, error } = await params.supabase
    .from("leads")
    .select(LEAD_DETAIL_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("id", parsed.data.leadId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  if (!data) {
    return { ok: false, error: leadUnavailableError() };
  }

  const row = data as LeadDetailRow;

  const [memberLabels, stageBundles] = await Promise.all([
    resolveMemberLabels(params.supabase, parsed.data.organizationId, [
      row.owner_member_id,
      row.created_by_member_id,
    ]),
    resolveStageLabelBundles(params.supabase, parsed.data.organizationId, [row.stage_id]),
  ]);

  let convertedCustomer = null;
  if (row.converted_customer_id && row.converted_at) {
    const customerRow = await resolveConvertedCustomerRow(
      params.supabase,
      parsed.data.organizationId,
      row.converted_customer_id,
    );
    convertedCustomer = mapLeadConvertedCustomerSummary(
      row.converted_customer_id,
      row.converted_at,
      customerRow,
    );
  }

  return {
    ok: true,
    data: mapLeadDetail(row, {
      ownerLabel: resolveMemberLabel(row.owner_member_id, memberLabels),
      createdByLabel: row.created_by_member_id
        ? resolveMemberLabel(row.created_by_member_id, memberLabels)
        : MEMBER_LABEL_UNASSIGNED,
      stage: toLeadStageSummary(row.stage_id, stageBundles),
      convertedCustomer,
    }),
  };
}

export async function listLeadStatusHistory(
  params: LeadByIdParams,
): Promise<LeadReadQueryResult<LeadStatusHistoryEntry[]>> {
  const parsed = validateLeadHistoryQuery({
    organizationId: params.organizationId,
    leadId: params.leadId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const leadResult = await getLeadById({
    supabase: params.supabase,
    organizationId: parsed.data.organizationId,
    leadId: parsed.data.leadId,
  });

  if (!leadResult.ok) {
    return { ok: false, error: leadResult.error };
  }

  const { data, error } = await params.supabase
    .from("lead_status_history")
    .select(LEAD_STATUS_HISTORY_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("lead_id", parsed.data.leadId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  const rows = (data ?? []) as LeadStatusHistoryQueryRow[];
  const actorLabels = await resolveMemberLabels(
    params.supabase,
    parsed.data.organizationId,
    rows.map((row) => row.changed_by_member_id),
  );

  return {
    ok: true,
    data: rows.map((row) =>
      mapLeadStatusHistoryEntry(row, resolveMemberLabel(row.changed_by_member_id, actorLabels)),
    ),
  };
}

export async function listLeadStageHistory(
  params: LeadByIdParams,
): Promise<LeadReadQueryResult<LeadStageHistoryEntry[]>> {
  const parsed = validateLeadHistoryQuery({
    organizationId: params.organizationId,
    leadId: params.leadId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const leadResult = await getLeadById({
    supabase: params.supabase,
    organizationId: parsed.data.organizationId,
    leadId: parsed.data.leadId,
  });

  if (!leadResult.ok) {
    return { ok: false, error: leadResult.error };
  }

  const { data, error } = await params.supabase
    .from("lead_stage_history")
    .select(LEAD_STAGE_HISTORY_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .eq("lead_id", parsed.data.leadId)
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  const rows = (data ?? []) as LeadStageHistoryQueryRow[];
  const [actorLabels, stageBundles] = await Promise.all([
    resolveMemberLabels(
      params.supabase,
      parsed.data.organizationId,
      rows.map((row) => row.changed_by_member_id),
    ),
    resolveStageLabelBundles(
      params.supabase,
      parsed.data.organizationId,
      rows.flatMap((row) => [row.from_stage_id, row.to_stage_id]),
    ),
  ]);

  return {
    ok: true,
    data: rows.map((row) =>
      mapLeadStageHistoryEntry(
        row,
        resolveMemberLabel(row.changed_by_member_id, actorLabels),
        stageBundles,
      ),
    ),
  };
}

export async function listLeadPipelineStageOptions(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
}): Promise<LeadReadQueryResult<LeadPipelineStageOption[]>> {
  const parsed = validateLeadListQuery({
    organizationId: params.organizationId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureLeadReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const { data, error } = await params.supabase
    .from("lead_pipeline_stages")
    .select(LEAD_PIPELINE_STAGE_SELECT_COLUMNS)
    .eq("organization_id", parsed.data.organizationId)
    .is("archived_at", null)
    .order("position", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return { ok: false, error: normalizeLeadError(error) };
  }

  const rows = (data ?? []) as LeadPipelineStageQueryRow[];
  const options: LeadPipelineStageOption[] = [];

  for (const row of rows) {
    const option = mapLeadPipelineStageOption(row);
    if (option) {
      options.push(option);
    }
  }

  return { ok: true, data: options };
}

/**
 * Orchestrates related-task reads after confirming the lead is organization-visible.
 * Reuses Tasks `listTasksForLead` without duplicating task query logic.
 */
export async function listLeadRelatedTasks(
  params: LeadByIdParams & {
    pagination?: LeadPagination;
  },
): Promise<LeadReadQueryResult<TaskListReadResult>> {
  const parsed = validateLeadIdQuery({
    organizationId: params.organizationId,
    leadId: params.leadId,
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const leadResult = await getLeadById({
    supabase: params.supabase,
    organizationId: parsed.data.organizationId,
    leadId: parsed.data.leadId,
  });

  if (!leadResult.ok) {
    return { ok: false, error: leadResult.error };
  }

  const access = await ensureLeadReadAccess(params.supabase, parsed.data.organizationId);
  if (!access.ok) {
    return access;
  }

  const leadPermissions = resolveLeadPermissions(access.role, {
    isArchived: leadResult.data.archivedAt != null,
    status: leadResult.data.status,
  });

  if (!leadPermissions.canViewRelatedTasks) {
    return { ok: false, error: permissionDeniedError() };
  }

  const pagination = normalizeLeadPagination(params.pagination ?? {});

  const tasksResult = await listTasksForLead({
    supabase: params.supabase,
    organizationId: parsed.data.organizationId,
    leadId: parsed.data.leadId,
    filters: { includeArchived: false },
    pagination: { page: pagination.page, pageSize: pagination.pageSize },
  });

  if (!tasksResult.ok) {
    return { ok: false, error: mapTaskReadError(tasksResult.error) };
  }

  return { ok: true, data: tasksResult.data };
}
