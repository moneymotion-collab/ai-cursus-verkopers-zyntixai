import type { Tables } from "@/types/database";
import type { ProgressFactDetailReadModel } from "@/features/progress/domain/read-types";

export type ProgressFactRow = Tables<"enrollment_progress_facts">;

/** Exact CHECK-constrained fact_type values from public.enrollment_progress_facts. */
export type ProgressFactType =
  | "milestone_reached"
  | "unit_completed"
  | "session_attended"
  | "assessment_completed"
  | "manual_observation";

/** Exact CHECK-constrained source values from public.enrollment_progress_facts. */
export type ProgressFactSource = "manual" | "correction";

/** Enrollment statuses that interact with Progress mutation RPCs. */
export type ProgressEnrollmentStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

export type ProgressRole = "owner" | "admin" | "staff" | "viewer";

export type ProgressMutationOperation = "record" | "correct" | "void";

export type ProgressRefreshHints = {
  detail: boolean;
  list: boolean;
};

export type ProgressPermissionSet = {
  canListFacts: boolean;
  canViewFact: boolean;
  canViewVoidedFacts: boolean;
  canRecordManualFact: boolean;
  canCorrectFact: boolean;
  canVoidFact: boolean;
};

export type ProgressApplicationErrorCode =
  | "AUTH_REQUIRED"
  | "ORG_CONTEXT_MISSING"
  | "INVALID_INPUT"
  | "PROGRESS_FACT_UNAVAILABLE"
  | "ENROLLMENT_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "INSUFFICIENT_ROLE"
  | "INVALID_STATE"
  | "INVALID_FACT_TYPE"
  | "INVALID_PAYLOAD"
  | "IDEMPOTENCY_CONFLICT"
  | "CORRECTION_NOT_ALLOWED"
  | "ALREADY_VOIDED"
  | "ENROLLMENT_STATUS_BLOCKS_PROGRESS"
  | "ARCHIVED_RECORD"
  | "CONFLICT"
  | "MUTATION_COMMITTED_REFRESH_REQUIRED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type ProgressApplicationError = {
  code: ProgressApplicationErrorCode;
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

export type ProgressReadQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ProgressApplicationError };

export type ProgressRpcAdapterResult =
  | { ok: true; progressFactId?: string }
  | { ok: false; error: ProgressApplicationError };

export type ProgressMutationSuccess = {
  ok: true;
  operation: ProgressMutationOperation;
  progressFactId: string;
  fact: ProgressFactDetailReadModel;
  committed: true;
  refreshRequired: false;
  refreshHints: ProgressRefreshHints;
};

export type ProgressMutationFailure = {
  ok: false;
  operation: ProgressMutationOperation;
  committed: false;
  error: ProgressApplicationError;
};

export type ProgressMutationCommittedRefreshFailure = {
  ok: false;
  operation: ProgressMutationOperation;
  committed: true;
  progressFactId: string;
  refreshHints: ProgressRefreshHints;
  error: ProgressApplicationError & {
    refreshRequired: true;
    retryable: false;
  };
};

export type ProgressMutationResult =
  | ProgressMutationSuccess
  | ProgressMutationFailure
  | ProgressMutationCommittedRefreshFailure;

export const EMPTY_PROGRESS_PERMISSIONS: ProgressPermissionSet = {
  canListFacts: false,
  canViewFact: false,
  canViewVoidedFacts: false,
  canRecordManualFact: false,
  canCorrectFact: false,
  canVoidFact: false,
};

export const PROGRESS_MUTATION_REFRESH_HINTS = {
  record: { detail: true, list: true },
  correct: { detail: true, list: true },
  void: { detail: true, list: true },
} as const satisfies Record<ProgressMutationOperation, ProgressRefreshHints>;
