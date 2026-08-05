export type AttentionItemStatus =
  | "open"
  | "acknowledged"
  | "resolved"
  | "dismissed"
  | "expired";

export type AttentionSeverity = "low" | "medium" | "high" | "critical";

export type AttentionSourceType = "enrollment";

export type AttentionSignalOrigin = "manual" | "rule";

export type AttentionRuleKey = "enrollment_no_recent_progress";

export type AttentionEventType =
  | "created"
  | "status_changed"
  | "assigned"
  | "severity_changed"
  | "signal_recorded"
  | "archived"
  | "detection_updated";

export type AttentionEventSource = "manual" | "rule" | "system";

export type AttentionRole = "owner" | "admin" | "staff" | "viewer";

export type AttentionPermissionSet = {
  canListItems: boolean;
  canViewItem: boolean;
  canViewArchivedItems: boolean;
  canCreateManualItem: boolean;
  canRecordSignal: boolean;
  canAcknowledge: boolean;
  canAssign: boolean;
  canUpdateSeverity: boolean;
  canResolve: boolean;
  canDismiss: boolean;
  canArchive: boolean;
  canEvaluateRules: boolean;
};

export type AttentionApplicationErrorCode =
  | "AUTH_REQUIRED"
  | "ORG_CONTEXT_MISSING"
  | "INVALID_INPUT"
  | "ATTENTION_ITEM_UNAVAILABLE"
  | "ENROLLMENT_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "INSUFFICIENT_ROLE"
  | "INVALID_STATE"
  | "CONFLICT"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type AttentionApplicationError = {
  code: AttentionApplicationErrorCode;
  message: string;
  retryable: boolean;
  category:
    | "auth"
    | "permission"
    | "validation"
    | "not_found"
    | "conflict"
    | "network"
    | "server";
  fieldErrors?: Record<string, string>;
  cause?: string;
  refreshRequired?: boolean;
};

export type AttentionReadQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AttentionApplicationError };

export type AttentionRpcAdapterResult<T = void> =
  | { ok: true; data?: T }
  | { ok: false; error: AttentionApplicationError };

export const EMPTY_ATTENTION_PERMISSIONS: AttentionPermissionSet = {
  canListItems: false,
  canViewItem: false,
  canViewArchivedItems: false,
  canCreateManualItem: false,
  canRecordSignal: false,
  canAcknowledge: false,
  canAssign: false,
  canUpdateSeverity: false,
  canResolve: false,
  canDismiss: false,
  canArchive: false,
  canEvaluateRules: false,
};

export type AttentionDomainErrorCode =
  | "INVALID_STATUS"
  | "INVALID_SEVERITY"
  | "INVALID_TRANSITION"
  | "TERMINAL_ITEM"
  | "ARCHIVED_ITEM"
  | "DISMISSAL_REASON_REQUIRED"
  | "RESOLUTION_REASON_REQUIRED"
  | "INVALID_SIGNAL_ORIGIN"
  | "INVALID_RULE_KEY"
  | "INVALID_SOURCE_TYPE"
  | "INVALID_EVIDENCE"
  | "INVALID_TITLE"
  | "INVALID_SUMMARY"
  | "INVALID_ASSIGNEE"
  | "INVALID_ENROLLMENT_ID"
  | "INVALID_ATTENTION_ITEM_ID"
  | "INVALID_STALE_PROGRESS_INPUT"
  | "NON_TERMINAL_NOT_ARCHIVABLE";

export type AttentionDomainError = {
  code: AttentionDomainErrorCode;
  message: string;
};

export type AttentionDomainResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: AttentionDomainError };

/** Persisted-shaped Attention Signal (immutable evidence). Column names not claimed for DB yet. */
export type AttentionSignal = {
  id: string;
  organizationId: string;
  attentionItemId: string;
  enrollmentId: string;
  signalOrigin: AttentionSignalOrigin;
  ruleKey: AttentionRuleKey | null;
  explanation: string;
  evidence: AttentionSignalEvidence;
  detectedAt: string;
  createdByMemberId: string | null;
  createdAt: string;
};

export type AttentionSignalEvidence = {
  kind: "manual_note" | "stale_progress" | "generic";
  note?: string;
  referenceOccurredAt?: string | null;
  evaluationOccurredAt?: string;
  ageCalendarDays?: number;
  citedProgressFactIds?: readonly string[];
};

/** Persisted-shaped Attention Item (operational follow-up unit). */
export type AttentionItem = {
  id: string;
  organizationId: string;
  enrollmentId: string;
  customerId: string;
  programId: string;
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
  resolvedAt: string | null;
  dismissedAt: string | null;
  expiredAt: string | null;
  resolutionReason: string | null;
  dismissalReason: string | null;
  archivedAt: string | null;
  createdByMemberId: string | null;
  updatedByMemberId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateManualAttentionItemInput = {
  enrollmentId: string;
  title: string;
  summary?: string | null;
  severity?: AttentionSeverity;
  explanation: string;
  evidenceNote?: string;
};

export type RecordRuleAttentionSignalInput = {
  enrollmentId: string;
  ruleKey: AttentionRuleKey;
  explanation: string;
  evidence: AttentionSignalEvidence;
  detectedAt: string;
};

export type AcknowledgeAttentionItemInput = {
  attentionItemId: string;
};

export type AssignAttentionItemInput = {
  attentionItemId: string;
  assigneeMemberId: string | null;
};

export type ResolveAttentionItemInput = {
  attentionItemId: string;
  resolutionReason: string;
};

export type DismissAttentionItemInput = {
  attentionItemId: string;
  dismissalReason: string;
};

export type ExpireAttentionItemInput = {
  attentionItemId: string;
  expiredAt: string;
};

export type ArchiveAttentionItemInput = {
  attentionItemId: string;
};

export type ReevaluateAttentionRulesInput = {
  organizationId: string;
  enrollmentId?: string;
};
