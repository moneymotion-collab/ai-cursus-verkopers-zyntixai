import {
  getProgressFactSourceLabel,
  getProgressFactTypeLabel,
  isProgressFactSource,
  isProgressFactType,
} from "@/features/progress/domain/fact-types";
import type {
  ProgressCustomerSummary,
  ProgressEnrollmentSummary,
  ProgressFactDetailReadModel,
  ProgressFactListItemReadModel,
  ProgressProgramSummary,
} from "@/features/progress/domain/read-types";
import type {
  ProgressFactRow,
  ProgressFactSource,
  ProgressFactType,
} from "@/features/progress/domain/types";

export type ProgressFactListRow = Pick<
  ProgressFactRow,
  | "id"
  | "organization_id"
  | "enrollment_id"
  | "customer_id"
  | "program_id"
  | "fact_type"
  | "source"
  | "title"
  | "occurred_at"
  | "recorded_at"
  | "recorded_by_member_id"
  | "voided_at"
  | "corrected_from_fact_id"
>;

export type ProgressFactDetailRow = Pick<
  ProgressFactRow,
  | "id"
  | "organization_id"
  | "enrollment_id"
  | "customer_id"
  | "program_id"
  | "fact_type"
  | "source"
  | "title"
  | "description"
  | "numeric_value"
  | "numeric_unit"
  | "is_complete"
  | "sequence_number"
  | "idempotency_key"
  | "corrected_from_fact_id"
  | "occurred_at"
  | "recorded_at"
  | "recorded_by_member_id"
  | "voided_at"
  | "voided_by_member_id"
  | "void_reason"
>;

export type ProgressEnrollmentSummaryRow = {
  id: string;
  status: string;
  archived_at: string | null;
  customer_id: string;
  program_id: string;
};

export type ProgressCustomerSummaryRow = {
  id: string;
  display_name: string;
  status: string;
  archived_at: string | null;
};

export type ProgressProgramSummaryRow = {
  id: string;
  name: string;
  status: string;
  archived_at: string | null;
};

/**
 * Unknown DB fact_type values fail closed to a safe typed fallback for presentation.
 * Mutation paths still reject unsupported types via Zod / RPC.
 */
function resolveFactType(value: string): ProgressFactType {
  return isProgressFactType(value) ? value : "manual_observation";
}

function resolveSource(value: string): ProgressFactSource {
  return isProgressFactSource(value) ? value : "manual";
}

function buildDerivedFlags(row: {
  voided_at: string | null;
  source: string;
  corrected_from_fact_id: string | null;
}) {
  const source = resolveSource(row.source);
  return {
    isVoided: row.voided_at != null,
    isCorrection: source === "correction",
    isManual: source === "manual",
    hasActiveLineagePredecessor: row.corrected_from_fact_id != null,
  };
}

export function mapProgressEnrollmentSummary(
  row: ProgressEnrollmentSummaryRow,
): ProgressEnrollmentSummary {
  return {
    id: row.id,
    status: row.status,
    archivedAt: row.archived_at,
    customerId: row.customer_id,
    programId: row.program_id,
  };
}

export function mapProgressCustomerSummary(
  row: ProgressCustomerSummaryRow,
): ProgressCustomerSummary {
  return {
    id: row.id,
    displayName: row.display_name,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

export function mapProgressProgramSummary(
  row: ProgressProgramSummaryRow,
): ProgressProgramSummary {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

export function mapProgressFactListItem(
  row: ProgressFactListRow,
  labels?: {
    customerDisplayName?: string | null;
    programName?: string | null;
  },
): ProgressFactListItemReadModel {
  const factType = resolveFactType(row.fact_type);
  const source = resolveSource(row.source);

  return {
    id: row.id,
    organizationId: row.organization_id,
    enrollmentId: row.enrollment_id,
    customerId: row.customer_id,
    programId: row.program_id,
    factType,
    factTypeLabel: getProgressFactTypeLabel(factType),
    source,
    sourceLabel: getProgressFactSourceLabel(source),
    title: row.title,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
    recordedByMemberId: row.recorded_by_member_id,
    voidedAt: row.voided_at,
    customerDisplayName: labels?.customerDisplayName ?? null,
    programName: labels?.programName ?? null,
    derived: buildDerivedFlags(row),
  };
}

export function mapProgressFactDetail(
  row: ProgressFactDetailRow,
  related?: {
    enrollment?: ProgressEnrollmentSummary | null;
    customer?: ProgressCustomerSummary | null;
    program?: ProgressProgramSummary | null;
  },
): ProgressFactDetailReadModel {
  const factType = resolveFactType(row.fact_type);
  const source = resolveSource(row.source);

  return {
    id: row.id,
    organizationId: row.organization_id,
    enrollmentId: row.enrollment_id,
    customerId: row.customer_id,
    programId: row.program_id,
    factType,
    factTypeLabel: getProgressFactTypeLabel(factType),
    source,
    sourceLabel: getProgressFactSourceLabel(source),
    title: row.title,
    description: row.description,
    numericValue: row.numeric_value,
    numericUnit: row.numeric_unit,
    isComplete: row.is_complete,
    sequenceNumber: row.sequence_number,
    idempotencyKey: row.idempotency_key,
    correctedFromFactId: row.corrected_from_fact_id,
    occurredAt: row.occurred_at,
    recordedAt: row.recorded_at,
    recordedByMemberId: row.recorded_by_member_id,
    voidedAt: row.voided_at,
    voidedByMemberId: row.voided_by_member_id,
    voidReason: row.void_reason,
    enrollment: related?.enrollment ?? null,
    customer: related?.customer ?? null,
    program: related?.program ?? null,
    derived: buildDerivedFlags(row),
  };
}
