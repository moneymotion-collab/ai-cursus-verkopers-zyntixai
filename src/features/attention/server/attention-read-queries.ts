import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import type {
  AttentionItemDetailReadModel,
  AttentionListFilters,
  AttentionListReadResult,
  AttentionListSort,
  AttentionPagination,
  AttentionPaginationMeta,
  AttentionEventReadModel,
  AttentionSignalReadModel,
} from "@/features/attention/domain/read-types";
import type {
  AttentionReadQueryResult,
  AttentionRole,
} from "@/features/attention/domain/types";
import { isKnownAttentionRole } from "@/features/attention/domain/permissions";
import { isAttentionItemStatus } from "@/features/attention/domain/status";
import {
  ATTENTION_CUSTOMER_SUMMARY_SELECT_COLUMNS,
  ATTENTION_ENROLLMENT_SUMMARY_SELECT_COLUMNS,
  ATTENTION_EVENT_SELECT_COLUMNS,
  ATTENTION_ITEM_DETAIL_SELECT_COLUMNS,
  ATTENTION_ITEM_LIST_SELECT_COLUMNS,
  ATTENTION_PROGRAM_SUMMARY_SELECT_COLUMNS,
  ATTENTION_PROJECT_SUMMARY_SELECT_COLUMNS,
  ATTENTION_SIGNAL_SELECT_COLUMNS,
  ATTENTION_TASK_SUMMARY_SELECT_COLUMNS,
} from "@/features/attention/server/attention-query-columns";
import {
  mapAttentionCustomerSummary,
  mapAttentionEnrollmentSummary,
  mapAttentionEvent,
  mapAttentionItemDetail,
  mapAttentionItemListItem,
  mapAttentionProgramSummary,
  mapAttentionProjectSummary,
  mapAttentionSignal,
  mapAttentionTaskSummary,
  type AttentionCustomerSummaryRow,
  type AttentionEnrollmentSummaryRow,
  type AttentionEventRow,
  type AttentionItemDetailRow,
  type AttentionItemListRow,
  type AttentionProgramSummaryRow,
  type AttentionProjectSummaryRow,
  type AttentionSignalRow,
  type AttentionTaskSummaryRow,
} from "@/features/attention/server/map-attention-read-model";
import {
  attentionItemUnavailableError,
  invalidInputError,
  invalidStateError,
  mapOrganizationContextError,
  normalizeAttentionError,
  permissionDeniedError,
  zodErrorToFieldMap,
} from "@/features/attention/server/normalize-attention-error";
import {
  normalizeAttentionPagination,
  validateAttentionItemIdQuery,
  validateAttentionListQuery,
} from "@/features/attention/validation/read-query-schemas";

type ListAttentionItemsParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  filters?: AttentionListFilters;
  pagination?: AttentionPagination;
  sort?: AttentionListSort;
  evaluatedAt?: string | null;
};

type AttentionItemByIdParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  attentionItemId: string;
  evaluatedAt?: string | null;
};

type AttentionChildListParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  attentionItemId: string;
};

type AttentionListQuery = ReturnType<
  ReturnType<SupabaseClient<Database>["from"]>["select"]
>;

