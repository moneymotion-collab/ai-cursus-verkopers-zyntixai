import type { Json } from "@/types/database";
import type { Tables } from "@/types/database";
import {
  isAttentionEventSource,
  isAttentionEventType,
} from "@/features/attention/domain/events";
import { utcCalendarDaysBetween } from "@/features/attention/domain/eligibility";
import { ATTENTION_PRIMARY_SOURCE_TYPE, isAttentionSourceType } from "@/features/attention/domain/source";
import {
  isAttentionItemStatus,
  isTerminalAttentionStatus,
} from "@/features/attention/domain/status";
import { isAttentionSeverity } from "@/features/attention/domain/severity";
import {
  isAttentionRuleKey,
  isAttentionSignalOrigin,
} from "@/features/attention/domain/signal";
import { validateAttentionSignalEvidence } from "@/features/attention/domain/validation";
import type {
  AttentionCustomerSummary,
  AttentionEnrollmentSummary,
  AttentionEventReadModel,
  AttentionItemDetailReadModel,
  AttentionItemDerivedFlags,
  AttentionItemListItemReadModel,
  AttentionProgramSummary,
  AttentionProjectSummary,
  AttentionSignalReadModel,
  AttentionTaskSummary,
  AttentionWorkOrderSummary,
} from "@/features/attention/domain/read-types";
import type {
  AttentionApplicationError,
  AttentionItemStatus,
  AttentionSeverity,
  AttentionSignalEvidence,
} from "@/features/attention/domain/types";
import { invalidStateError } from "@/features/attention/server/normalize-attention-error";

export type AttentionItemListRow = Pick<
  Tables<"attention_items">,
  | "id"
  | "organization_id"
  | "enrollment_id"
  | "customer_id"
  | "program_id"
  | "project_id"
  | "task_id"
  | "title"
  | "summary"
  | "status"
  | "severity"
  | "assignee_member_id"
  | "detection_count"
  | "first_detected_at"
  | "last_detected_at"
  | "acknowledged_at"
  | "resolved_at"
  | "dismissed_at"
  | "expired_at"
  | "archived_at"
  | "created_at"
  | "updated_at"
> & {
  source_type?: string | null;
  source_entity_id?: string | null;
  work_order_id?: string | null;
  product_id?: string | null;
  order_id?: string | null;
};

export type AttentionItemDetailRow = Pick<
  Tables<"attention_items">,
  | "id"
  | "organization_id"
  | "enrollment_id"
  | "customer_id"
  | "program_id"
  | "project_id"
  | "task_id"
  | "title"
  | "summary"
  | "status"
  | "severity"
  | "assignee_member_id"
  | "dedupe_key"
  | "detection_count"
  | "first_detected_at"
  | "last_detected_at"
  | "acknowledged_at"
  | "resolved_at"
  | "dismissed_at"
  | "expired_at"
  | "resolution_reason"
  | "dismissal_reason"
  | "archived_at"
  | "created_by_member_id"
  | "updated_by_member_id"
  | "created_at"
  | "updated_at"
> & {
  source_type?: string | null;
  source_entity_id?: string | null;
  work_order_id?: string | null;
  product_id?: string | null;
  order_id?: string | null;
};

export type AttentionSignalRow = Pick<
  Tables<"attention_signals">,
  | "id"
  | "organization_id"
  | "attention_item_id"
  | "enrollment_id"
  | "signal_origin"
  | "rule_key"
  | "explanation"
  | "evidence"
  | "detected_at"
  | "created_by_member_id"
  | "created_at"
>;

export type AttentionEventRow = Pick<
  Tables<"attention_item_events">,
  | "id"
  | "organization_id"
  | "attention_item_id"
  | "event_type"
  | "from_status"
  | "to_status"
  | "from_severity"
  | "to_severity"
  | "from_assignee_member_id"
  | "to_assignee_member_id"
  | "reason"
  | "source"
  | "actor_member_id"
  | "payload"
  | "created_at"
