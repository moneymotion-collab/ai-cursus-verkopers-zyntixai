import type { Tables, Json } from "@/types/database";
import type { ProgramDetailReadModel } from "@/features/programs/domain/read-types";

export type ProgramRow = Tables<"programs">;
export type ProgramStatusHistoryRow = Tables<"program_status_history">;

export type ProgramStatus = "draft" | "active" | "paused" | "retired";

export type ProgramDeliveryMode =
  | "self_paced"
  | "cohort"
  | "group_coaching"
  | "one_to_one"
  | "membership"
  | "hybrid";

export type ProgramRole = "owner" | "admin" | "staff" | "viewer";

export type ProgramMutationOperation =
  | "create"
  | "update"
  | "transition_status"
  | "archive"
  | "restore";

export type ProgramRefreshHints = {
  detail: boolean;
  list: boolean;
  history: boolean;
};

export type ProgramPermissionSet = {
  canListPrograms: boolean;
  canViewProgram: boolean;
  canViewArchivedPrograms: boolean;
  canCreateProgram: boolean;
  canUpdateProgram: boolean;
  canTransitionProgramStatus: boolean;
  canArchiveProgram: boolean;
  canRestoreProgram: boolean;
  canViewProgramHistory: boolean;
};

export type ProgramApplicationErrorCode =
  | "AUTH_REQUIRED"
  | "ORG_CONTEXT_MISSING"
  | "INVALID_INPUT"
  | "PROGRAM_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "INSUFFICIENT_ROLE"
  | "INVALID_STATE"
  | "INVALID_STATUS"
  | "INVALID_DELIVERY_MODE"
  | "TRANSITION_NOT_ALLOWED"
  | "DUPLICATE_PROGRAM"
  | "ARCHIVE_BLOCKED_OPEN_ENROLLMENTS"
  | "ARCHIVED_RECORD"
  | "NOT_ARCHIVED"
  | "CONFLICT"
  | "MUTATION_COMMITTED_REFRESH_REQUIRED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type ProgramApplicationError = {
  code: ProgramApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: "auth" | "permission" | "validation" | "not_found" | "conflict" | "network" | "server";
  fieldErrors?: Record<string, string>;
  cause?: string;
  refreshRequired?: boolean;
};

export type ProgramReadQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ProgramApplicationError };

export type ProgramRpcAdapterResult =
  | { ok: true; programId?: string }
  | { ok: false; error: ProgramApplicationError };

export type ProgramMutationSuccess = {
  ok: true;
  operation: ProgramMutationOperation;
  programId: string;
  program: ProgramDetailReadModel;
  committed: true;
  refreshRequired: false;
  refreshHints: ProgramRefreshHints;
};

export type ProgramMutationFailure = {
  ok: false;
  operation: ProgramMutationOperation;
  committed: false;
  error: ProgramApplicationError;
};

export type ProgramMutationCommittedRefreshFailure = {
  ok: false;
  operation: ProgramMutationOperation;
  committed: true;
  programId: string;
  refreshHints: ProgramRefreshHints;
  error: ProgramApplicationError & {
    refreshRequired: true;
    retryable: false;
  };
};

export type ProgramMutationResult =
  | ProgramMutationSuccess
  | ProgramMutationFailure
  | ProgramMutationCommittedRefreshFailure;

export const EMPTY_PROGRAM_PERMISSIONS: ProgramPermissionSet = {
  canListPrograms: false,
  canViewProgram: false,
  canViewArchivedPrograms: false,
  canCreateProgram: false,
  canUpdateProgram: false,
  canTransitionProgramStatus: false,
  canArchiveProgram: false,
  canRestoreProgram: false,
  canViewProgramHistory: false,
};

export const PROGRAM_MUTATION_REFRESH_HINTS = {
  create: { detail: true, list: true, history: true },
  update: { detail: true, list: true, history: false },
  transition_status: { detail: true, list: true, history: true },
  archive: { detail: true, list: true, history: false },
  restore: { detail: true, list: true, history: false },
} as const satisfies Record<ProgramMutationOperation, ProgramRefreshHints>;

/** Re-export Json for metadata typing at domain boundary. */
export type ProgramMetadata = Json;
