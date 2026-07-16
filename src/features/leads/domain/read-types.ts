import type { LeadStatus } from "@/features/leads/domain/types";
import type { LeadPipelineStageCategory } from "@/features/leads/domain/pipeline-stage";

export type LeadDerivedFlags = {
  isArchived: boolean;
  isConverted: boolean;
  isConvertible: boolean;
};

export type LeadOwnerSummary = {
  memberId: string | null;
  displayLabel: string;
};

export type LeadStageSummary = {
  stageId: string;
  name: string;
  position: number;
  stageCategory: LeadPipelineStageCategory;
  stageCategoryLabel: string;
  isDefault: boolean;
};

export type LeadConvertedCustomerSummary = {
  customerId: string;
  displayLabel: string;
  convertedAt: string;
  /** True when the linked customer row is archived; false when active or unavailable. */
  isArchived: boolean;
};

export type LeadListItemReadModel = {
  id: string;
  organizationId: string;
  displayName: string;
  status: LeadStatus;
  statusLabel: string;
  email: string | null;
  ownerMemberId: string | null;
  ownerLabel: string;
  stageId: string;
  stageName: string;
  stageCategory: LeadPipelineStageCategory;
  stageCategoryLabel: string;
  sourceType: string;
  pursuitLabel: string | null;
  convertedCustomerId: string | null;
  convertedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  derived: LeadDerivedFlags;
};

export type LeadDetailReadModel = {
  id: string;
  organizationId: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  statusLabel: string;
  ownerMemberId: string | null;
  ownerLabel: string;
  createdByMemberId: string | null;
  createdByLabel: string;
  stage: LeadStageSummary;
  sourceType: string;
  sourceDetail: string | null;
  pursuitLabel: string | null;
  convertedCustomer: LeadConvertedCustomerSummary | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  derived: LeadDerivedFlags & {
    allowedStatusTransitions: LeadStatus[];
  };
};

export type LeadStatusHistoryEntry = {
  id: string;
  organizationId: string;
  leadId: string;
  fromStatus: LeadStatus | null;
  toStatus: LeadStatus;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  changedByMemberId: string | null;
  changedByLabel: string;
  reason: string | null;
  source: string;
  changedAt: string;
};

export type LeadStageHistoryEntry = {
  id: string;
  organizationId: string;
  leadId: string;
  fromStageId: string | null;
  toStageId: string;
  fromStageName: string | null;
  toStageName: string;
  changedByMemberId: string | null;
  changedByLabel: string;
  reason: string | null;
  source: string;
  changedAt: string;
};

export type LeadListFilters = {
  status?: LeadStatus | LeadStatus[];
  stageId?: string;
  includeArchived?: boolean;
  ownerMemberId?: string;
  ownerIsUnassigned?: boolean;
  search?: string;
};

export type LeadSortField = "display_name" | "updated_at" | "status" | "created_at";
export type LeadSortDirection = "asc" | "desc";

export type LeadListSort = {
  field?: LeadSortField;
  direction?: LeadSortDirection;
};

export type LeadPagination = {
  page?: number;
  pageSize?: number;
};

export type LeadPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type LeadPaginatedResult<T> = {
  items: T[];
  pagination: LeadPaginationMeta;
};

export type LeadListReadResult = LeadPaginatedResult<LeadListItemReadModel>;

export const DEFAULT_LEAD_PAGE_SIZE = 25;
export const MAX_LEAD_PAGE_SIZE = 100;
