import {
  getAllowedCustomerStatusTransitions,
  getCustomerStatusLabel,
  getEnrollmentStatusLabel,
  isCustomerStatus,
  isEnrollmentStatus,
} from "@/features/customers/domain/status";
import type {
  CustomerDetailReadModel,
  CustomerEnrollmentSummary,
  CustomerListItemReadModel,
  CustomerStatusHistoryEntry,
} from "@/features/customers/domain/read-types";
import type {
  CustomerRow,
  CustomerStatus,
  CustomerStatusHistoryRow,
  EnrollmentRow,
} from "@/features/customers/domain/types";

export type CustomerListRow = Pick<
  CustomerRow,
  | "id"
  | "organization_id"
  | "display_name"
  | "status"
  | "email"
  | "owner_member_id"
  | "started_at"
  | "updated_at"
  | "archived_at"
>;

export type CustomerDetailRow = Pick<
  CustomerRow,
  | "id"
  | "organization_id"
  | "display_name"
  | "first_name"
  | "last_name"
  | "email"
  | "phone"
  | "status"
  | "owner_member_id"
  | "created_by_member_id"
  | "started_at"
  | "ended_at"
  | "archived_at"
  | "created_at"
  | "updated_at"
>;

export type CustomerHistoryRow = Pick<
  CustomerStatusHistoryRow,
  | "id"
  | "organization_id"
  | "customer_id"
  | "from_status"
  | "to_status"
  | "changed_by_member_id"
  | "reason"
  | "source"
  | "changed_at"
>;

export type CustomerEnrollmentSummaryRow = Pick<
  EnrollmentRow,
  "id" | "program_id" | "status" | "enrolled_at"
>;

function resolveCustomerStatus(value: string): CustomerStatus {
  return isCustomerStatus(value) ? value : "onboarding";
}

export function mapCustomerListItem(
  row: CustomerListRow,
  ownerLabel: string,
): CustomerListItemReadModel {
  const status = resolveCustomerStatus(row.status);

  return {
    id: row.id,
    organizationId: row.organization_id,
    displayName: row.display_name,
    status,
    statusLabel: getCustomerStatusLabel(status),
    email: row.email,
    ownerMemberId: row.owner_member_id,
    ownerLabel,
    startedAt: row.started_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    derived: {
      isArchived: row.archived_at !== null,
    },
  };
}

export function mapCustomerDetail(
  row: CustomerDetailRow,
  labels: { ownerLabel: string; createdByLabel: string },
): CustomerDetailReadModel {
  const status = resolveCustomerStatus(row.status);
  const isArchived = row.archived_at !== null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    displayName: row.display_name,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    status,
    statusLabel: getCustomerStatusLabel(status),
    ownerMemberId: row.owner_member_id,
    ownerLabel: labels.ownerLabel,
    createdByMemberId: row.created_by_member_id,
    createdByLabel: labels.createdByLabel,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    derived: {
      isArchived,
      allowedTransitions: isArchived ? [] : getAllowedCustomerStatusTransitions(status),
    },
  };
}

export function mapCustomerStatusHistoryEntry(
  row: CustomerHistoryRow,
  changedByLabel: string,
): CustomerStatusHistoryEntry {
  const fromStatus =
    row.from_status && isCustomerStatus(row.from_status) ? row.from_status : null;
  const toStatus = resolveCustomerStatus(row.to_status);

  return {
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    fromStatus,
    toStatus,
    fromStatusLabel: fromStatus ? getCustomerStatusLabel(fromStatus) : null,
    toStatusLabel: getCustomerStatusLabel(toStatus),
    changedByMemberId: row.changed_by_member_id,
    changedByLabel,
    reason: row.reason,
    source: row.source,
    changedAt: row.changed_at,
  };
}

export function mapCustomerEnrollmentSummary(
  row: CustomerEnrollmentSummaryRow,
  programName: string,
): CustomerEnrollmentSummary {
  const statusLabel = isEnrollmentStatus(row.status)
    ? getEnrollmentStatusLabel(row.status)
    : "Unknown status";

  return {
    enrollmentId: row.id,
    programId: row.program_id,
    programName,
    status: row.status,
    statusLabel,
    enrolledAt: row.enrolled_at,
  };
}
