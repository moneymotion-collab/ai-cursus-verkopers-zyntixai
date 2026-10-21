import {
  getAllowedEnrollmentStatusTransitions,
  getEnrollmentStatusLabel,
  isEnrollmentStatus,
  isOpenEnrollment,
  isTerminalEnrollmentStatus,
} from "@/features/enrollments/domain/status";
import type {
  EnrollmentCustomerSummary,
  EnrollmentDetailReadModel,
  EnrollmentListItemReadModel,
  EnrollmentProgramSummary,
  EnrollmentStatusHistoryEntry,
} from "@/features/enrollments/domain/read-types";
import type {
  EnrollmentRow,
  EnrollmentStatus,
  EnrollmentStatusHistoryRow,
} from "@/features/enrollments/domain/types";

export type EnrollmentListRow = Pick<
  EnrollmentRow,
  | "id"
  | "organization_id"
  | "customer_id"
  | "program_id"
  | "status"
  | "owner_member_id"
  | "enrolled_at"
  | "updated_at"
  | "archived_at"
>;

export type EnrollmentDetailRow = Pick<
  EnrollmentRow,
  | "id"
  | "organization_id"
  | "customer_id"
  | "program_id"
  | "status"
  | "owner_member_id"
  | "created_by_member_id"
  | "enrolled_at"
  | "started_at"
  | "completed_at"
  | "cancelled_at"
  | "source"
  | "metadata"
  | "created_at"
  | "updated_at"
  | "archived_at"
>;

export type EnrollmentHistoryRow = Pick<
  EnrollmentStatusHistoryRow,
  | "id"
  | "organization_id"
  | "enrollment_id"
  | "from_status"
  | "to_status"
  | "changed_by_member_id"
  | "reason"
  | "source"
  | "changed_at"
>;

export type EnrollmentCustomerSummaryRow = {
  id: string;
  display_name: string;
  status: string;
  archived_at: string | null;
};

export type EnrollmentProgramSummaryRow = {
  id: string;
  name: string;
  status: string;
  archived_at: string | null;
};

/**
 * Unknown DB status values fail closed to a safe typed fallback for presentation.
 * Mutation paths still reject unsupported statuses via Zod / RPC.
 */
function resolveEnrollmentStatus(value: string): EnrollmentStatus {
  return isEnrollmentStatus(value) ? value : "pending";
}

function asMetadataObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mapEnrollmentCustomerSummary(
  row: EnrollmentCustomerSummaryRow,
): EnrollmentCustomerSummary {
  return {
    id: row.id,
    displayName: row.display_name,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

export function mapEnrollmentProgramSummary(
  row: EnrollmentProgramSummaryRow,
): EnrollmentProgramSummary {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

export function mapEnrollmentListItem(
  row: EnrollmentListRow,
  labels?: {
    customerDisplayName?: string | null;
    programName?: string | null;
  },
): EnrollmentListItemReadModel {
  const status = resolveEnrollmentStatus(row.status);

  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    programId: row.program_id,
    customerDisplayName: labels?.customerDisplayName ?? null,
    programName: labels?.programName ?? null,
    status,
    statusLabel: getEnrollmentStatusLabel(status),
    ownerMemberId: row.owner_member_id,
    enrolledAt: row.enrolled_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    derived: {
      isArchived: row.archived_at != null,
      isOpen: isOpenEnrollment(status, row.archived_at),
      isTerminal: isTerminalEnrollmentStatus(status),
    },
  };
}

export function mapEnrollmentDetail(
  row: EnrollmentDetailRow,
  related?: {
    customer?: EnrollmentCustomerSummary | null;
    program?: EnrollmentProgramSummary | null;
  },
): EnrollmentDetailReadModel {
  const status = resolveEnrollmentStatus(row.status);

  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    programId: row.program_id,
    status,
    statusLabel: getEnrollmentStatusLabel(status),
    ownerMemberId: row.owner_member_id,
    createdByMemberId: row.created_by_member_id,
    enrolledAt: row.enrolled_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    source: row.source,
    metadata: asMetadataObject(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    customer: related?.customer ?? null,
    program: related?.program ?? null,
    derived: {
      isArchived: row.archived_at != null,
      isOpen: isOpenEnrollment(status, row.archived_at),
      isTerminal: isTerminalEnrollmentStatus(status),
      allowedTransitions: getAllowedEnrollmentStatusTransitions(status),
    },
  };
}

export function mapEnrollmentStatusHistoryEntry(
  row: EnrollmentHistoryRow,
): EnrollmentStatusHistoryEntry {
  const toStatus = resolveEnrollmentStatus(row.to_status);
  const fromStatus =
    row.from_status == null
      ? null
      : isEnrollmentStatus(row.from_status)
        ? row.from_status
        : null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    enrollmentId: row.enrollment_id,
    fromStatus,
    toStatus,
    fromStatusLabel: fromStatus ? getEnrollmentStatusLabel(fromStatus) : null,
    toStatusLabel: getEnrollmentStatusLabel(toStatus),
    changedByMemberId: row.changed_by_member_id,
    reason: row.reason,
    source: row.source,
    changedAt: row.changed_at,
  };
}