>;

export type AttentionEnrollmentSummaryRow = {
  id: string;
  status: string;
  archived_at: string | null;
  customer_id: string;
  program_id: string;
};

export type AttentionCustomerSummaryRow = {
  id: string;
  display_name: string;
  status: string;
  archived_at: string | null;
};

export type AttentionProgramSummaryRow = {
  id: string;
  name: string;
  status: string;
  archived_at: string | null;
};

export type AttentionProjectSummaryRow = {
  id: string;
  name: string;
  status: string;
  archived_at: string | null;
};

export type AttentionTaskSummaryRow = {
  id: string;
  title: string;
  status: string;
  due_at: string | null;
};

export type AttentionWorkOrderSummaryRow = {
  id: string;
  title: string;
  status: string;
  site_id: string;
  scheduled_for: string | null;
};

export type AttentionMapResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: AttentionApplicationError };

function requireStatus(value: string): AttentionMapResult<AttentionItemStatus> {
  if (!isAttentionItemStatus(value)) {
    return {
      ok: false,
      error: invalidStateError("Unknown attention status from database."),
    };
  }
  return { ok: true, data: value };
}

function requireSeverity(value: string): AttentionMapResult<AttentionSeverity> {
  if (!isAttentionSeverity(value)) {
    return {
      ok: false,
      error: invalidStateError("Unknown attention severity from database."),
    };
  }
  return { ok: true, data: value };
}

function requireNullableStatus(
  value: string | null,
): AttentionMapResult<AttentionItemStatus | null> {
  if (value == null) {
    return { ok: true, data: null };
  }
  return requireStatus(value);
}

function requireNullableSeverity(
  value: string | null,
): AttentionMapResult<AttentionSeverity | null> {
  if (value == null) {
    return { ok: true, data: null };
  }
  return requireSeverity(value);
}

function buildDerivedFlags(row: {
  status: AttentionItemStatus;
  acknowledged_at: string | null;
  archived_at: string | null;
  resolved_at: string | null;
  dismissed_at: string | null;
  expired_at: string | null;
}): AttentionItemDerivedFlags {
  return {
    isAcknowledged: row.acknowledged_at != null,
    isArchived: row.archived_at != null,
    isTerminal: isTerminalAttentionStatus(row.status),
    isResolved: row.resolved_at != null || row.status === "resolved",
    isDismissed: row.dismissed_at != null || row.status === "dismissed",
    isExpired: row.expired_at != null || row.status === "expired",
  };
}

function deriveAgeCalendarDays(
  firstDetectedAt: string,
  evaluatedAt?: string | null,
): number | null {
  if (!evaluatedAt) {
    return null;
  }
  const start = new Date(firstDetectedAt);
  const end = new Date(evaluatedAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }
  return utcCalendarDaysBetween(start, end);
}

function sanitizeEventPayload(payload: Json): Record<string, unknown> | null {
  if (payload == null || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const safe: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      safe[key] = value;
    }
  }
  return Object.keys(safe).length > 0 ? safe : null;
}

function resolveAttentionSource(row: {
  source_type?: string | null;
  source_entity_id?: string | null;
  enrollment_id: string | null;
}): { sourceType: import("@/features/attention/domain/types").AttentionSourceType; sourceEntityId: string } {
  const sourceType = isAttentionSourceType(row.source_type ?? "")
    ? row.source_type as import("@/features/attention/domain/types").AttentionSourceType
    : ATTENTION_PRIMARY_SOURCE_TYPE;
  const sourceEntityId = row.source_entity_id ?? row.enrollment_id;
  return {
    sourceType,
    sourceEntityId: sourceEntityId ?? "",
  };
}

export function mapAttentionEnrollmentSummary(
  row: AttentionEnrollmentSummaryRow,
): AttentionEnrollmentSummary {
  return {
    id: row.id,
    status: row.status,
    archivedAt: row.archived_at,
    customerId: row.customer_id,
    programId: row.program_id,
  };
}

