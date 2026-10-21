import type {
  ProgressEnrollmentStatus,
  ProgressFactSource,
  ProgressFactType,
} from "@/features/progress/domain/types";

export const PROGRESS_FACT_TYPES = [
  "milestone_reached",
  "unit_completed",
  "session_attended",
  "assessment_completed",
  "manual_observation",
] as const satisfies readonly ProgressFactType[];

export const PROGRESS_FACT_SOURCES = [
  "manual",
  "correction",
] as const satisfies readonly ProgressFactSource[];

export const PROGRESS_ENROLLMENT_STATUSES = [
  "pending",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const satisfies readonly ProgressEnrollmentStatus[];

const FACT_TYPE_LABELS: Record<ProgressFactType, string> = {
  milestone_reached: "Milestone reached",
  unit_completed: "Unit completed",
  session_attended: "Session attended",
  assessment_completed: "Assessment completed",
  manual_observation: "Manual observation",
};

const SOURCE_LABELS: Record<ProgressFactSource, string> = {
  manual: "Manual",
  correction: "Correction",
};

export function isProgressFactType(value: string): value is ProgressFactType {
  return (PROGRESS_FACT_TYPES as readonly string[]).includes(value);
}

export function isProgressFactSource(value: string): value is ProgressFactSource {
  return (PROGRESS_FACT_SOURCES as readonly string[]).includes(value);
}

export function isProgressEnrollmentStatus(
  value: string,
): value is ProgressEnrollmentStatus {
  return (PROGRESS_ENROLLMENT_STATUSES as readonly string[]).includes(value);
}

export function getProgressFactTypeLabel(factType: ProgressFactType): string {
  return FACT_TYPE_LABELS[factType];
}

export function getProgressFactSourceLabel(source: ProgressFactSource): string {
  return SOURCE_LABELS[source];
}

/** Manual record is allowed only for active/paused non-archived enrollments (RPC). */
export function enrollmentAllowsManualProgressRecord(
  status: ProgressEnrollmentStatus | null | undefined,
  archivedAt: string | null | undefined,
): boolean {
  if (archivedAt != null) {
    return false;
  }
  return status === "active" || status === "paused";
}

/**
 * Staff correction/void: active/paused only.
 * Owner/admin correction/void: also completed/cancelled (non-archived).
 */
export function enrollmentAllowsProgressCorrectionOrVoid(params: {
  status: ProgressEnrollmentStatus | null | undefined;
  archivedAt: string | null | undefined;
  role: "owner" | "admin" | "staff" | "viewer" | null | undefined;
}): boolean {
  if (params.archivedAt != null) {
    return false;
  }
  if (params.status == null) {
    return false;
  }
  if (params.role === "staff") {
    return params.status === "active" || params.status === "paused";
  }
  if (params.role === "owner" || params.role === "admin") {
    return (
      params.status === "active" ||
      params.status === "paused" ||
      params.status === "completed" ||
      params.status === "cancelled"
    );
  }
  return false;
}
