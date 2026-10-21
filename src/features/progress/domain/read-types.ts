import type {
  ProgressFactSource,
  ProgressFactType,
  ProgressPermissionSet,
  ProgressRole,
} from "@/features/progress/domain/types";

export type ProgressFactDerivedFlags = {
  isVoided: boolean;
  isCorrection: boolean;
  isManual: boolean;
  hasActiveLineagePredecessor: boolean;
};

export type ProgressEnrollmentSummary = {
  id: string;
  status: string;
  archivedAt: string | null;
  customerId: string;
  programId: string;
};

export type ProgressCustomerSummary = {
  id: string;
  displayName: string;
  status: string;
  archivedAt: string | null;
};

export type ProgressProgramSummary = {
  id: string;
  name: string;
  status: string;
  archivedAt: string | null;
};

export type ProgressFactListItemReadModel = {
  id: string;
  organizationId: string;
  enrollmentId: string;
  customerId: string;
  programId: string;
  factType: ProgressFactType;
  factTypeLabel: string;
  source: ProgressFactSource;
  sourceLabel: string;
  title: string | null;
  occurredAt: string;
  recordedAt: string;
  recordedByMemberId: string;
  voidedAt: string | null;
  customerDisplayName: string | null;
  programName: string | null;
  derived: ProgressFactDerivedFlags;
};

export type ProgressFactDetailReadModel = {
  id: string;
  organizationId: string;
  enrollmentId: string;
  customerId: string;
  programId: string;
  factType: ProgressFactType;
  factTypeLabel: string;
  source: ProgressFactSource;
  sourceLabel: string;
  title: string | null;
  description: string | null;
  numericValue: number | null;
  numericUnit: string | null;
  isComplete: boolean | null;
  sequenceNumber: number | null;
  idempotencyKey: string | null;
  correctedFromFactId: string | null;
  occurredAt: string;
  recordedAt: string;
  recordedByMemberId: string;
  voidedAt: string | null;
  voidedByMemberId: string | null;
  voidReason: string | null;
  enrollment: ProgressEnrollmentSummary | null;
  customer: ProgressCustomerSummary | null;
  program: ProgressProgramSummary | null;
  derived: ProgressFactDerivedFlags;
};

export type ProgressListFilters = {
  factType?: ProgressFactType | ProgressFactType[];
  enrollmentId?: string;
  customerId?: string;
  programId?: string;
  includeVoided?: boolean;
  search?: string;
};

export type ProgressSortField = "occurred_at" | "recorded_at" | "fact_type";
export type ProgressSortDirection = "asc" | "desc";

export type ProgressListSort = {
  field?: ProgressSortField;
  direction?: ProgressSortDirection;
};

export type ProgressPagination = {
  page?: number;
  pageSize?: number;
};

export type ProgressPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ProgressPaginatedResult<T> = {
  items: T[];
  pagination: ProgressPaginationMeta;
};

export type ProgressListReadResult =
  ProgressPaginatedResult<ProgressFactListItemReadModel>;

export type ProgressListLoaderResult = {
  organizationId: string;
  role: ProgressRole;
  capabilities: ProgressPermissionSet;
  filters: Required<Pick<ProgressListFilters, "includeVoided">> &
    ProgressListFilters;
  sort: { field: ProgressSortField; direction: ProgressSortDirection };
  result: ProgressListReadResult;
};

export type ProgressDetailLoaderResult = {
  organizationId: string;
  role: ProgressRole;
  capabilities: ProgressPermissionSet;
  fact: ProgressFactDetailReadModel;
};

export const DEFAULT_PROGRESS_PAGE_SIZE = 25;
export const MAX_PROGRESS_PAGE_SIZE = 100;