export function mapAttentionCustomerSummary(
  row: AttentionCustomerSummaryRow,
): AttentionCustomerSummary {
  return {
    id: row.id,
    displayName: row.display_name,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

export function mapAttentionProgramSummary(
  row: AttentionProgramSummaryRow,
): AttentionProgramSummary {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

export function mapAttentionProjectSummary(
  row: AttentionProjectSummaryRow,
): AttentionProjectSummary {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    archivedAt: row.archived_at,
  };
}

export function mapAttentionTaskSummary(
  row: AttentionTaskSummaryRow,
): AttentionTaskSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    dueAt: row.due_at,
  };
}

export function mapAttentionWorkOrderSummary(
  row: AttentionWorkOrderSummaryRow,
): AttentionWorkOrderSummary {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    siteId: row.site_id,
    scheduledFor: row.scheduled_for,
  };
}

export function mapAttentionItemListItem(
  row: AttentionItemListRow,
  options?: {
    customerDisplayName?: string | null;
    programName?: string | null;
    projectName?: string | null;
    productName?: string | null;
    assigneeDisplayName?: string | null;
    primarySignalOrigin?: AttentionItemListItemReadModel["primarySignalOrigin"];
    primaryRuleKey?: AttentionItemListItemReadModel["primaryRuleKey"];
    evaluatedAt?: string | null;
  },
): AttentionMapResult<AttentionItemListItemReadModel> {
  const status = requireStatus(row.status);
  if (!status.ok) {
    return status;
  }
  const severity = requireSeverity(row.severity);
  if (!severity.ok) {
    return severity;
  }

  const source = resolveAttentionSource(row);

  return {
    ok: true,
    data: {
      id: row.id,
      organizationId: row.organization_id,
      sourceType: source.sourceType,
      sourceEntityId: source.sourceEntityId,
      enrollmentId: row.enrollment_id,
      customerId: row.customer_id,
      programId: row.program_id,
      projectId: row.project_id,
      taskId: row.task_id,
      workOrderId: row.work_order_id ?? null,
      productId: row.product_id ?? null,
      orderId: row.order_id ?? null,
      title: row.title,
      summary: row.summary,
      status: status.data,
      severity: severity.data,
      assigneeMemberId: row.assignee_member_id,
      acknowledgedAt: row.acknowledged_at,
      isAcknowledged: row.acknowledged_at != null,
      firstDetectedAt: row.first_detected_at,
      lastDetectedAt: row.last_detected_at,
      detectionCount: row.detection_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      resolvedAt: row.resolved_at,
      dismissedAt: row.dismissed_at,
      expiredAt: row.expired_at,
      archivedAt: row.archived_at,
      ageCalendarDays: deriveAgeCalendarDays(
        row.first_detected_at,
        options?.evaluatedAt,
      ),
      customerDisplayName: options?.customerDisplayName ?? null,
      programName: options?.programName ?? null,
      projectName: options?.projectName ?? null,
      productName: options?.productName ?? null,
      assigneeDisplayName: options?.assigneeDisplayName ?? null,
      primarySignalOrigin: options?.primarySignalOrigin ?? null,
      primaryRuleKey: options?.primaryRuleKey ?? null,
      derived: buildDerivedFlags({
        status: status.data,
        acknowledged_at: row.acknowledged_at,
        archived_at: row.archived_at,
        resolved_at: row.resolved_at,
        dismissed_at: row.dismissed_at,
        expired_at: row.expired_at,
      }),
    },
  };
}

