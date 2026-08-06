import type {
  AttentionListFilters,
  AttentionListSort,
  AttentionPagination,
  AttentionSortDirection,
  AttentionSortField,
} from "@/features/attention/domain/read-types";
import {
  DEFAULT_ATTENTION_PAGE_SIZE,
  MAX_ATTENTION_PAGE_SIZE,
} from "@/features/attention/domain/read-types";
import type { AttentionRole } from "@/features/attention/domain/types";
import {
  ATTENTION_ITEM_STATUSES,
  getAttentionItemStatusLabel,
  isAttentionItemStatus,
} from "@/features/attention/domain/status";
import {
  ATTENTION_SEVERITIES,
  getAttentionSeverityLabel,
  isAttentionSeverity,
} from "@/features/attention/domain/severity";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";

/** Product UX default (explicit). Does not change B1.7.4 Zod default `created_at`. */
export const ATTENTION_LIST_DEFAULT_SORT_FIELD: AttentionSortField =
  "last_detected_at";
export const ATTENTION_LIST_DEFAULT_SORT_DIRECTION: AttentionSortDirection =
  "desc";
export const ATTENTION_LIST_DEFAULT_PAGE = 1;
export const ATTENTION_LIST_DEFAULT_PAGE_SIZE = DEFAULT_ATTENTION_PAGE_SIZE;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SORT_FIELDS = [
  "last_detected_at",
  "created_at",
  "updated_at",
  "severity",
] as const satisfies readonly AttentionSortField[];

export type AttentionAssigneeUrlValue = "unassigned";

export type AttentionListUrlState = {
  org?: string;
  status?: (typeof ATTENTION_ITEM_STATUSES)[number];
  severity?: (typeof ATTENTION_SEVERITIES)[number];
  /** Product UI supports unassigned only; specific member UUIDs may arrive via URL. */
  assignee?: AttentionAssigneeUrlValue | string;
  acknowledged?: boolean;
  includeArchived: boolean;
  enrollmentId?: string;
  customerId?: string;
  programId?: string;
  sort: AttentionSortField;
  direction: AttentionSortDirection;
  page: number;
  pageSize: number;
};

export type ParsedAttentionListSearchParams = {
  urlState: AttentionListUrlState;
  listInput: {
    filters: AttentionListFilters;
    pagination: AttentionPagination;
    sort: AttentionListSort;
  };
  warnings: string[];
};

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  max: number,
): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function parseSortField(value: string | undefined): AttentionSortField {
  if (value && (SORT_FIELDS as readonly string[]).includes(value)) {
    return value as AttentionSortField;
  }
  return ATTENTION_LIST_DEFAULT_SORT_FIELD;
}

function parseSortDirection(
  value: string | undefined,
): AttentionSortDirection {
  if (value === "asc" || value === "desc") {
    return value;
  }
  return ATTENTION_LIST_DEFAULT_SORT_DIRECTION;
}

export function canViewArchivedAttentionFilter(role: AttentionRole): boolean {
  return resolveAttentionPermissions(role).canViewArchivedItems;
}

