import type { ProgressRole } from "@/features/progress/domain/types";
import type {
  ProgressListFilters,
  ProgressPagination,
  ProgressSortDirection,
  ProgressSortField,
} from "@/features/progress/domain/read-types";
import {
  DEFAULT_PROGRESS_PAGE_SIZE,
  MAX_PROGRESS_PAGE_SIZE,
} from "@/features/progress/domain/read-types";
import {
  isProgressFactType,
  PROGRESS_FACT_TYPES,
} from "@/features/progress/domain/fact-types";
import type { ProgressFactType } from "@/features/progress/domain/types";
import { resolveProgressPermissions } from "@/features/progress/domain/permissions";

export type ProgressListUrlState = {
  org?: string;
  factType?: ProgressFactType;
  q?: string;
  includeVoided: boolean;
  sort: ProgressSortField;
  direction: ProgressSortDirection;
  page: number;
  pageSize: number;
  enrollmentId?: string;
  customerId?: string;
  programId?: string;
};

export type ParsedProgressListSearchParams = {
  urlState: ProgressListUrlState;
  listInput: {
    filters: ProgressListFilters;
    pagination: ProgressPagination;
    sort: { field: ProgressSortField; direction: ProgressSortDirection };
  };
  warnings: string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SORT_FIELDS = [
  "occurred_at",
  "recorded_at",
  "fact_type",
] as const satisfies readonly ProgressSortField[];

const DEFAULT_SORT: ProgressSortField = "occurred_at";
const DEFAULT_DIRECTION: ProgressSortDirection = "desc";

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

function parseFactType(value: string | undefined): ProgressFactType | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  if (isProgressFactType(value)) {
    return value;
  }
  return undefined;
}

function parseSortField(value: string | undefined): ProgressSortField {
  if (value && (SORT_FIELDS as readonly string[]).includes(value)) {
    return value as ProgressSortField;
  }
  return DEFAULT_SORT;
}

function parseSortDirection(value: string | undefined): ProgressSortDirection {
  if (value === "asc") {
    return "asc";
  }
  if (value === "desc") {
    return "desc";
  }
  return DEFAULT_DIRECTION;
}

export function canViewVoidedProgressFilter(role: ProgressRole): boolean {
  return resolveProgressPermissions(role).canViewVoidedFacts;
}

export function parseProgressListSearchParams(
  raw: Record<string, string | string[] | undefined>,
  options: { role: ProgressRole },
): ParsedProgressListSearchParams {
  const warnings: string[] = [];
  const orgRaw = firstValue(raw.org);
  const org = orgRaw && UUID_PATTERN.test(orgRaw) ? orgRaw : undefined;
  if (orgRaw && !org) {
    warnings.push("invalid_org");
  }

  const factTypeRaw = firstValue(raw.factType);
  const factType = parseFactType(factTypeRaw);
  if (factTypeRaw && factTypeRaw !== "all" && !factType) {
    warnings.push("invalid_fact_type");
  }

  const qRaw = firstValue(raw.q)?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw.slice(0, 200) : undefined;

  const includeVoidedRequested = firstValue(raw.includeVoided) === "true";
  const includeVoided =
    includeVoidedRequested && canViewVoidedProgressFilter(options.role) ? true : false;
  if (includeVoidedRequested && !includeVoided) {
    warnings.push("include_voided_not_allowed");
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
    DEFAULT_PROGRESS_PAGE_SIZE,
    MAX_PROGRESS_PAGE_SIZE,
  );

  const enrollmentIdRaw = firstValue(raw.enrollmentId);
  const enrollmentId =
    enrollmentIdRaw && UUID_PATTERN.test(enrollmentIdRaw) ? enrollmentIdRaw : undefined;
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

  const urlState: ProgressListUrlState = {
    org,
    factType,
    q,
    includeVoided,
    sort,
    direction,
    page,
    pageSize,
    enrollmentId,
    customerId,
    programId,
  };

  const filters: ProgressListFilters = {
    includeVoided,
    search: q,
    factType,
    enrollmentId,
    customerId,
    programId,
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

export function buildProgressListQueryString(state: ProgressListUrlState): string {
  const params = new URLSearchParams();
  if (state.org) {
    params.set("org", state.org);
  }
  if (state.factType) {
    params.set("factType", state.factType);
  }
  if (state.q) {
    params.set("q", state.q);
  }
  if (state.includeVoided) {
    params.set("includeVoided", "true");
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
  if (state.pageSize !== DEFAULT_PROGRESS_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize));
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
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function hasProgressRelationshipContext(state: ProgressListUrlState): boolean {
  return Boolean(state.enrollmentId || state.customerId || state.programId);
}

export function buildClearProgressContextHref(state: ProgressListUrlState): string {
  return `/progress${buildProgressListQueryString({
    org: state.org,
    factType: state.factType,
    q: state.q,
    includeVoided: state.includeVoided,
    sort: state.sort,
    direction: state.direction,
    page: 1,
    pageSize: state.pageSize,
  })}`;
}

export function parseProgressListReturnState(
  raw: Record<string, string | string[] | undefined>,
  role: ProgressRole,
): ProgressListUrlState {
  return parseProgressListSearchParams(raw, { role }).urlState;
}

export const PROGRESS_LIST_FACT_TYPE_OPTIONS = PROGRESS_FACT_TYPES;