function parseSignalEvidence(
  evidence: Json,
): AttentionMapResult<AttentionSignalEvidence> {
  if (evidence == null || typeof evidence !== "object" || Array.isArray(evidence)) {
    return {
      ok: false,
      error: invalidStateError("Invalid attention signal evidence from database."),
    };
  }

  const kind = evidence.kind;
  if (
    kind !== "manual_note" &&
    kind !== "stale_progress" &&
    kind !== "generic"
  ) {
    return {
      ok: false,
      error: invalidStateError("Invalid attention signal evidence from database."),
    };
  }

  const candidate: AttentionSignalEvidence = {
    kind,
  };

  if ("note" in evidence && evidence.note != null) {
    if (typeof evidence.note !== "string") {
      return {
        ok: false,
        error: invalidStateError("Invalid attention signal evidence from database."),
      };
    }
    candidate.note = evidence.note;
  }

  if ("referenceOccurredAt" in evidence) {
    if (
      evidence.referenceOccurredAt != null &&
      typeof evidence.referenceOccurredAt !== "string"
    ) {
      return {
        ok: false,
        error: invalidStateError("Invalid attention signal evidence from database."),
      };
    }
    candidate.referenceOccurredAt =
      (evidence.referenceOccurredAt as string | null | undefined) ?? null;
  }

  if ("evaluationOccurredAt" in evidence && evidence.evaluationOccurredAt != null) {
    if (typeof evidence.evaluationOccurredAt !== "string") {
      return {
        ok: false,
        error: invalidStateError("Invalid attention signal evidence from database."),
      };
    }
    candidate.evaluationOccurredAt = evidence.evaluationOccurredAt;
  }

  if ("ageCalendarDays" in evidence && evidence.ageCalendarDays != null) {
    if (typeof evidence.ageCalendarDays !== "number") {
      return {
        ok: false,
        error: invalidStateError("Invalid attention signal evidence from database."),
      };
    }
    candidate.ageCalendarDays = evidence.ageCalendarDays;
  }

  if ("citedProgressFactIds" in evidence && evidence.citedProgressFactIds != null) {
    if (
      !Array.isArray(evidence.citedProgressFactIds) ||
      !evidence.citedProgressFactIds.every((id) => typeof id === "string")
    ) {
      return {
        ok: false,
        error: invalidStateError("Invalid attention signal evidence from database."),
      };
    }
    candidate.citedProgressFactIds = evidence.citedProgressFactIds as string[];
  }

  const evidenceResult = validateAttentionSignalEvidence(candidate);
  if (!evidenceResult.ok) {
    return {
      ok: false,
      error: invalidStateError("Invalid attention signal evidence from database."),
    };
  }

  return { ok: true, data: evidenceResult.value };
}

export function mapAttentionSignal(
  row: AttentionSignalRow,
): AttentionMapResult<AttentionSignalReadModel> {
  if (!isAttentionSignalOrigin(row.signal_origin)) {
    return {
      ok: false,
      error: invalidStateError("Unknown attention signal origin from database."),
    };
  }

  if (row.rule_key != null && !isAttentionRuleKey(row.rule_key)) {
    return {
      ok: false,
      error: invalidStateError("Unknown attention rule key from database."),
    };
  }

  const evidence = parseSignalEvidence(row.evidence);
  if (!evidence.ok) {
    return evidence;
  }

  return {
    ok: true,
    data: {
      id: row.id,
      organizationId: row.organization_id,
      attentionItemId: row.attention_item_id,
      enrollmentId: row.enrollment_id,
      signalOrigin: row.signal_origin,
      ruleKey: row.rule_key,
      explanation: row.explanation,
      evidence: evidence.data,
      detectedAt: row.detected_at,
      createdByMemberId: row.created_by_member_id,
      createdAt: row.created_at,
    },
  };
}

