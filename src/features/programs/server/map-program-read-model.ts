import {
  getAllowedProgramStatusTransitions,
  getProgramStatusLabel,
  isProgramStatus,
} from "@/features/programs/domain/status";
import {
  getProgramDeliveryModeLabel,
  isProgramDeliveryMode,
} from "@/features/programs/domain/delivery-mode";
import type {
  ProgramDetailReadModel,
  ProgramListItemReadModel,
  ProgramStatusHistoryEntry,
} from "@/features/programs/domain/read-types";
import type {
  ProgramDeliveryMode,
  ProgramRow,
  ProgramStatus,
  ProgramStatusHistoryRow,
} from "@/features/programs/domain/types";

export type ProgramListRow = Pick<
  ProgramRow,
  | "id"
  | "organization_id"
  | "name"
  | "status"
  | "delivery_mode"
  | "created_at"
  | "updated_at"
  | "archived_at"
>;

export type ProgramDetailRow = Pick<
  ProgramRow,
  | "id"
  | "organization_id"
  | "name"
  | "description"
  | "status"
  | "delivery_mode"
  | "created_by_member_id"
  | "created_at"
  | "updated_at"
  | "archived_at"
>;

export type ProgramHistoryRow = Pick<
  ProgramStatusHistoryRow,
  | "id"
  | "organization_id"
  | "program_id"
  | "from_status"
  | "to_status"
  | "changed_by_member_id"
  | "reason"
  | "source"
  | "changed_at"
>;

function resolveProgramStatus(value: string): ProgramStatus {
  return isProgramStatus(value) ? value : "draft";
}

function resolveDeliveryMode(value: string): ProgramDeliveryMode {
  return isProgramDeliveryMode(value) ? value : "self_paced";
}

export function mapProgramListItem(
  row: ProgramListRow,
  openEnrollmentCount: number,
): ProgramListItemReadModel {
  const status = resolveProgramStatus(row.status);
  const deliveryMode = resolveDeliveryMode(row.delivery_mode);

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    status,
    statusLabel: getProgramStatusLabel(status),
    deliveryMode,
    deliveryModeLabel: getProgramDeliveryModeLabel(deliveryMode),
    openEnrollmentCount,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    archivedAt: row.archived_at,
    derived: {
      isArchived: row.archived_at != null,
    },
  };
}

export function mapProgramDetail(
  row: ProgramDetailRow,
  openEnrollmentCount: number,
): ProgramDetailReadModel {
  const status = resolveProgramStatus(row.status);
  const deliveryMode = resolveDeliveryMode(row.delivery_mode);

  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    description: row.description,
    status,
    statusLabel: getProgramStatusLabel(status),
    deliveryMode,
    deliveryModeLabel: getProgramDeliveryModeLabel(deliveryMode),
    createdByMemberId: row.created_by_member_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    openEnrollmentCount,
    derived: {
      isArchived: row.archived_at != null,
      allowedTransitions: getAllowedProgramStatusTransitions(status),
    },
  };
}

export function mapProgramStatusHistoryEntry(
  row: ProgramHistoryRow,
): ProgramStatusHistoryEntry {
  const toStatus = resolveProgramStatus(row.to_status);
  const fromStatus =
    row.from_status == null
      ? null
      : isProgramStatus(row.from_status)
        ? row.from_status
        : null;

  return {
    id: row.id,
    organizationId: row.organization_id,
    programId: row.program_id,
    fromStatus,
    toStatus,
    fromStatusLabel: fromStatus ? getProgramStatusLabel(fromStatus) : null,
    toStatusLabel: getProgramStatusLabel(toStatus),
    changedByMemberId: row.changed_by_member_id,
    reason: row.reason,
    source: row.source,
    changedAt: row.changed_at,
  };
}
