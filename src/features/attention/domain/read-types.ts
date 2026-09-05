import type {
  AttentionEventSource,
  AttentionEventType,
  AttentionItemStatus,
  AttentionPermissionSet,
  AttentionRole,
  AttentionRuleKey,
  AttentionSeverity,
  AttentionSignalEvidence,
  AttentionSignalOrigin,
  AttentionSourceType,
} from "@/features/attention/domain/types";

export type AttentionEnrollmentSummary = {
  id: string;
  status: string;
  archivedAt: string | null;
  customerId: string;
  programId: string;
};

export type AttentionCustomerSummary = {
  id: string;
  displayName: string;
  status: string;
  archivedAt: string | null;
};

export type AttentionProgramSummary = {
  id: string;
  name: string;
  status: string;
  archivedAt: string | null;
};

export type AttentionProjectSummary = {
  id: string;
  name: string;
  status: string;
  archivedAt: string | null;
};

export type AttentionTaskSummary = {
  id: string;
  title: string;
  status: string;
  dueAt: string | null;
};

export type AttentionWorkOrderSummary = {
  id: string;
  title: string;
  status: string;
  siteId: string;
  scheduledFor: string | null;
};

export type AttentionItemDerivedFlags = {
  isAcknowledged: boolean;
  isArchived: boolean;
  isTerminal: boolean;
  isResolved: boolean;
  isDismissed: boolean;
  isExpired: boolean;
};

export type AttentionItemListItemReadModel = {
  id: string;
  organizationId: string;
  sourceType: AttentionSourceType;
  sourceEntityId: string;
  enrollmentId: string | null;
  customerId: string | null;
  programId: string | null;
  projectId: string | null;
  taskId: string | null;
  workOrderId?: string | null;
  title: string;
  summary: string | null;
  status: AttentionItemStatus;
  severity: AttentionSeverity;
  assigneeMemberId: string | null;
  acknowledgedAt: string | null;
  isAcknowledged: boolean;
  firstDetectedAt: string;
  lastDetectedAt: string;
  detectionCount: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  dismissedAt: string | null;
  expiredAt: string | null;
  archivedAt: string | null;
  /** UTC calendar days from firstDetectedAt when safely derived by mappers. */
  ageCalendarDays?: number | null;
  customerDisplayName: string | null;
  programName: string | null;
  projectName: string | null;
  assigneeDisplayName: string | null;
  primarySignalOrigin: AttentionSignalOrigin | null;
  primaryRuleKey: AttentionRuleKey | null;
  derived: AttentionItemDerivedFlags;
};

export type AttentionSignalReadModel = {
  id: string;
  organizationId: string;
  attentionItemId: string;
  enrollmentId: string | null;
  signalOrigin: AttentionSignalOrigin;
  ruleKey: AttentionRuleKey | null;
  explanation: string;
  evidence: AttentionSignalEvidence;
  detectedAt: string;
  createdByMemberId: string | null;
  createdAt: string;
};

export type AttentionEventReadModel = {
  id: string;
  organizationId: string;
  attentionItemId: string;
  eventType: AttentionEventType;
  actorMemberId: string | null;
  createdAt: string;
  fromStatus: AttentionItemStatus | null;
  toStatus: AttentionItemStatus | null;
  fromSeverity: AttentionSeverity | null;
  toSeverity: AttentionSeverity | null;
  fromAssigneeMemberId: string | null;
  toAssigneeMemberId: string | null;
  reason: string | null;
  source: AttentionEventSource;
  /** Safe subset only; mappers may omit raw payload. */
  payload: Record<string, unknown> | null;
};

export type AttentionItemDetailReadModel = {
  id: string;
  organizationId: string;
  sourceType: AttentionSourceType;
  sourceEntityId: string;
  enrollmentId: string | null;
  customerId: string | null;
  programId: string | null;
  projectId: string | null;
  taskId: string | null;
  workOrderId?: string | null;
  socialActionHref?: string | null;
  title: string;
  summary: string | null;
  status: AttentionItemStatus;
  severity: AttentionSeverity;
  assigneeMemberId: string | null;
  dedupeKey: string;
  detectionCount: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
  acknowledgedAt: string | null;
  isAcknowledged: boolean;
  resolvedAt: string | null;
  dismissedAt: string | null;
  expiredAt: string | null;
  archivedAt: string | null;
  resolutionReason: string | null;
  dismissalReason: string | null;
  createdByMemberId: string | null;
  updatedByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
  ageCalendarDays?: number | null;
  enrollment: AttentionEnrollmentSummary | null;
  customer: AttentionCustomerSummary | null;
  program: AttentionProgramSummary | null;
  project: AttentionProjectSummary | null;
  task: AttentionTaskSummary | null;
  workOrder?: AttentionWorkOrderSummary | null;
  signals: AttentionSignalReadModel[];
  events: AttentionEventReadModel[];
  derived: AttentionItemDerivedFlags;
};

export type AttentionListFilters = {
  status?: AttentionItemStatus | AttentionItemStatus[];
  severity?: AttentionSeverity | AttentionSeverity[];
  assigneeMemberId?: string | null;
  enrollmentId?: string;
  customerId?: string;
  programId?: string;
  projectId?: string;
  acknowledged?: boolean;
  includeArchived?: boolean;
  createdFrom?: string;
  createdTo?: string;
  updatedFrom?: string;
  updatedTo?: string;
};

export type AttentionSortField =
  | "created_at"
  | "updated_at"
  | "severity"
  | "last_detected_at";

export type AttentionSortDirection = "asc" | "desc";

export type AttentionListSort = {
  field?: AttentionSortField;
  direction?: AttentionSortDirection;
};

export type AttentionPagination = {
  page?: number;
  pageSize?: number;
};

export type AttentionPaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type AttentionPaginatedResult<T> = {
  items: T[];
  pagination: AttentionPaginationMeta;
};

export type AttentionListReadResult =
  AttentionPaginatedResult<AttentionItemListItemReadModel>;

export type AttentionListLoaderResult = {
  organizationId: string;
  role: AttentionRole;
  capabilities: AttentionPermissionSet;
  filters: Required<Pick<AttentionListFilters, "includeArchived">> &
    AttentionListFilters;
  sort: { field: AttentionSortField; direction: AttentionSortDirection };
  result: AttentionListReadResult;
};

export type AttentionDetailLoaderResult = {
  organizationId: string;
  role: AttentionRole;
  capabilities: AttentionPermissionSet;
  item: AttentionItemDetailReadModel;
};

export const DEFAULT_ATTENTION_PAGE_SIZE = 25;
export const MAX_ATTENTION_PAGE_SIZE = 100;