export function mapAttentionEvent(
  row: AttentionEventRow,
): AttentionMapResult<AttentionEventReadModel> {
  if (!isAttentionEventType(row.event_type)) {
    return {
      ok: false,
      error: invalidStateError("Unknown attention event type from database."),
    };
  }
  if (!isAttentionEventSource(row.source)) {
    return {
      ok: false,
      error: invalidStateError("Unknown attention event source from database."),
    };
  }

  const fromStatus = requireNullableStatus(row.from_status);
  if (!fromStatus.ok) {
    return fromStatus;
  }
  const toStatus = requireNullableStatus(row.to_status);
  if (!toStatus.ok) {
    return toStatus;
  }
  const fromSeverity = requireNullableSeverity(row.from_severity);
  if (!fromSeverity.ok) {
    return fromSeverity;
  }
  const toSeverity = requireNullableSeverity(row.to_severity);
  if (!toSeverity.ok) {
    return toSeverity;
  }

  return {
    ok: true,
    data: {
      id: row.id,
      organizationId: row.organization_id,
      attentionItemId: row.attention_item_id,
      eventType: row.event_type,
      actorMemberId: row.actor_member_id,
      createdAt: row.created_at,
      fromStatus: fromStatus.data,
      toStatus: toStatus.data,
      fromSeverity: fromSeverity.data,
      toSeverity: toSeverity.data,
      fromAssigneeMemberId: row.from_assignee_member_id,
      toAssigneeMemberId: row.to_assignee_member_id,
      reason: row.reason,
      source: row.source,
      payload: sanitizeEventPayload(row.payload),
    },
  };
}

export function mapAttentionItemDetail(
  row: AttentionItemDetailRow,
  related?: {
    enrollment?: AttentionEnrollmentSummary | null;
    customer?: AttentionCustomerSummary | null;
    program?: AttentionProgramSummary | null;
    project?: AttentionProjectSummary | null;
    task?: AttentionTaskSummary | null;
    workOrder?: AttentionWorkOrderSummary | null;
    signals?: AttentionSignalReadModel[];
    events?: AttentionEventReadModel[];
    evaluatedAt?: string | null;
  },
): AttentionMapResult<AttentionItemDetailReadModel> {
  const status = requireStatus(row.status);
  if (!status.ok) {
    return status;
  }
  const severity = requireSeverity(row.severity);
  if (!severity.ok) {
    return severity;
  }

  const source = resolveAttentionSource(row);

  return {
    ok: true,
    data: {
      id: row.id,
      organizationId: row.organization_id,
      sourceType: source.sourceType,
      sourceEntityId: source.sourceEntityId,
      enrollmentId: row.enrollment_id,
      customerId: row.customer_id,
      programId: row.program_id,
      projectId: row.project_id,
      taskId: row.task_id,
      workOrderId: row.work_order_id ?? null,
      productId: row.product_id ?? null,
      orderId: row.order_id ?? null,
      socialActionHref: null,
      title: row.title,
      summary: row.summary,
      status: status.data,
      severity: severity.data,
      assigneeMemberId: row.assignee_member_id,
      dedupeKey: row.dedupe_key,
      detectionCount: row.detection_count,
      firstDetectedAt: row.first_detected_at,
      lastDetectedAt: row.last_detected_at,
      acknowledgedAt: row.acknowledged_at,
      isAcknowledged: row.acknowledged_at != null,
      resolvedAt: row.resolved_at,
      dismissedAt: row.dismissed_at,
      expiredAt: row.expired_at,
      archivedAt: row.archived_at,
      resolutionReason: row.resolution_reason,
      dismissalReason: row.dismissal_reason,
      createdByMemberId: row.created_by_member_id,
      updatedByMemberId: row.updated_by_member_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ageCalendarDays: deriveAgeCalendarDays(
        row.first_detected_at,
        related?.evaluatedAt,
      ),
      enrollment: related?.enrollment ?? null,
      customer: related?.customer ?? null,
      program: related?.program ?? null,
      project: related?.project ?? null,
      task: related?.task ?? null,
      workOrder: related?.workOrder ?? null,
      signals: related?.signals ?? [],
      events: related?.events ?? [],
      derived: buildDerivedFlags({
        status: status.data,
        acknowledged_at: row.acknowledged_at,
        archived_at: row.archived_at,
        resolved_at: row.resolved_at,
        dismissed_at: row.dismissed_at,
        expired_at: row.expired_at,
      }),
    },
  };
}
