import type { Tables, Json } from "@/types/database";
import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";

export type EnrollmentRow = Tables<"enrollments">;
export type EnrollmentStatusHistoryRow = Tables<"enrollment_status_history">;

/** Exact CHECK-constrained lifecycle values from public.enrollments.status. */
export type EnrollmentStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "cancelled";

/** Exact CHECK-constrained source values from public.enrollments.source. */
export type EnrollmentSource =
  | "manual"
  | "lead_conversion"
  | "import"
  | "integration"
  | "system";

/** Public create RPC accepts only manual. */
export type EnrollmentCreateSource = "manual";

/** Initial status values accepted by create_enrollment. */
export type EnrollmentInitialStatus = "pending" | "active";

export type EnrollmentRole = "owner" | "admin" | "staff" | "viewer";

export type EnrollmentMutationOperation =
  | "create"
  | "update_owner_metadata"
  | "transition_status"
  | "archive"
  | "restore";

export type EnrollmentRefreshHints = {
  detail: boolean;
  list: boolean;
  history: boolean;
};

export type EnrollmentPermissionSet = {
  canListEnrollments: boolean;
  canViewEnrollment: boolean;
  canViewArchivedEnrollments: boolean;
  canCreateEnrollment: boolean;
  canUpdateOwnerOrMetadata: boolean;
  canTransitionEnrollmentStatus: boolean;
  canArchiveEnrollment: boolean;
  canRestoreEnrollment: boolean;
  canViewEnrollmentHistory: boolean;
};

export type EnrollmentApplicationErrorCode =
  | "AUTH_REQUIRED"
  | "ORG_CONTEXT_MISSING"
  | "INVALID_INPUT"
  | "ENROLLMENT_UNAVAILABLE"
  | "CUSTOMER_UNAVAILABLE"
  | "PROGRAM_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "INSUFFICIENT_ROLE"
  | "INVALID_STATE"
  | "INVALID_STATUS"
  | "INVALID_SOURCE"
  | "TRANSITION_NOT_ALLOWED"
  | "DUPLICATE_OPEN_ENROLLMENT"
  | "CUSTOMER_NOT_ELIGIBLE"
  | "PROGRAM_NOT_ELIGIBLE"
  | "INVALID_OWNER"
  | "ARCHIVE_REQUIRES_TERMINAL"
  | "ARCHIVED_RECORD"
  | "NOT_ARCHIVED"
  | "CONFLICT"
  | "MUTATION_COMMITTED_REFRESH_REQUIRED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type EnrollmentApplicationError = {
  code: EnrollmentApplicationErrorCode;
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

export type EnrollmentReadQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: EnrollmentApplicationError };

export type EnrollmentRpcAdapterResult =
  | { ok: true; enrollmentId?: string }
  | { ok: false; error: EnrollmentApplicationError };

export type EnrollmentMutationSuccess = {
  ok: true;
  operation: EnrollmentMutationOperation;
  enrollmentId: string;
  enrollment: EnrollmentDetailReadModel;
  committed: true;
  refreshRequired: false;
  refreshHints: EnrollmentRefreshHints;
};

export type EnrollmentMutationFailure = {
  ok: false;
  operation: EnrollmentMutationOperation;
  committed: false;
  error: EnrollmentApplicationError;
};

export type EnrollmentMutationCommittedRefreshFailure = {
  ok: false;
  operation: EnrollmentMutationOperation;
  committed: true;
  enrollmentId: string;
  refreshHints: EnrollmentRefreshHints;
  error: EnrollmentApplicationError & {
    refreshRequired: true;
    retryable: false;
  };
};

export type EnrollmentMutationResult =
  | EnrollmentMutationSuccess
  | EnrollmentMutationFailure
  | EnrollmentMutationCommittedRefreshFailure;

export const EMPTY_ENROLLMENT_PERMISSIONS: EnrollmentPermissionSet = {
  canListEnrollments: false,
  canViewEnrollment: false,
  canViewArchivedEnrollments: false,
  canCreateEnrollment: false,
  canUpdateOwnerOrMetadata: false,
  canTransitionEnrollmentStatus: false,
  canArchiveEnrollment: false,
  canRestoreEnrollment: false,
  canViewEnrollmentHistory: false,
};

export const ENROLLMENT_MUTATION_REFRESH_HINTS = {
  create: { detail: true, list: true, history: true },
  update_owner_metadata: { detail: true, list: true, history: false },
  transition_status: { detail: true, list: true, history: true },
  archive: { detail: true, list: true, history: false },
  restore: { detail: true, list: true, history: false },
} as const satisfies Record<EnrollmentMutationOperation, EnrollmentRefreshHints>;

export type EnrollmentMetadata = Json;
