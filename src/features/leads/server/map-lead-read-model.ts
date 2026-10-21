import {
  getAllowedLeadStatusTransitions,
  getLeadStatusLabel,
  isConvertibleLeadStatus,
  isLeadStatus,
  isTerminalLeadStatus,
} from "@/features/leads/domain/status";
import {
  getLeadPipelineStageCategoryLabel,
  isLeadPipelineStageCategory,
  toLeadPipelineStageOption,
  type LeadPipelineStageOption,
} from "@/features/leads/domain/pipeline-stage";
import type {
  LeadConvertedCustomerSummary,
  LeadDetailReadModel,
  LeadListItemReadModel,
  LeadStageHistoryEntry,
  LeadStageSummary,
  LeadStatusHistoryEntry,
} from "@/features/leads/domain/read-types";
import type {
  LeadPipelineStageRow,
  LeadRow,
  LeadStageHistoryRow,
  LeadStatus,
  LeadStatusHistoryRow,
} from "@/features/leads/domain/types";
import type { LeadStageLabelBundle } from "@/features/leads/server/resolve-lead-labels";
import {
  CUSTOMER_LABEL_UNAVAILABLE,
  resolveCustomerDisplayLabel,
  STAGE_LABEL_UNAVAILABLE,
  type LeadConvertedCustomerRow,
} from "@/features/leads/server/resolve-lead-labels";

export type LeadListRow = Pick<
  LeadRow,
  | "id"
  | "organization_id"
  | "display_name"
  | "status"
  | "email"
  | "owner_member_id"
  | "stage_id"
  | "source_type"
  | "pursuit_label"
  | "converted_customer_id"
  | "converted_at"
  | "created_at"
  | "updated_at"
  | "archived_at"
>;

export type LeadDetailRow = Pick<
  LeadRow,
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
  | "stage_id"
  | "source_type"
  | "source_detail"
  | "pursuit_label"
  | "converted_customer_id"
  | "converted_at"
  | "archived_at"
  | "created_at"
  | "updated_at"
>;

export type LeadStatusHistoryQueryRow = Pick<
  LeadStatusHistoryRow,
  | "id"
  | "organization_id"
  | "lead_id"
  | "from_status"
  | "to_status"
  | "changed_by_member_id"
  | "reason"
  | "source"
  | "changed_at"
>;

export type LeadStageHistoryQueryRow = Pick<
  LeadStageHistoryRow,
  | "id"
  | "organization_id"
  | "lead_id"
  | "from_stage_id"
  | "to_stage_id"
  | "changed_by_member_id"
  | "reason"
  | "source"
  | "changed_at"
>;

export type LeadPipelineStageQueryRow = Pick<
  LeadPipelineStageRow,
  "id" | "organization_id" | "name" | "position" | "stage_category" | "is_default" | "archived_at"
>;

function resolveLeadStatus(value: string): LeadStatus {
  return isLeadStatus(value) ? value : "open";
}

function buildDerivedFlags(status: LeadStatus, archivedAt: string | null) {
  return {
    isArchived: archivedAt !== null,
    isConverted: isTerminalLeadStatus(status),
    isConvertible: isConvertibleLeadStatus(status) && archivedAt === null,
  };
}

function fallbackStageSummary(stageId: string): LeadStageSummary {
  return {
    stageId,
    name: STAGE_LABEL_UNAVAILABLE,
    position: 0,
    stageCategory: "new",
    stageCategoryLabel: getLeadPipelineStageCategoryLabel("new"),
    isDefault: false,
  };
}

export function mapLeadListItem(
  row: LeadListRow,
  ownerLabel: string,
  stageBundle: LeadStageLabelBundle,
): LeadListItemReadModel {
  const status = resolveLeadStatus(row.status);

  return {
    id: row.id,
    organizationId: row.organization_id,
    displayName: row.display_name,
    status,
    statusLabel: getLeadStatusLabel(status),
    email: row.email,
    ownerMemberId: row.owner_member_id,
    ownerLabel,
    stageId: row.stage_id,
    stageName: stageBundle.name,
    stageCategory: stageBundle.stageCategory,
    stageCategoryLabel: stageBundle.stageCategoryLabel,
    sourceType: row.source_type,
    pursuitLabel: row.pursuit_label,
    convertedCustomerId: row.converted_customer_id,
    convertedAt: row.converted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at,
    derived: buildDerivedFlags(status, row.archived_at),
  };
}

