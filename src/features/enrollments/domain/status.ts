import type {
  EnrollmentInitialStatus,
  EnrollmentStatus,
} from "@/features/enrollments/domain/types";

export const ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const satisfies readonly EnrollmentStatus[];

/** Statuses accepted by create_enrollment p_initial_status. */
export const ENROLLMENT_INITIAL_STATUSES = [
  "pending",
  "active",
] as const satisfies readonly EnrollmentInitialStatus[];

/**
 * Open participation definition matching enrollments_open_participation_unique_idx
 * and archive_program open-enrollment counting.
 */
export const OPEN_ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "paused",
] as const satisfies readonly EnrollmentStatus[];

/** Terminal statuses that may be archived / restored. */
export const TERMINAL_ENROLLMENT_STATUSES = [
  "completed",
  "cancelled",
] as const satisfies readonly EnrollmentStatus[];

const STATUS_LABELS: Record<EnrollmentStatus, string> = {
  pending: "Pending",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_DESCRIPTIONS: Record<EnrollmentStatus, string> = {
  pending: "Enrollment created but participation has not started.",
  active: "Customer is actively participating in the program.",
  paused: "Participation is temporarily paused.",
  completed: "Participation finished successfully; soft-archive is separate.",
  cancelled: "Participation ended without completion; soft-archive is separate.",
};

/**
 * Mirrors private.is_allowed_enrollment_status_transition.
 * Database RPCs remain authoritative for enforcement.
 */
const ALLOWED_TRANSITIONS: Record<EnrollmentStatus, readonly EnrollmentStatus[]> = {
  pending: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

/** Stable display / filter order. */
export const ENROLLMENT_STATUS_ORDER = [
  "pending",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const satisfies readonly EnrollmentStatus[];

export type EnrollmentStatusMetadata = {
  value: EnrollmentStatus;
  label: string;
  description: string;
  isCreateDefault: boolean;
  isCreateAllowed: boolean;
  isOpen: boolean;
  isLifecycleTerminal: boolean;
};

export const ENROLLMENT_STATUS_METADATA: readonly EnrollmentStatusMetadata[] =
  ENROLLMENT_STATUS_ORDER.map((value) => ({
    value,
    label: STATUS_LABELS[value],
    description: STATUS_DESCRIPTIONS[value],
    isCreateDefault: value === "pending",
    isCreateAllowed: value === "pending" || value === "active",
    isOpen: (OPEN_ENROLLMENT_STATUSES as readonly string[]).includes(value),
    isLifecycleTerminal: (TERMINAL_ENROLLMENT_STATUSES as readonly string[]).includes(
      value,
    ),
  }));

export function isEnrollmentStatus(value: string): value is EnrollmentStatus {
  return (ENROLLMENT_STATUSES as readonly string[]).includes(value);
}

export function isEnrollmentInitialStatus(
  value: string,
): value is EnrollmentInitialStatus {
  return (ENROLLMENT_INITIAL_STATUSES as readonly string[]).includes(value);
}

export function isOpenEnrollmentStatus(status: EnrollmentStatus): boolean {
  return (OPEN_ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

export function isTerminalEnrollmentStatus(status: EnrollmentStatus): boolean {
  return (TERMINAL_ENROLLMENT_STATUSES as readonly string[]).includes(status);
}

export function getEnrollmentStatusLabel(status: EnrollmentStatus): string {
  return STATUS_LABELS[status];
}

export function getEnrollmentStatusDescription(status: EnrollmentStatus): string {
  return STATUS_DESCRIPTIONS[status];
}

export function getAllowedEnrollmentStatusTransitions(
  fromStatus: EnrollmentStatus,
): EnrollmentStatus[] {
  return [...ALLOWED_TRANSITIONS[fromStatus]];
}

export function isAllowedEnrollmentStatusTransition(
  fromStatus: EnrollmentStatus,
  toStatus: EnrollmentStatus,
): boolean {
  if (fromStatus === toStatus) {
    return false;
  }

  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

/**
 * Open participation: status ∈ pending|active|paused AND not soft-archived.
 */
export function isOpenEnrollment(
  status: EnrollmentStatus,
  archivedAt: string | null | undefined,
): boolean {
  return archivedAt == null && isOpenEnrollmentStatus(status);
}
