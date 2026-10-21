import type { Tables } from "@/types/database";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";

export type LeadRow = Tables<"leads">;
export type LeadPipelineStageRow = Tables<"lead_pipeline_stages">;
export type LeadStatusHistoryRow = Tables<"lead_status_history">;
export type LeadStageHistoryRow = Tables<"lead_stage_history">;

export type LeadStatus = "open" | "converted" | "lost" | "disqualified";

export type LeadHistorySource = "manual" | "system" | "import" | "conversion";

export type LeadRole = "owner" | "admin" | "staff" | "viewer";

export type LeadMutationOperation =
  | "create"
  | "update_profile"
  | "transition_stage"
  | "transition_status"
  | "convert"
  | "archive"
  | "restore";

export type LeadRefreshHints = {
  detail: boolean;
  list: boolean;
  statusHistory: boolean;
  stageHistory: boolean;
  relatedTasks: boolean;
};

export type LeadPermissionSet = {
  canViewLead: boolean;
  canViewArchivedLeads: boolean;
  canCreateLead: boolean;
  canEditLeadProfile: boolean;
  canTransitionLeadStage: boolean;
  canTransitionLeadStatus: boolean;
  canConvertLead: boolean;
  canArchiveLead: boolean;
  canRestoreLead: boolean;
  canViewStatusHistory: boolean;
  canViewStageHistory: boolean;
  canViewRelatedTasks: boolean;
};

export type LeadApplicationErrorCode =
  | "AUTH_REQUIRED"
  | "ORG_CONTEXT_MISSING"
  | "INVALID_INPUT"
  | "LEAD_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "INSUFFICIENT_ROLE"
  | "INVALID_STATE"
  | "TRANSITION_NOT_ALLOWED"
  | "ALREADY_CONVERTED"
  | "EXISTING_CUSTOMER_MATCH_REQUIRED"
  | "INVALID_OWNER"
  | "INVALID_STAGE"
  | "ARCHIVED_RECORD"
  | "CONFLICT"
  | "MUTATION_COMMITTED_REFRESH_REQUIRED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type LeadApplicationError = {
  code: LeadApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: "auth" | "permission" | "validation" | "not_found" | "conflict" | "network" | "server";
  fieldErrors?: Record<string, string>;
  cause?: string;
  refreshRequired?: boolean;
};

export type LeadReadQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: LeadApplicationError };

export type LeadRpcAdapterResult =
  | { ok: true; leadId?: string; customerId?: string }
  | { ok: false; error: LeadApplicationError };

export type LeadMutationSuccess = {
  ok: true;
  operation: LeadMutationOperation;
  leadId: string;
  lead: LeadDetailReadModel;
  customerId?: string;
  committed: true;
  refreshRequired: false;
  refreshHints: LeadRefreshHints;
};

export type LeadMutationFailure = {
  ok: false;
  operation: LeadMutationOperation;
  committed: false;
  error: LeadApplicationError;
};

export type LeadMutationCommittedRefreshFailure = {
  ok: false;
  operation: LeadMutationOperation;
  committed: true;
  leadId: string;
  customerId?: string;
  refreshHints: LeadRefreshHints;
  error: LeadApplicationError & {
    refreshRequired: true;
    retryable: false;
  };
};

export type LeadMutationResult =
  | LeadMutationSuccess
  | LeadMutationFailure
  | LeadMutationCommittedRefreshFailure;

export const EMPTY_LEAD_PERMISSIONS: LeadPermissionSet = {
  canViewLead: false,
  canViewArchivedLeads: false,
  canCreateLead: false,
  canEditLeadProfile: false,
  canTransitionLeadStage: false,
  canTransitionLeadStatus: false,
  canConvertLead: false,
  canArchiveLead: false,
  canRestoreLead: false,
  canViewStatusHistory: false,
  canViewStageHistory: false,
  canViewRelatedTasks: false,
};

export const LEAD_MUTATION_REFRESH_HINTS = {
  create: {
    detail: true,
    list: true,
    statusHistory: true,
    stageHistory: true,
    relatedTasks: false,
  },
  update_profile: {
    detail: true,
    list: true,
    statusHistory: false,
    stageHistory: false,
    relatedTasks: false,
  },
  transition_stage: {
    detail: true,
    list: true,
    statusHistory: false,
    stageHistory: true,
    relatedTasks: false,
  },
  transition_status: {
    detail: true,
    list: true,
    statusHistory: true,
    stageHistory: false,
    relatedTasks: false,
  },
  convert: {
    detail: true,
    list: true,
    statusHistory: true,
    stageHistory: false,
    relatedTasks: false,
  },
  archive: {
    detail: true,
    list: true,
    statusHistory: false,
    stageHistory: false,
    relatedTasks: false,
  },
  restore: {
    detail: true,
    list: true,
    statusHistory: false,
    stageHistory: false,
    relatedTasks: false,
  },
} as const satisfies Record<LeadMutationOperation, LeadRefreshHints>;
