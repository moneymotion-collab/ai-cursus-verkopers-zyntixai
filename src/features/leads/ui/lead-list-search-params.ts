import type { LeadRole } from "@/features/leads/domain/types";
import type { LeadListFilters, LeadListSort } from "@/features/leads/domain/read-types";
import {
  DEFAULT_LEAD_PAGE_SIZE,
  MAX_LEAD_PAGE_SIZE,
} from "@/features/leads/domain/read-types";
import { LEAD_STATUSES } from "@/features/leads/domain/status";
import type { LeadStatus } from "@/features/leads/domain/types";

export const LEAD_OWNER_UNASSIGNED_VALUE = "unassigned";

export type LeadListUrlState = {
  org?: string;
  status?: LeadStatus;
  stageId?: string;
  owner?: string;
  q?: string;
  archived: boolean;
  sort: NonNullable<LeadListSort["field"]>;
  direction: NonNullable<LeadListSort["direction"]>;
  page: number;
  pageSize: number;
};

export type ParsedLeadListSearchParams = {
  urlState: LeadListUrlState;
  listInput: {
    filters: LeadListFilters;
    pagination: { page: number; pageSize: number };
    sort: LeadListSort;
  };
  warnings: string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SORT_FIELDS = ["display_name", "updated_at", "status", "created_at"] as const;

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

function parseStatus(value: string | undefined): LeadStatus | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  if ((LEAD_STATUSES as readonly string[]).includes(value)) {
    return value as LeadStatus;
  }
  return undefined;
}

function parseSortField(
  value: string | undefined,
): NonNullable<LeadListSort["field"]> {
  if (value && (SORT_FIELDS as readonly string[]).includes(value)) {
    return value as NonNullable<LeadListSort["field"]>;
  }
  return "display_name";
}

function parseSortDirection(value: string | undefined): NonNullable<LeadListSort["direction"]> {
  if (value === "desc") {
    return "desc";
  }
  return "asc";
}

export function canViewArchivedLeadFilter(role: LeadRole): boolean {
  return role === "owner" || role === "admin";
}

export function parseLeadListSearchParams(
  raw: Record<string, string | string[] | undefined>,
  options: {
    role: LeadRole;
    ownerOptions?: string[];
    stageOptions?: string[];
  },
): ParsedLeadListSearchParams {
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

  const stageRaw = firstValue(raw.stage);
  const stageId =
    stageRaw && UUID_PATTERN.test(stageRaw)
      ? options.stageOptions
        ? options.stageOptions.includes(stageRaw)
          ? stageRaw
          : undefined
        : stageRaw
      : undefined;
  if (stageRaw && !stageId) {
    warnings.push("invalid_stage");
  }

  const qRaw = firstValue(raw.q)?.trim();
  const q = qRaw && qRaw.length > 0 ? qRaw.slice(0, 200) : undefined;

  const ownerRaw = firstValue(raw.owner);
  let owner: string | undefined;
  let ownerIsUnassigned = false;
  if (ownerRaw === LEAD_OWNER_UNASSIGNED_VALUE) {
    ownerIsUnassigned = true;
    owner = LEAD_OWNER_UNASSIGNED_VALUE;
  } else if (ownerRaw && UUID_PATTERN.test(ownerRaw)) {
    if (options.ownerOptions) {
      owner = options.ownerOptions.includes(ownerRaw) ? ownerRaw : undefined;
      if (!owner) {
        warnings.push("invalid_owner");
      }
    } else {
      owner = ownerRaw;
    }
  } else if (ownerRaw) {
    warnings.push("invalid_owner");
  }

  const archivedRequested = firstValue(raw.archived) === "true";
  const archived =
    archivedRequested && canViewArchivedLeadFilter(options.role) ? true : false;
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
    DEFAULT_LEAD_PAGE_SIZE,
    MAX_LEAD_PAGE_SIZE,
  );

  const urlState: LeadListUrlState = {
    org,
    status,
    stageId,
    owner,
    q,
    archived,
    sort,
    direction,
    page,
    pageSize,
  };

  const filters: LeadListFilters = {
    includeArchived: archived,
    search: q,
    ownerIsUnassigned,
    ownerMemberId: ownerIsUnassigned ? undefined : owner,
    status: status ? status : undefined,
    stageId,
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

export function buildLeadListQueryString(state: LeadListUrlState): string {
  const params = new URLSearchParams();
  if (state.org) {
    params.set("org", state.org);
  }
  if (state.status) {
    params.set("status", state.status);
  }
  if (state.stageId) {
    params.set("stage", state.stageId);
  }
  if (state.owner) {
    params.set("owner", state.owner);
  }
  if (state.q) {
    params.set("q", state.q);
  }
  if (state.archived) {
    params.set("archived", "true");
  }
  if (state.sort !== "display_name") {
    params.set("sort", state.sort);
  }
  if (state.direction !== "asc") {
    params.set("direction", state.direction);
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== DEFAULT_LEAD_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}
