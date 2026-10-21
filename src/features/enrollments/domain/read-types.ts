import type {
  EnrollmentPermissionSet,
  EnrollmentRole,
  EnrollmentStatus,
} from "@/features/enrollments/domain/types";

export type EnrollmentDerivedFlags = {
  isArchived: boolean;
  isOpen: boolean;
  isTerminal: boolean;
};

export type EnrollmentCustomerSummary = {
  id: string;
  displayName: string;
  status: string;
  archivedAt: string | null;
};

export type EnrollmentProgramSummary = {
  id: string;
  name: string;
  status: string;
  archivedAt: string | null;
};

export type EnrollmentListItemReadModel = {
  id: string;
  organizationId: string;
  customerId: string;
  programId: string;
  customerDisplayName: string | null;
  programName: string | null;
  status: EnrollmentStatus;
  statusLabel: string;
  ownerMemberId: string | null;
  enrolledAt: string;
  updatedAt: string;
  archivedAt: string | null;
  derived: EnrollmentDerivedFlags;
};

export type EnrollmentDetailReadModel = {
  id: string;
  organizationId: string;
  customerId: string;
  programId: string;
  status: EnrollmentStatus;
  statusLabel: string;
  ownerMemberId: string | null;
  createdByMemberId: string;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  source: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  customer: EnrollmentCustomerSummary | null;
  program: EnrollmentProgramSummary | null;
  derived: EnrollmentDerivedFlags & {
    allowedTransitions: EnrollmentStatus[];
  };
};

export type EnrollmentStatusHistoryEntry = {
  id: string;
  organizationId: string;
  enrollmentId: string;
  fromStatus: EnrollmentStatus | null;
  toStatus: EnrollmentStatus;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  changedByMemberId: string | null;
  reason: string | null;
  source: string;
  changedAt: string;
};

export type EnrollmentListFilters = {
  status?: EnrollmentStatus | EnrollmentStatus[];
  customerId?: string;
  programId?: string;
  ownerMemberId?: string;
  includeArchived?: boolean;
  search?: string;
};

export type EnrollmentSortField =
  | "enrolled_at"
  | "updated_at"
  | "status"
  | "created_at";
export type EnrollmentSortDirection = "asc" | "desc";

export type EnrollmentListSort = {
  field?: EnrollmentSortField;
  direction?: EnrollmentSortDirection;
};

export type EnrollmentPagination = {
  page?: number;
  pageSize?: number;
};

export type EnrollmentPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type EnrollmentPaginatedResult<T> = {
  items: T[];
  pagination: EnrollmentPaginationMeta;
};

export type EnrollmentListReadResult =
  EnrollmentPaginatedResult<EnrollmentListItemReadModel>;

export type EnrollmentListLoaderResult = {
  organizationId: string;
  role: EnrollmentRole;
  capabilities: EnrollmentPermissionSet;
  filters: Required<Pick<EnrollmentListFilters, "includeArchived">> &
    EnrollmentListFilters;
  sort: { field: EnrollmentSortField; direction: EnrollmentSortDirection };
  result: EnrollmentListReadResult;
};

export type EnrollmentHistoryLoadState =
  | { kind: "ready" }
  | { kind: "empty" }
  | { kind: "error"; message: string }
  | { kind: "hidden" };

export type EnrollmentDetailLoaderResult = {
  organizationId: string;
  role: EnrollmentRole;
  capabilities: EnrollmentPermissionSet;
  enrollment: EnrollmentDetailReadModel;
  history: EnrollmentStatusHistoryEntry[];
  historyState: EnrollmentHistoryLoadState;
};

export const DEFAULT_ENROLLMENT_PAGE_SIZE = 25;
export const MAX_ENROLLMENT_PAGE_SIZE = 100;
export const MAX_ENROLLMENT_HISTORY_ENTRIES = 100;
