import type { CustomerRole } from "@/features/customers/domain/types";
import type {
  CustomerListFilters,
  CustomerListSort,
  CustomerPagination,
} from "@/features/customers/domain/read-types";
import {
  DEFAULT_CUSTOMER_PAGE_SIZE,
  MAX_CUSTOMER_PAGE_SIZE,
} from "@/features/customers/domain/read-types";
import { CUSTOMER_STATUSES } from "@/features/customers/domain/status";
import type { CustomerStatus } from "@/features/customers/domain/types";

export const CUSTOMER_OWNER_UNASSIGNED_VALUE = "unassigned";

export type CustomerListUrlState = {
  org?: string;
  status?: CustomerStatus;
  owner?: string;
  q?: string;
  archived: boolean;
  sort: CustomerListSort["field"];
  direction: CustomerListSort["direction"];
  page: number;
  pageSize: number;
};

export type ParsedCustomerListSearchParams = {
  urlState: CustomerListUrlState;
  listInput: {
    filters: CustomerListFilters;
    pagination: CustomerPagination;
    sort: CustomerListSort;
  };
  warnings: string[];
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SORT_FIELDS = ["display_name", "updated_at", "status", "started_at"] as const;

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

function parseStatus(value: string | undefined): CustomerStatus | undefined {
  if (!value || value === "all") {
    return undefined;
  }
  if ((CUSTOMER_STATUSES as readonly string[]).includes(value)) {
    return value as CustomerStatus;
  }
  return undefined;
}

function parseSortField(
  value: string | undefined,
): NonNullable<CustomerListSort["field"]> {
  if (value && (SORT_FIELDS as readonly string[]).includes(value)) {
    return value as NonNullable<CustomerListSort["field"]>;
  }
  return "display_name";
}

function parseSortDirection(value: string | undefined): NonNullable<CustomerListSort["direction"]> {
  if (value === "desc") {
    return "desc";
  }
  return "asc";
}

export function canViewArchivedCustomerFilter(role: CustomerRole): boolean {
  return role === "owner" || role === "admin";
}

export function parseCustomerListSearchParams(
  raw: Record<string, string | string[] | undefined>,
  options: { role: CustomerRole; ownerOptions?: string[] },
): ParsedCustomerListSearchParams {
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

  const ownerRaw = firstValue(raw.owner);
  let owner: string | undefined;
  let ownerIsUnassigned = false;
  if (ownerRaw === CUSTOMER_OWNER_UNASSIGNED_VALUE) {
    ownerIsUnassigned = true;
    owner = CUSTOMER_OWNER_UNASSIGNED_VALUE;
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
    archivedRequested && canViewArchivedCustomerFilter(options.role) ? true : false;
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
    DEFAULT_CUSTOMER_PAGE_SIZE,
    MAX_CUSTOMER_PAGE_SIZE,
  );

  const urlState: CustomerListUrlState = {
    org,
    status,
    owner,
    q,
    archived,
    sort,
    direction,
    page,
    pageSize,
  };

  const filters: CustomerListFilters = {
    includeArchived: archived,
    search: q,
    ownerIsUnassigned,
    ownerMemberId: ownerIsUnassigned ? undefined : owner,
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

export function buildCustomerListQueryString(state: CustomerListUrlState): string {
  const params = new URLSearchParams();
  if (state.org) {
    params.set("org", state.org);
  }
  if (state.status) {
    params.set("status", state.status);
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
    params.set("sort", state.sort ?? "display_name");
  }
  if (state.direction !== "asc") {
    params.set("direction", state.direction ?? "asc");
  }
  if (state.page > 1) {
    params.set("page", String(state.page));
  }
  if (state.pageSize !== DEFAULT_CUSTOMER_PAGE_SIZE) {
    params.set("pageSize", String(state.pageSize));
  }
  const query = params.toString();
  return query.length > 0 ? `?${query}` : "";
}