export function parseAttentionListSearchParams(
  raw: Record<string, string | string[] | undefined>,
  options: { role: AttentionRole },
): ParsedAttentionListSearchParams {
  const warnings: string[] = [];

  const orgRaw = firstValue(raw.org);
  const org = orgRaw && UUID_PATTERN.test(orgRaw) ? orgRaw : undefined;
  if (orgRaw && !org) {
    warnings.push("invalid_org");
  }

  const statusRaw = firstValue(raw.status);
  let status: AttentionListUrlState["status"];
  if (statusRaw && statusRaw !== "all") {
    if (isAttentionItemStatus(statusRaw)) {
      status = statusRaw;
    } else {
      warnings.push("invalid_status");
    }
  }

  const severityRaw = firstValue(raw.severity);
  let severity: AttentionListUrlState["severity"];
  if (severityRaw && severityRaw !== "all") {
    if (isAttentionSeverity(severityRaw)) {
      severity = severityRaw;
    } else {
      warnings.push("invalid_severity");
    }
  }

  const assigneeRaw = firstValue(raw.assignee);
  let assignee: AttentionListUrlState["assignee"];
  if (assigneeRaw && assigneeRaw !== "all") {
    if (assigneeRaw === "unassigned") {
      assignee = "unassigned";
    } else if (UUID_PATTERN.test(assigneeRaw)) {
      assignee = assigneeRaw;
    } else {
      warnings.push("invalid_assignee");
    }
  }

  const acknowledgedRaw = firstValue(raw.acknowledged);
  let acknowledged: boolean | undefined;
  if (acknowledgedRaw === "true") {
    acknowledged = true;
  } else if (acknowledgedRaw === "false") {
    acknowledged = false;
  } else if (acknowledgedRaw && acknowledgedRaw !== "all") {
    warnings.push("invalid_acknowledged");
  }

  const includeArchivedRequested = firstValue(raw.includeArchived) === "true";
  const includeArchived =
    includeArchivedRequested && canViewArchivedAttentionFilter(options.role)
      ? true
      : false;
  if (includeArchivedRequested && !includeArchived) {
    warnings.push("include_archived_not_allowed");
  }

  const enrollmentIdRaw = firstValue(raw.enrollmentId);
  const enrollmentId =
    enrollmentIdRaw && UUID_PATTERN.test(enrollmentIdRaw)
      ? enrollmentIdRaw
      : undefined;
  if (enrollmentIdRaw && !enrollmentId) {
    warnings.push("invalid_enrollment_id");
  }

  const customerIdRaw = firstValue(raw.customerId);
  const customerId =
    customerIdRaw && UUID_PATTERN.test(customerIdRaw) ? customerIdRaw : undefined;
  if (customerIdRaw && !customerId) {
    warnings.push("invalid_customer_id");
  }

  const programIdRaw = firstValue(raw.programId);
  const programId =
    programIdRaw && UUID_PATTERN.test(programIdRaw) ? programIdRaw : undefined;
  if (programIdRaw && !programId) {
    warnings.push("invalid_program_id");
  }

  const sortRaw = firstValue(raw.sort);
  const sort = parseSortField(sortRaw);
  if (sortRaw && sortRaw !== sort) {
    warnings.push("invalid_sort");
  }

  const directionRaw = firstValue(raw.direction);
  const direction = parseSortDirection(directionRaw);
  if (directionRaw && directionRaw !== "asc" && directionRaw !== "desc") {
    warnings.push("invalid_direction");
  }

  const page = parsePositiveInt(
    firstValue(raw.page),
    ATTENTION_LIST_DEFAULT_PAGE,
    Number.MAX_SAFE_INTEGER,
  );
  const pageSize = parsePositiveInt(
    firstValue(raw.pageSize),
    ATTENTION_LIST_DEFAULT_PAGE_SIZE,
    MAX_ATTENTION_PAGE_SIZE,
  );

  const urlState: AttentionListUrlState = {
    org,
    status,
    severity,
    assignee,
    acknowledged,
    includeArchived,
    enrollmentId,
    customerId,
    programId,
    sort,
    direction,
    page,
    pageSize,
  };

  const filters: AttentionListFilters = {
    includeArchived,
  };
  if (status) {
    filters.status = status;
  }
  if (severity) {
    filters.severity = severity;
  }
  if (assignee === "unassigned") {
    filters.assigneeMemberId = null;
  } else if (typeof assignee === "string") {
    filters.assigneeMemberId = assignee;
  }
  if (acknowledged !== undefined) {
    filters.acknowledged = acknowledged;
  }
  if (enrollmentId) {
    filters.enrollmentId = enrollmentId;
  }
  if (customerId) {
    filters.customerId = customerId;
  }
  if (programId) {
    filters.programId = programId;
  }

  return {
    urlState,
    listInput: {
      filters,
      pagination: { page, pageSize },
      sort: { field: sort, direction },
    },
    warnings,
  };
}

