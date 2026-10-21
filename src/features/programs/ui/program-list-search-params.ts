import type { ProgramRole } from "@/features/programs/domain/types";
import type {
  ProgramListFilters,
  ProgramListSort,
  ProgramPagination,
  ProgramSortDirection,
  ProgramSortField,
} from "@/features/programs/domain/read-types";
import {
  DEFAULT_PROGRAM_PAGE_SIZE,
  MAX_PROGRAM_PAGE_SIZE,
} from "@/features/programs/domain/read-types";
import { PROGRAM_STATUSES, isProgramStatus } from "@/features/programs/domain/status";
import {
  PROGRAM_DELIVERY_MODES,
  isProgramDeliveryMode,
} from "@/features/programs/domain/delivery-mode";
import type { ProgramDeliveryMode, ProgramStatus } from "@/features/programs/domain/types";
import { resolveProgramPermissions } from "@/features/programs/domain/permissions";

export type ProgramListUrlState = {
  org?: string;
  status?: ProgramStatus;
  deliveryMode?: ProgramDeliveryMode;
  q?: string;
  archived: boolean;
  sort: ProgramSortField;
  direction: ProgramSortDirection;
  page: number;
  pageSize: number;
};

export type ParsedProgramListSearchParams = {
  urlState: ProgramListUrlState;
  listInput: {
    filters: ProgramListFilters;
    pagination: ProgramPagination;
    sort: ProgramListSort;
  };
  warnings: string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SORT_FIELDS = ["name", "updated_at", "status", "created_at"] as const satisfies readonly ProgramSortField[];

const DEFAULT_SORT: ProgramSortField = "updated_at";
const DEFAULT_DIRECTION: ProgramSortDirection = "desc";

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

function parseStatus(value: string | undefined): ProgramStatus | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  if (isProgramStatus(value)) {
    return value;
  }
  return undefined;
}

function parseDeliveryMode(value: string | undefined): ProgramDeliveryMode | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  if (isProgramDeliveryMode(value)) {
    return value;
  }
  return undefined;
}

function parseSortField(value: string | undefined): ProgramSortField {
  if (value && (SORT_FIELDS as readonly string[]).includes(value)) {
    return value as ProgramSortField;
  }
  return DEFAULT_SORT;
}

function parseSortDirection(value: string | undefined): ProgramSortDirection {
  if (value === "asc") {
    return "asc";
  }
  if (value === "desc") {
    return "desc";
  }
  return DEFAULT_DIRECTION;
}

export function canViewArchivedProgramFilter(role: ProgramRole): boolean {
  return resolveProgramPermissions(role).canViewArchivedPrograms;
}

export function parseProgramListSearchParams(
  raw: Record<string, string | string[] | undefined>,
  options: { role: ProgramRole },
): ParsedProgramListSearchParams {
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

  const deliveryRaw = firstValue(raw.deliveryMode);
  const deliveryMode = parseDeliveryMode(deliveryRaw);
  if (deliveryRaw && deliveryRaw !== "all" && !deliveryMode) {
    warnings.push("invalid_delivery_mode");
  }

  const qRaw = firstValue(raw.q)?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw.slice(0, 200) : undefined;

  const archivedRequested = firstValue(raw.archived) === "true";
  const archived =
    archivedRequested && canViewArchivedProgramFilter(options.role) ? true : false;
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
    DEFAULT_PROGRAM_PAGE_SIZE,
    MAX_PROGRAM_PAGE_SIZE,
  );

  const urlState: ProgramListUrlState = {
    org,
    status,
    deliveryMode,
    q,
    archived,
    sort,
    direction,
    page,
    pageSize,
  };

  const filters: ProgramListFilters = {
    includeArchived: archived,
    search: q,
    status: status ? status : undefined,
    deliveryMode: deliveryMode ? deliveryMode : undefined,
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

export function buildProgramListQueryString(state: ProgramListUrlState): string {
  const params = new URLSearchParams();
  if (state.org) {
    params.set("org", state.org);
  }
  if (state.status) {
    params.set("status", state.status);
  }
  if (state.deliveryMode) {
    params.set("deliveryMode", state.deliveryMode);
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
  if (state.pageSize !== DEFAULT_PROGRAM_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}

export function parseProgramListReturnState(
  raw: Record<string, string | string[] | undefined>,
  role: ProgramRole,
): ProgramListUrlState {
  return parseProgramListSearchParams(raw, { role }).urlState;
}

/** Re-export status/delivery arrays for filter UI without duplicating domain constants. */
export const PROGRAM_LIST_STATUS_OPTIONS = PROGRAM_STATUSES;
export const PROGRAM_LIST_DELIVERY_OPTIONS = PROGRAM_DELIVERY_MODES;