function buildPaginationMeta(
  page: number,
  pageSize: number,
  total: number,
): AttentionPaginationMeta {
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

function canIncludeArchivedItems(
  role: AttentionRole,
  includeArchived: boolean | undefined,
): boolean {
  return includeArchived === true && (role === "owner" || role === "admin");
}

function applyListFilters(
  query: AttentionListQuery,
  filters: AttentionListFilters,
  organizationId: string,
  role: AttentionRole,
): AttentionListQuery {
  let nextQuery = query.eq("organization_id", organizationId);

  if (!canIncludeArchivedItems(role, filters.includeArchived)) {
    nextQuery = nextQuery.is("archived_at", null);
  }

  if (filters.status) {
    nextQuery = Array.isArray(filters.status)
      ? nextQuery.in("status", filters.status)
      : nextQuery.eq("status", filters.status);
  }

  if (filters.severity) {
    nextQuery = Array.isArray(filters.severity)
      ? nextQuery.in("severity", filters.severity)
      : nextQuery.eq("severity", filters.severity);
  }

  if (filters.assigneeMemberId === null) {
    nextQuery = nextQuery.is("assignee_member_id", null);
  } else if (typeof filters.assigneeMemberId === "string") {
    nextQuery = nextQuery.eq("assignee_member_id", filters.assigneeMemberId);
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

  if (filters.projectId) {
    nextQuery = nextQuery.eq("project_id", filters.projectId);
  }

  if (filters.acknowledged === true) {
    nextQuery = nextQuery.not("acknowledged_at", "is", null);
  } else if (filters.acknowledged === false) {
    nextQuery = nextQuery.is("acknowledged_at", null);
  }

  if (filters.createdFrom) {
    nextQuery = nextQuery.gte("created_at", filters.createdFrom);
  }
  if (filters.createdTo) {
    nextQuery = nextQuery.lte("created_at", filters.createdTo);
  }
  if (filters.updatedFrom) {
    nextQuery = nextQuery.gte("updated_at", filters.updatedFrom);
  }
  if (filters.updatedTo) {
    nextQuery = nextQuery.lte("updated_at", filters.updatedTo);
  }

  return nextQuery;
}

function applySort(
  query: AttentionListQuery,
  sort: AttentionListSort,
): AttentionListQuery {
  const field = sort.field ?? "created_at";
  const direction = sort.direction ?? "desc";
  const ascending = direction === "asc";

  const nextQuery = query.order(field, { ascending, nullsFirst: false });
  return nextQuery.order("id", { ascending: true });
}

async function ensureAttentionReadAccess(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<
  | { ok: true; role: AttentionRole }
  | { ok: false; error: import("@/features/attention/domain/types").AttentionApplicationError }
> {
  const orgResult = await resolveOrganizationContext({ supabase, organizationId });
  if (!orgResult.ok) {
    return { ok: false, error: mapOrganizationContextError(orgResult.error) };
  }

  if (!isKnownAttentionRole(orgResult.context.role)) {
    return { ok: false, error: permissionDeniedError() };
  }

  const permissions = resolveAttentionPermissions(orgResult.context.role);
  if (!permissions.canListItems) {
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
    .select(ATTENTION_CUSTOMER_SUMMARY_SELECT_COLUMNS)
    .eq("organization_id", organizationId)
    .in("id", customerIds);

  for (const row of (data ?? []) as AttentionCustomerSummaryRow[]) {
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
    .select(ATTENTION_PROGRAM_SUMMARY_SELECT_COLUMNS)
    .eq("organization_id", organizationId)
    .in("id", programIds);

  for (const row of (data ?? []) as AttentionProgramSummaryRow[]) {
    labels[row.id] = row.name;
  }

  return labels;
}

async function loadProjectLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  projectIds: string[],
): Promise<Record<string, string>> {
  const labels: Record<string, string> = {};
  if (projectIds.length === 0) {
    return labels;
  }

  const { data } = await supabase
    .from("projects")
    .select(ATTENTION_PROJECT_SUMMARY_SELECT_COLUMNS)
    .eq("organization_id", organizationId)
    .in("id", projectIds);

  for (const row of (data ?? []) as AttentionProjectSummaryRow[]) {
    labels[row.id] = row.name;
  }

  return labels;
}

async function loadAttentionItemGate(
  params: AttentionChildListParams,
): Promise<
  | { ok: true; role: AttentionRole; row: AttentionItemDetailRow }
  | { ok: false; error: import("@/features/attention/domain/types").AttentionApplicationError }
> {
  const parsed = validateAttentionItemIdQuery({
    organizationId: params.organizationId,
    attentionItemId: params.attentionItemId,
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: invalidInputError(zodErrorToFieldMap(parsed.error)),
    };
  }

  const access = await ensureAttentionReadAccess(
    params.supabase,
    params.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const { data, error } = await params.supabase
    .from("attention_items")
    .select(ATTENTION_ITEM_DETAIL_SELECT_COLUMNS)
    .eq("organization_id", params.organizationId)
    .eq("id", params.attentionItemId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  if (!data) {
    return { ok: false, error: attentionItemUnavailableError() };
  }

  const row = data as unknown as AttentionItemDetailRow;
  if (!isAttentionItemStatus(row.status)) {
    return {
      ok: false,
      error: invalidStateError("Unknown attention status from database."),
    };
  }

  const permissions = resolveAttentionPermissions(access.role, {
    isArchived: row.archived_at != null,
    status: row.status,
  });

  if (row.archived_at != null && !permissions.canViewArchivedItems) {
    return { ok: false, error: attentionItemUnavailableError() };
  }

  if (!permissions.canViewItem) {
    return { ok: false, error: attentionItemUnavailableError() };
  }

  return { ok: true, role: access.role, row };
}

export async function listAttentionItems(
  params: ListAttentionItemsParams,
): Promise<AttentionReadQueryResult<AttentionListReadResult>> {
  const parsed = validateAttentionListQuery({
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

  const access = await ensureAttentionReadAccess(
    params.supabase,
    params.organizationId,
  );
  if (!access.ok) {
    return access;
  }

  const filters = parsed.data.filters;
  const pagination = normalizeAttentionPagination(parsed.data.pagination);
  const sort = parsed.data.sort;

  let query = applyListFilters(
    params.supabase
      .from("attention_items")
      .select(ATTENTION_ITEM_LIST_SELECT_COLUMNS, { count: "exact" }),
    filters,
    params.organizationId,
    access.role,
  );

  query = applySort(query, sort);
  query = query.range(pagination.offset, pagination.offset + pagination.limit - 1);

  const { data, error, count } = await query;

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  const rows = (data ?? []) as unknown as AttentionItemListRow[];
  const customerIds = [
    ...new Set(rows.map((row) => row.customer_id).filter((id): id is string => Boolean(id))),
  ];
  const programIds = [
    ...new Set(rows.map((row) => row.program_id).filter((id): id is string => Boolean(id))),
  ];
  const projectIds = [
    ...new Set(rows.map((row) => row.project_id).filter((id): id is string => Boolean(id))),
  ];
  const [customerLabels, programLabels, projectLabels] = await Promise.all([
    loadCustomerLabels(params.supabase, params.organizationId, customerIds),
    loadProgramLabels(params.supabase, params.organizationId, programIds),
    loadProjectLabels(params.supabase, params.organizationId, projectIds),
  ]);

  const items = [];
  for (const row of rows) {
    const mapped = mapAttentionItemListItem(row, {
      customerDisplayName: row.customer_id
        ? customerLabels[row.customer_id] ?? null
        : null,
      programName: row.program_id ? programLabels[row.program_id] ?? null : null,
      projectName: row.project_id ? projectLabels[row.project_id] ?? null : null,
      evaluatedAt: params.evaluatedAt,
    });
    if (!mapped.ok) {
      return mapped;
    }
    items.push(mapped.data);
  }

  return {
    ok: true,
    data: {
      items,
      pagination: buildPaginationMeta(
        pagination.page,
        pagination.pageSize,
        count ?? rows.length,
      ),
    },
  };
}

export async function getAttentionItemById(
  params: AttentionItemByIdParams,
): Promise<AttentionReadQueryResult<AttentionItemDetailReadModel>> {
  const gate = await loadAttentionItemGate(params);
  if (!gate.ok) {
    return gate;
  }

  const row = gate.row;

  const [
    enrollmentResult,
    customerResult,
    programResult,
    projectResult,
    taskResult,
    signalsResult,
    eventsResult,
  ] = await Promise.all([
      row.enrollment_id
        ? params.supabase
            .from("enrollments")
            .select(ATTENTION_ENROLLMENT_SUMMARY_SELECT_COLUMNS)
            .eq("organization_id", params.organizationId)
            .eq("id", row.enrollment_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      row.customer_id
        ? params.supabase
            .from("customers")
            .select(ATTENTION_CUSTOMER_SUMMARY_SELECT_COLUMNS)
            .eq("organization_id", params.organizationId)
            .eq("id", row.customer_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      row.program_id
        ? params.supabase
            .from("programs")
            .select(ATTENTION_PROGRAM_SUMMARY_SELECT_COLUMNS)
            .eq("organization_id", params.organizationId)
            .eq("id", row.program_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      row.project_id
        ? params.supabase
            .from("projects")
            .select(ATTENTION_PROJECT_SUMMARY_SELECT_COLUMNS)
            .eq("organization_id", params.organizationId)
            .eq("id", row.project_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      row.task_id
        ? params.supabase
            .from("tasks")
            .select(ATTENTION_TASK_SUMMARY_SELECT_COLUMNS)
            .eq("organization_id", params.organizationId)
            .eq("id", row.task_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      params.supabase
        .from("attention_signals")
        .select(ATTENTION_SIGNAL_SELECT_COLUMNS)
        .eq("organization_id", params.organizationId)
        .eq("attention_item_id", params.attentionItemId)
        .order("detected_at", { ascending: true })
        .order("id", { ascending: true }),
      params.supabase
        .from("attention_item_events")
        .select(ATTENTION_EVENT_SELECT_COLUMNS)
        .eq("organization_id", params.organizationId)
        .eq("attention_item_id", params.attentionItemId)
        .order("created_at", { ascending: true })
        .order("id", { ascending: true }),
    ]);

  if (signalsResult.error) {
    return { ok: false, error: normalizeAttentionError(signalsResult.error) };
  }
  if (eventsResult.error) {
    return { ok: false, error: normalizeAttentionError(eventsResult.error) };
  }

  const signals: AttentionSignalReadModel[] = [];
  for (const signalRow of (signalsResult.data ?? []) as AttentionSignalRow[]) {
    const mapped = mapAttentionSignal(signalRow);
    if (!mapped.ok) {
      return mapped;
    }
    signals.push(mapped.data);
  }

  const events: AttentionEventReadModel[] = [];
  for (const eventRow of (eventsResult.data ?? []) as AttentionEventRow[]) {
    const mapped = mapAttentionEvent(eventRow);
    if (!mapped.ok) {
      return mapped;
    }
    events.push(mapped.data);
  }

  return mapAttentionItemDetail(row, {
    enrollment: enrollmentResult.data
      ? mapAttentionEnrollmentSummary(
          enrollmentResult.data as AttentionEnrollmentSummaryRow,
        )
      : null,
    customer: customerResult.data
      ? mapAttentionCustomerSummary(
          customerResult.data as AttentionCustomerSummaryRow,
        )
      : null,
    program: programResult.data
      ? mapAttentionProgramSummary(
          programResult.data as AttentionProgramSummaryRow,
        )
      : null,
    project: projectResult.data
      ? mapAttentionProjectSummary(
          projectResult.data as AttentionProjectSummaryRow,
        )
      : null,
    task: taskResult.data
      ? mapAttentionTaskSummary(taskResult.data as AttentionTaskSummaryRow)
      : null,
    signals,
    events,
    evaluatedAt: params.evaluatedAt,
  });
}

export async function listAttentionEventsForItem(
  params: AttentionChildListParams,
): Promise<AttentionReadQueryResult<AttentionEventReadModel[]>> {
  const gate = await loadAttentionItemGate(params);
  if (!gate.ok) {
    return gate;
  }

  const { data, error } = await params.supabase
    .from("attention_item_events")
    .select(ATTENTION_EVENT_SELECT_COLUMNS)
    .eq("organization_id", params.organizationId)
    .eq("attention_item_id", params.attentionItemId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  const events: AttentionEventReadModel[] = [];
  for (const row of (data ?? []) as AttentionEventRow[]) {
    const mapped = mapAttentionEvent(row);
    if (!mapped.ok) {
      return mapped;
    }
    events.push(mapped.data);
  }

  return { ok: true, data: events };
}

export async function listAttentionSignalsForItem(
  params: AttentionChildListParams,
): Promise<AttentionReadQueryResult<AttentionSignalReadModel[]>> {
  const gate = await loadAttentionItemGate(params);
  if (!gate.ok) {
    return gate;
  }

  const { data, error } = await params.supabase
    .from("attention_signals")
    .select(ATTENTION_SIGNAL_SELECT_COLUMNS)
    .eq("organization_id", params.organizationId)
    .eq("attention_item_id", params.attentionItemId)
    .order("detected_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return { ok: false, error: normalizeAttentionError(error) };
  }

  const signals: AttentionSignalReadModel[] = [];
  for (const row of (data ?? []) as AttentionSignalRow[]) {
    const mapped = mapAttentionSignal(row);
    if (!mapped.ok) {
      return mapped;
    }
    signals.push(mapped.data);
  }

  return { ok: true, data: signals };
}
