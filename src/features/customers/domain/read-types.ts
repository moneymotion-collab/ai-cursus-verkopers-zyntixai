import type { CustomerStatus } from "@/features/customers/domain/types";

export type CustomerDerivedFlags = {
  isArchived: boolean;
};

export type CustomerOwnerSummary = {
  memberId: string | null;
  displayLabel: string;
};

export type CustomerListItemReadModel = {
  id: string;
  organizationId: string;
  displayName: string;
  status: CustomerStatus;
  statusLabel: string;
  email: string | null;
  ownerMemberId: string | null;
  ownerLabel: string;
  startedAt: string;
  updatedAt: string;
  archivedAt: string | null;
  derived: CustomerDerivedFlags;
};

export type CustomerDetailReadModel = {
  id: string;
  organizationId: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: CustomerStatus;
  statusLabel: string;
  ownerMemberId: string | null;
  ownerLabel: string;
  createdByMemberId: string | null;
  createdByLabel: string;
  startedAt: string;
  endedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  derived: CustomerDerivedFlags & {
    allowedTransitions: CustomerStatus[];
  };
};

export type CustomerStatusHistoryEntry = {
  id: string;
  organizationId: string;
  customerId: string;
  fromStatus: CustomerStatus | null;
  toStatus: CustomerStatus;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  changedByMemberId: string | null;
  changedByLabel: string;
  reason: string | null;
  source: string;
  changedAt: string;
};

export type CustomerEnrollmentSummary = {
  enrollmentId: string;
  programId: string;
  programName: string;
  status: string;
  statusLabel: string;
  enrolledAt: string;
};

export type CustomerListFilters = {
  status?: CustomerStatus | CustomerStatus[];
  includeArchived?: boolean;
  ownerMemberId?: string;
  ownerIsUnassigned?: boolean;
  search?: string;
};

export type CustomerSortField = "display_name" | "updated_at" | "status" | "started_at";
export type CustomerSortDirection = "asc" | "desc";

export type CustomerListSort = {
  field?: CustomerSortField;
  direction?: CustomerSortDirection;
};

export type CustomerPagination = {
  page?: number;
  pageSize?: number;
};

export type CustomerPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type CustomerPaginatedResult<T> = {
  items: T[];
  pagination: CustomerPaginationMeta;
};

export type CustomerListReadResult = CustomerPaginatedResult<CustomerListItemReadModel>;

export const DEFAULT_CUSTOMER_PAGE_SIZE = 25;
export const MAX_CUSTOMER_PAGE_SIZE = 100;
export const MAX_CUSTOMER_ENROLLMENT_SUMMARIES = 20;
