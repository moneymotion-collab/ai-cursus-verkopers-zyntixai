import type {
  ProgramDeliveryMode,
  ProgramPermissionSet,
  ProgramRole,
  ProgramStatus,
} from "@/features/programs/domain/types";

export type ProgramDerivedFlags = {
  isArchived: boolean;
};

export type ProgramListItemReadModel = {
  id: string;
  organizationId: string;
  name: string;
  status: ProgramStatus;
  statusLabel: string;
  deliveryMode: ProgramDeliveryMode;
  deliveryModeLabel: string;
  openEnrollmentCount: number;
  updatedAt: string;
  createdAt: string;
  archivedAt: string | null;
  derived: ProgramDerivedFlags;
};

export type ProgramDetailReadModel = {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: ProgramStatus;
  statusLabel: string;
  deliveryMode: ProgramDeliveryMode;
  deliveryModeLabel: string;
  createdByMemberId: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  openEnrollmentCount: number;
  derived: ProgramDerivedFlags & {
    allowedTransitions: ProgramStatus[];
  };
};

export type ProgramStatusHistoryEntry = {
  id: string;
  organizationId: string;
  programId: string;
  fromStatus: ProgramStatus | null;
  toStatus: ProgramStatus;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  changedByMemberId: string | null;
  reason: string | null;
  source: string;
  changedAt: string;
};

export type ProgramListFilters = {
  status?: ProgramStatus | ProgramStatus[];
  deliveryMode?: ProgramDeliveryMode | ProgramDeliveryMode[];
  includeArchived?: boolean;
  search?: string;
};

export type ProgramSortField = "name" | "updated_at" | "status" | "created_at";
export type ProgramSortDirection = "asc" | "desc";

export type ProgramListSort = {
  field?: ProgramSortField;
  direction?: ProgramSortDirection;
};

export type ProgramPagination = {
  page?: number;
  pageSize?: number;
};

export type ProgramPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type ProgramPaginatedResult<T> = {
  items: T[];
  pagination: ProgramPaginationMeta;
};

export type ProgramListReadResult = ProgramPaginatedResult<ProgramListItemReadModel>;

export type ProgramListLoaderResult = {
  organizationId: string;
  role: ProgramRole;
  capabilities: ProgramPermissionSet;
  filters: Required<Pick<ProgramListFilters, "includeArchived">> & ProgramListFilters;
  sort: { field: ProgramSortField; direction: ProgramSortDirection };
  result: ProgramListReadResult;
};

export type ProgramDetailLoaderResult = {
  organizationId: string;
  role: ProgramRole;
  capabilities: ProgramPermissionSet;
  program: ProgramDetailReadModel;
  history: ProgramStatusHistoryEntry[];
};

export const DEFAULT_PROGRAM_PAGE_SIZE = 25;
export const MAX_PROGRAM_PAGE_SIZE = 100;
export const MAX_PROGRAM_HISTORY_ENTRIES = 100;
