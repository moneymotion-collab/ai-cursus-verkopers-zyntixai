import type { EnrollmentRole } from "@/features/enrollments/domain/types";
import type {
  EnrollmentListFilters,
  EnrollmentPagination,
  EnrollmentSortDirection,
  EnrollmentSortField,
} from "@/features/enrollments/domain/read-types";
import {
  DEFAULT_ENROLLMENT_PAGE_SIZE,
  MAX_ENROLLMENT_PAGE_SIZE,
} from "@/features/enrollments/domain/read-types";
import { ENROLLMENT_STATUSES, isEnrollmentStatus } from "@/features/enrollments/domain/status";
import type { EnrollmentStatus } from "@/features/enrollments/domain/types";
import { resolveEnrollmentPermissions } from "@/features/enrollments/domain/permissions";

export type EnrollmentListUrlState = {
  org?: string;
  status?: EnrollmentStatus;
  q?: string;
  archived: boolean;
  sort: EnrollmentSortField;
  direction: EnrollmentSortDirection;
  page: number;
  pageSize: number;
};

export type ParsedEnrollmentListSearchParams = {
  urlState: EnrollmentListUrlState;
  listInput: {
    filters: EnrollmentListFilters;
    pagination: EnrollmentPagination;
    sort: { field: EnrollmentSortField; direction: EnrollmentSortDirection };
  };
  warnings: string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SORT_FIELDS = [
  "enrolled_at",
  "updated_at",
  "status",
  "created_at",
] as const satisfies readonly EnrollmentSortField[];

const DEFAULT_SORT: EnrollmentSortField = "enrolled_at";
const DEFAULT_DIRECTION: EnrollmentSortDirection = "desc";

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function parseStatus(value: string | undefined): EnrollmentStatus | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  if (isEnrollmentStatus(value)) {
    return value;
  }
  return undefined;
}

function parseSortField(value: string | undefined): EnrollmentSortField {
  if (value && (SORT_FIELDS as readonly string[]).includes(value)) {
    return value as EnrollmentSortField;
  }
  return DEFAULT_SORT;
}

function parseSortDirection(value: string | undefined): EnrollmentSortDirection {
  if (value === "asc") {
    return "asc";
  }
  if (value === "desc") {
    return "desc";
  }
  return DEFAULT_DIRECTION;
}

export function canViewArchivedEnrollmentFilter(role: EnrollmentRole): boolean {
  return resolveEnrollmentPermissions(role).canViewArchivedEnrollments;
}

export function parseEnrollmentListSearchParams(
  raw: Record<string, string | string[] | undefined>,
  options: { role: EnrollmentRole },
): ParsedEnrollmentListSearchParams {
  const warnings: string[] = [];
  const orgRaw = firstValue(raw.org);
  const org = orgRaw && UUID_PATTERN.test(orgRaw) ? orgRaw : undefined;
  if (orgRaw && !org) {
    warnings.push("invalid_org");
  }

  const statusRaw = firstValue(raw.status);
  const status = parseStatus(statusRaw);
  if (statusRaw && statusRaw !== "all" && !status) {
    warnings.push("invalid_status");
  }

  const qRaw = firstValue(raw.q)?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw.slice(0, 200) : undefined;

  const archivedRequested = firstValue(raw.archived) === "true";
  const archived =
    archivedRequested && canViewArchivedEnrollmentFilter(options.role) ? true : false;
  if (archivedRequested && !archived) {
    warnings.push("archived_not_allowed");
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

  const page = parsePositiveInt(firstValue(raw.page), 1, Number.MAX_SAFE_INTEGER);
  const pageSize = parsePositiveInt(
    firstValue(raw.pageSize),
    DEFAULT_ENROLLMENT_PAGE_SIZE,
    MAX_ENROLLMENT_PAGE_SIZE,
  );

  const urlState: EnrollmentListUrlState = {
    org,
    status,
    q,
    archived,
    sort,
    direction,
    page,
    pageSize,
  };

  const filters: EnrollmentListFilters = {
    includeArchived: archived,
    search: q,
    status: status ? status : undefined,
  };

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

export function buildEnrollmentListQueryString(state: EnrollmentListUrlState): string {
  const params = new URLSearchParams();
  if (state.org) {
    params.set("org", state.org);
  }
  if (state.status) {
    params.set("status", state.status);
  }
  if (state.q) {
    params.set("q", state.q);
  }
  if (state.archived) {
    params.set("archived", "true");
  }
  if (state.sort !== DEFAULT_SORT) {
    params.set("sort", state.sort);
  }
  if (state.direction !== DEFAULT_DIRECTION) {
    params.set("direction", state.direction);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== DEFAULT_ENROLLMENT_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function parseEnrollmentListReturnState(
  raw: Record<string, string | string[] | undefined>,
  role: EnrollmentRole,
): EnrollmentListUrlState {
  return parseEnrollmentListSearchParams(raw, { role }).urlState;
}

/** Re-export status array for filter UI without duplicating domain constants. */
export const ENROLLMENT_LIST_STATUS_OPTIONS = ENROLLMENT_STATUSES;