export function mapLeadConvertedCustomerSummary(
  customerId: string,
  convertedAt: string,
  customerRow: LeadConvertedCustomerRow | null,
): LeadConvertedCustomerSummary {
  return {
    customerId,
    displayLabel: resolveCustomerDisplayLabel(customerRow),
    convertedAt,
    isArchived: customerRow?.archived_at != null,
  };
}

export function mapLeadDetail(
  row: LeadDetailRow,
  labels: {
    ownerLabel: string;
    createdByLabel: string;
    stage: LeadStageSummary;
    convertedCustomer: LeadConvertedCustomerSummary | null;
  },
): LeadDetailReadModel {
  const status = resolveLeadStatus(row.status);
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
    statusLabel: getLeadStatusLabel(status),
    ownerMemberId: row.owner_member_id,
    ownerLabel: labels.ownerLabel,
    createdByMemberId: row.created_by_member_id,
    createdByLabel: labels.createdByLabel,
    stage: labels.stage,
    sourceType: row.source_type,
    sourceDetail: row.source_detail,
    pursuitLabel: row.pursuit_label,
    convertedCustomer: labels.convertedCustomer,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    derived: {
      ...buildDerivedFlags(status, row.archived_at),
      allowedStatusTransitions: isArchived ? [] : getAllowedLeadStatusTransitions(status),
    },
  };
}

export function mapLeadStatusHistoryEntry(
  row: LeadStatusHistoryQueryRow,
  changedByLabel: string,
): LeadStatusHistoryEntry {
  const fromStatus =
    row.from_status && isLeadStatus(row.from_status) ? row.from_status : null;
  const toStatus = resolveLeadStatus(row.to_status);

  return {
    id: row.id,
    organizationId: row.organization_id,
    leadId: row.lead_id,
    fromStatus,
    toStatus,
    fromStatusLabel: fromStatus ? getLeadStatusLabel(fromStatus) : null,
    toStatusLabel: getLeadStatusLabel(toStatus),
    changedByMemberId: row.changed_by_member_id,
    changedByLabel,
    reason: row.reason,
    source: row.source,
    changedAt: row.changed_at,
  };
}

export function mapLeadStageHistoryEntry(
  row: LeadStageHistoryQueryRow,
  changedByLabel: string,
  stageBundles: Record<string, LeadStageLabelBundle>,
): LeadStageHistoryEntry {
  const fromStageName = row.from_stage_id
    ? (stageBundles[row.from_stage_id]?.name ?? STAGE_LABEL_UNAVAILABLE)
    : null;
  const toStageName = stageBundles[row.to_stage_id]?.name ?? STAGE_LABEL_UNAVAILABLE;

  return {
    id: row.id,
    organizationId: row.organization_id,
    leadId: row.lead_id,
    fromStageId: row.from_stage_id,
    toStageId: row.to_stage_id,
    fromStageName,
    toStageName,
    changedByMemberId: row.changed_by_member_id,
    changedByLabel,
    reason: row.reason,
    source: row.source,
    changedAt: row.changed_at,
  };
}

export function mapLeadPipelineStageOption(
  row: LeadPipelineStageQueryRow,
): LeadPipelineStageOption | null {
  return toLeadPipelineStageOption(row);
}

export function mapUnavailableConvertedCustomer(
  customerId: string,
  convertedAt: string,
): LeadConvertedCustomerSummary {
  return {
    customerId,
    displayLabel: CUSTOMER_LABEL_UNAVAILABLE,
    convertedAt,
    isArchived: false,
  };
}

export function mapStageSummaryFromBundle(
  stageId: string,
  bundles: Record<string, LeadStageLabelBundle>,
): LeadStageSummary {
  const bundle = bundles[stageId];
  if (!bundle || !isLeadPipelineStageCategory(bundle.stageCategory)) {
    return fallbackStageSummary(stageId);
  }

  return {
    stageId,
    name: bundle.name,
    position: bundle.position,
    stageCategory: bundle.stageCategory,
    stageCategoryLabel: bundle.stageCategoryLabel,
    isDefault: bundle.isDefault,
  };
}