export function buildAttentionListQueryString(
  state: AttentionListUrlState,
): string {
  const params = new URLSearchParams();
  if (state.org) {
    params.set("org", state.org);
  }
  if (state.status) {
    params.set("status", state.status);
  }
  if (state.severity) {
    params.set("severity", state.severity);
  }
  if (state.assignee) {
    params.set("assignee", state.assignee);
  }
  if (state.acknowledged === true) {
    params.set("acknowledged", "true");
  } else if (state.acknowledged === false) {
    params.set("acknowledged", "false");
  }
  if (state.includeArchived) {
    params.set("includeArchived", "true");
  }
  if (state.enrollmentId) {
    params.set("enrollmentId", state.enrollmentId);
  }
  if (state.customerId) {
    params.set("customerId", state.customerId);
  }
  if (state.programId) {
    params.set("programId", state.programId);
  }
  if (state.sort !== ATTENTION_LIST_DEFAULT_SORT_FIELD) {
    params.set("sort", state.sort);
  }
  if (state.direction !== ATTENTION_LIST_DEFAULT_SORT_DIRECTION) {
    params.set("direction", state.direction);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== ATTENTION_LIST_DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function buildAttentionListHref(state: AttentionListUrlState): string {
  return `${ATTENTION_ROUTE}${buildAttentionListQueryString(state)}`;
}

export function hasAttentionListActiveFilters(
  state: AttentionListUrlState,
): boolean {
  return Boolean(
    state.status ||
      state.severity ||
      state.assignee ||
      state.acknowledged !== undefined ||
      state.includeArchived ||
      state.enrollmentId ||
      state.customerId ||
      state.programId,
  );
}

export function hasAttentionListNonDefaultSort(
  state: AttentionListUrlState,
): boolean {
  return (
    state.sort !== ATTENTION_LIST_DEFAULT_SORT_FIELD ||
    state.direction !== ATTENTION_LIST_DEFAULT_SORT_DIRECTION
  );
}

export function hasAttentionRelationshipContext(
  state: AttentionListUrlState,
): boolean {
  return Boolean(state.enrollmentId || state.customerId || state.programId);
}

export function buildAttentionListResetHref(
  state: AttentionListUrlState,
): string {
  return buildAttentionListHref({
    org: state.org,
    includeArchived: false,
    sort: ATTENTION_LIST_DEFAULT_SORT_FIELD,
    direction: ATTENTION_LIST_DEFAULT_SORT_DIRECTION,
    page: 1,
    pageSize: ATTENTION_LIST_DEFAULT_PAGE_SIZE,
  });
}

export function buildAttentionListPageHref(
  state: AttentionListUrlState,
  page: number,
): string {
  return buildAttentionListHref({ ...state, page });
}

export function attentionListFilterWarningMessage(
  warnings: string[],
): string | null {
  if (warnings.includes("include_archived_not_allowed")) {
    return "Archived attention items are only available to owners and admins. That filter was ignored.";
  }
  if (warnings.length > 0) {
    return "Some filters were adjusted because they were invalid or not allowed for your role.";
  }
  return null;
}

export const ATTENTION_LIST_STATUS_OPTIONS = ATTENTION_ITEM_STATUSES.map(
  (status) => ({
    value: status,
    label: getAttentionItemStatusLabel(status),
  }),
);

export const ATTENTION_LIST_SEVERITY_OPTIONS = ATTENTION_SEVERITIES.map(
  (severity) => ({
    value: severity,
    label: getAttentionSeverityLabel(severity),
  }),
);

export const ATTENTION_LIST_SORT_OPTIONS: Array<{
  value: AttentionSortField;
  label: string;
}> = [
  { value: "last_detected_at", label: "Last detected" },
  { value: "created_at", label: "Created" },
  { value: "updated_at", label: "Updated" },
  { value: "severity", label: "Severity" },
];
