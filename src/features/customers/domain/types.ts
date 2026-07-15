import type { Tables } from "@/types/database";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";

export type CustomerRow = Tables<"customers">;
export type CustomerStatusHistoryRow = Tables<"customer_status_history">;
export type EnrollmentRow = Tables<"enrollments">;

export type CustomerStatus =
  | "onboarding"
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "churned";

export type CustomerRole = "owner" | "admin" | "staff" | "viewer";

export type CustomerMutationOperation =
  | "create"
  | "update_profile"
  | "transition_status"
  | "archive"
  | "restore";

export type CustomerRefreshHints = {
  detail: boolean;
  list: boolean;
  history: boolean;
  relatedTasks: boolean;
};

export type CustomerPermissionSet = {
  canViewCustomer: boolean;
  canViewArchivedCustomers: boolean;
  canCreateCustomer: boolean;
  canEditCustomer: boolean;
  canTransitionCustomer: boolean;
  canArchiveCustomer: boolean;
  canRestoreCustomer: boolean;
  canViewStatusHistory: boolean;
  canViewRelatedTasks: boolean;
  canViewEnrollmentSummary: boolean;
};

export type CustomerApplicationErrorCode =
  | "AUTH_REQUIRED"
  | "ORG_CONTEXT_MISSING"
  | "INVALID_INPUT"
  | "CUSTOMER_UNAVAILABLE"
  | "PERMISSION_DENIED"
  | "INSUFFICIENT_ROLE"
  | "INVALID_STATE"
  | "TRANSITION_NOT_ALLOWED"
  | "DUPLICATE_CUSTOMER"
  | "INVALID_OWNER"
  | "ARCHIVED_RECORD"
  | "CONFLICT"
  | "MUTATION_COMMITTED_REFRESH_REQUIRED"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "RATE_LIMITED"
  | "DATABASE_UNAVAILABLE"
  | "UNEXPECTED_ERROR";

export type CustomerApplicationError = {
  code: CustomerApplicationErrorCode;
  message: string;
  retryable: boolean;
  category: "auth" | "permission" | "validation" | "not_found" | "conflict" | "network" | "server";
  fieldErrors?: Record<string, string>;
  cause?: string;
  refreshRequired?: boolean;
};

export type CustomerReadQueryResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: CustomerApplicationError };

export type CustomerRpcAdapterResult =
  | { ok: true; customerId?: string }
  | { ok: false; error: CustomerApplicationError };

export type CustomerMutationSuccess = {
  ok: true;
  operation: CustomerMutationOperation;
  customerId: string;
  customer: CustomerDetailReadModel;
  committed: true;
  refreshRequired: false;
  refreshHints: CustomerRefreshHints;
};

export type CustomerMutationFailure = {
  ok: false;
  operation: CustomerMutationOperation;
  committed: false;
  error: CustomerApplicationError;
};

export type CustomerMutationCommittedRefreshFailure = {
  ok: false;
  operation: CustomerMutationOperation;
  committed: true;
  customerId: string;
  refreshHints: CustomerRefreshHints;
  error: CustomerApplicationError & {
    refreshRequired: true;
    retryable: false;
  };
};

export type CustomerMutationResult =
  | CustomerMutationSuccess
  | CustomerMutationFailure
  | CustomerMutationCommittedRefreshFailure;

export const EMPTY_CUSTOMER_PERMISSIONS: CustomerPermissionSet = {
  canViewCustomer: false,
  canViewArchivedCustomers: false,
  canCreateCustomer: false,
  canEditCustomer: false,
  canTransitionCustomer: false,
  canArchiveCustomer: false,
  canRestoreCustomer: false,
  canViewStatusHistory: false,
  canViewRelatedTasks: false,
  canViewEnrollmentSummary: false,
};

export const CUSTOMER_MUTATION_REFRESH_HINTS = {
  create: { detail: true, list: true, history: true, relatedTasks: false },
  update_profile: { detail: true, list: true, history: false, relatedTasks: false },
  transition_status: { detail: true, list: true, history: true, relatedTasks: false },
  archive: { detail: true, list: true, history: false, relatedTasks: false },
  restore: { detail: true, list: true, history: false, relatedTasks: false },
} as const satisfies Record<CustomerMutationOperation, CustomerRefreshHints>;