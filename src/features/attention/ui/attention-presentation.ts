import type {
  AttentionEventReadModel,
  AttentionItemDetailReadModel,
  AttentionItemListItemReadModel,
  AttentionSignalReadModel,
} from "@/features/attention/domain/read-types";
import {
  getAttentionItemStatusLabel,
  isAttentionItemStatus,
} from "@/features/attention/domain/status";
import {
  getAttentionSeverityLabel,
  isAttentionSeverity,
} from "@/features/attention/domain/severity";
import type {
  AttentionApplicationError,
  AttentionEventType,
  AttentionItemStatus,
  AttentionSeverity,
  AttentionSignalOrigin,
} from "@/features/attention/domain/types";
import { buildAttentionDetailHref } from "@/features/attention/domain/attention-navigation";

export function formatAttentionDate(
  isoTimestamp: string,
  timeZone: string,
): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoTimestamp));
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(isoTimestamp));
  }
}

export function formatOptionalAttentionDate(
  isoTimestamp: string | null | undefined,
  timeZone: string,
): string | null {
  if (!isoTimestamp) {
    return null;
  }
  return formatAttentionDate(isoTimestamp, timeZone);
}

export function resolveAttentionTitleLabel(title: string | null | undefined): string {
  const trimmed = title?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Untitled attention item";
}

export function resolveAttentionCustomerLabel(
  displayName: string | null | undefined,
): string {
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unknown customer";
}

export function resolveSocialAttentionSourceLabel(
  sourceType: string | null | undefined,
): string {
  if (sourceType === "social_publication") return "Instagram publication";
  if (sourceType === "social_connection") return "Instagram account";
  return "Social";
}

export function resolveAttentionProgramLabel(
  name: string | null | undefined,
): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unknown program";
}

export function resolveAttentionProjectLabel(
  name: string | null | undefined,
): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unknown project";
}

export function resolveAttentionAssigneeLabel(
  displayName: string | null | undefined,
  assigneeMemberId: string | null | undefined,
): string {
  if (!assigneeMemberId) {
    return "Unassigned";
  }
  const trimmed = displayName?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unavailable member";
}

export function resolveAttentionStatusLabel(
  status: AttentionItemStatus | string,
): string {
  if (isAttentionItemStatus(status)) {
    return getAttentionItemStatusLabel(status);
  }
  return "Unavailable";
}

export function resolveAttentionSeverityLabel(
  severity: AttentionSeverity | string,
): string {
  if (isAttentionSeverity(severity)) {
    return getAttentionSeverityLabel(severity);
  }
  return "Unavailable";
}

export function resolveAttentionAcknowledgementLabel(item: {
  isAcknowledged: boolean;
  acknowledgedAt: string | null;
  timeZone: string;
}): string {
  if (!item.isAcknowledged) {
    return "Not acknowledged";
  }
  if (!item.acknowledgedAt) {
    return "Acknowledged";
  }
  return `Acknowledged ${formatAttentionDate(item.acknowledgedAt, item.timeZone)}`;
}

export type AttentionListItemPresentation = {
  id: string;
  detailHref: string;
  titleLabel: string;
  statusLabel: string;
  severityLabel: string;
  customerLabel: string;
  programLabel: string;
  assigneeLabel: string;
  acknowledgementLabel: string;
  lastDetectedAtLabel: string;
  isArchived: boolean;
  isTerminal: boolean;
};

export function toAttentionListItemPresentation(
  item: AttentionItemListItemReadModel,
  options: {
    organizationId?: string;
    timeZone: string;
  },
): AttentionListItemPresentation {
  return {
    id: item.id,
    detailHref: buildAttentionDetailHref(item.id, options.organizationId),
    titleLabel: resolveAttentionTitleLabel(item.title),
    statusLabel: resolveAttentionStatusLabel(item.status),
    severityLabel: resolveAttentionSeverityLabel(item.severity),
    customerLabel:
      item.sourceType === "enrollment"
        ? resolveAttentionCustomerLabel(item.customerDisplayName)
        : item.sourceType === "project" || item.sourceType === "work_order"
          ? resolveAttentionProjectLabel(item.projectName)
          : resolveSocialAttentionSourceLabel(item.sourceType),
    programLabel:
      item.sourceType === "enrollment"
        ? resolveAttentionProgramLabel(item.programName)
        : item.sourceType === "project" || item.sourceType === "work_order"
          ? item.sourceType === "work_order" ? "Work order" : "Project"
          : "Social",
    assigneeLabel: resolveAttentionAssigneeLabel(
      item.assigneeDisplayName,
      item.assigneeMemberId,
    ),
    acknowledgementLabel: resolveAttentionAcknowledgementLabel({
      isAcknowledged: item.isAcknowledged,
      acknowledgedAt: item.acknowledgedAt,
      timeZone: options.timeZone,
    }),
    lastDetectedAtLabel: formatAttentionDate(item.lastDetectedAt, options.timeZone),
    isArchived: item.derived.isArchived,
    isTerminal: item.derived.isTerminal,
  };
}

export type AttentionDetailPresentation = {
  id: string;
  titleLabel: string;
  summaryLabel: string | null;
  statusLabel: string;
  severityLabel: string;
  attentionTypeLabel: string;
  customerLabel: string;
  programLabel: string;
  enrollmentStatusLabel: string | null;
  assigneeLabel: string;
  acknowledgementLabel: string;
  firstDetectedAtLabel: string;
  lastDetectedAtLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
  resolvedAtLabel: string | null;
  dismissedAtLabel: string | null;
  expiredAtLabel: string | null;
  archivedAtLabel: string | null;
  resolutionReasonLabel: string | null;
  dismissalReasonLabel: string | null;
  detectionCountLabel: string;
  isArchived: boolean;
  isTerminal: boolean;
  severityKey: AttentionSeverity;
  statusKey: AttentionItemStatus;
};

export function resolveAttentionTypeLabelFromDetail(
  item: AttentionItemDetailReadModel,
): string {
  const primarySignal = item.signals[0];
  if (primarySignal?.ruleKey === "enrollment_no_recent_progress") {
    return "No recent progress";
  }
  if (primarySignal?.ruleKey === "scheduled_publication_missed") {
    return "Missed scheduled publication";
  }
  if (primarySignal?.ruleKey === "publication_result_unknown") {
    return "Unknown publish result";
  }
  if (primarySignal?.ruleKey === "social_account_reauthorization_required") {
    return "Account reconnection required";
  }
  if (primarySignal?.ruleKey === "provider_permission_missing") {
    return "Publish permission missing";
  }
  if (primarySignal?.ruleKey === "scheduled_publication_failed") {
    return "Scheduled publication failed";
  }
  if (primarySignal?.ruleKey === "project_overdue_active") {
    return "Project overdue";
  }
  if (primarySignal?.ruleKey === "project_task_overdue") {
    return "Task overdue";
  }
  if (primarySignal?.ruleKey === "project_no_owner") {
    return "No project owner";
  }
  if (primarySignal?.ruleKey === "work_order_overdue") {
    return "Work order overdue";
  }
  if (primarySignal?.ruleKey === "work_order_unassigned") {
    return "Work order unassigned";
  }
  if (primarySignal?.signalOrigin === "manual") {
    return "Manual signal";
  }
  if (primarySignal?.signalOrigin === "rule") {
    return "Rule signal";
  }
  if (item.sourceType === "social_publication") return "Instagram publication";
  if (item.sourceType === "social_connection") return "Instagram account";
  if (item.sourceType === "project") return "Project";
  if (item.sourceType === "work_order") return "Work order";
  return item.sourceType === "enrollment" ? "Enrollment" : "Attention";
}

export function toAttentionDetailPresentation(
  item: AttentionItemDetailReadModel,
  options: {
    timeZone: string;
    assigneeDisplayName?: string | null;
  },
): AttentionDetailPresentation {
  const customerName = item.customer?.displayName ?? null;
  const programName = item.program?.name ?? null;
  const projectName = item.project?.name ?? null;
  const enrollmentStatus = item.enrollment?.status ?? null;

  return {
    id: item.id,
    titleLabel: resolveAttentionTitleLabel(item.title),
    summaryLabel: item.summary?.trim() ? item.summary.trim() : null,
    statusLabel: resolveAttentionStatusLabel(item.status),
    severityLabel: resolveAttentionSeverityLabel(item.severity),
    attentionTypeLabel: resolveAttentionTypeLabelFromDetail(item),
    customerLabel:
      item.sourceType === "enrollment"
        ? resolveAttentionCustomerLabel(customerName)
        : item.sourceType === "project" || item.sourceType === "work_order"
          ? resolveAttentionProjectLabel(projectName)
          : resolveSocialAttentionSourceLabel(item.sourceType),
    programLabel:
      item.sourceType === "enrollment"
        ? resolveAttentionProgramLabel(programName)
        : item.sourceType === "project" || item.sourceType === "work_order"
          ? item.sourceType === "work_order" ? "Work order" : "Project"
          : "Social",
    enrollmentStatusLabel: enrollmentStatus
      ? enrollmentStatus.charAt(0).toUpperCase() + enrollmentStatus.slice(1)
      : null,
    assigneeLabel: resolveAttentionAssigneeLabel(
      options.assigneeDisplayName,
      item.assigneeMemberId,
    ),
    acknowledgementLabel: resolveAttentionAcknowledgementLabel({
      isAcknowledged: item.isAcknowledged,
      acknowledgedAt: item.acknowledgedAt,
      timeZone: options.timeZone,
    }),
    firstDetectedAtLabel: formatAttentionDate(item.firstDetectedAt, options.timeZone),
    lastDetectedAtLabel: formatAttentionDate(item.lastDetectedAt, options.timeZone),
    createdAtLabel: formatAttentionDate(item.createdAt, options.timeZone),
    updatedAtLabel: formatAttentionDate(item.updatedAt, options.timeZone),
    resolvedAtLabel: formatOptionalAttentionDate(item.resolvedAt, options.timeZone),
    dismissedAtLabel: formatOptionalAttentionDate(item.dismissedAt, options.timeZone),
    expiredAtLabel: formatOptionalAttentionDate(item.expiredAt, options.timeZone),
    archivedAtLabel: formatOptionalAttentionDate(item.archivedAt, options.timeZone),
    resolutionReasonLabel: item.resolutionReason?.trim()
      ? item.resolutionReason.trim()
      : null,
    dismissalReasonLabel: item.dismissalReason?.trim()
      ? item.dismissalReason.trim()
      : null,
    detectionCountLabel: String(item.detectionCount),
    isArchived: item.derived.isArchived,
    isTerminal: item.derived.isTerminal,
    severityKey: item.severity,
    statusKey: item.status,
  };
}

const ATTENTION_EVENT_TYPE_LABELS: Record<AttentionEventType, string> = {
  created: "Created",
  status_changed: "Status changed",
  assigned: "Assigned",
  severity_changed: "Severity changed",
  signal_recorded: "Signal recorded",
  archived: "Archived",
  detection_updated: "Detection updated",
};

export function resolveAttentionEventTypeLabel(
  eventType: AttentionEventType | string,
): string {
  if (eventType in ATTENTION_EVENT_TYPE_LABELS) {
    return ATTENTION_EVENT_TYPE_LABELS[eventType as AttentionEventType];
  }
  return "Event";
}

export function resolveAttentionSignalOriginLabel(
  origin: AttentionSignalOrigin | string,
): string {
  if (origin === "manual") {
    return "Manual";
  }
  if (origin === "rule") {
    return "Rule";
  }
  return "Signal";
}

export type AttentionTimelineEventPresentation = {
  id: string;
  eventTypeLabel: string;
  createdAt: string;
  createdAtLabel: string;
  actorLabel: string | null;
  summaryLabel: string | null;
  reasonLabel: string | null;
  sourceLabel: string;
};

function appendTransition(
  parts: string[],
  label: string,
  fromLabel: string | null,
  toLabel: string | null,
): void {
  if (!fromLabel && !toLabel) {
    return;
  }
  if (fromLabel && toLabel) {
    parts.push(`${label}: ${fromLabel} → ${toLabel}`);
    return;
  }
  parts.push(`${label}: ${toLabel ?? fromLabel}`);
}

/**
 * Maps authorized event read models to safe timeline rows.
 * Never includes raw payload / audit JSON.
 */
export function toAttentionTimelineEventPresentation(
  event: AttentionEventReadModel,
  options: {
    timeZone: string;
    actorLabel: string | null;
    fromAssigneeLabel: string | null;
    toAssigneeLabel: string | null;
  },
): AttentionTimelineEventPresentation {
  const parts: string[] = [];
  appendTransition(
    parts,
    "Status",
    event.fromStatus ? resolveAttentionStatusLabel(event.fromStatus) : null,
    event.toStatus ? resolveAttentionStatusLabel(event.toStatus) : null,
  );
  appendTransition(
    parts,
    "Severity",
    event.fromSeverity ? resolveAttentionSeverityLabel(event.fromSeverity) : null,
    event.toSeverity ? resolveAttentionSeverityLabel(event.toSeverity) : null,
  );
  appendTransition(
    parts,
    "Assignee",
    options.fromAssigneeLabel,
    options.toAssigneeLabel,
  );

  const reason = event.reason?.trim() ? event.reason.trim() : null;

  return {
    id: event.id,
    eventTypeLabel: resolveAttentionEventTypeLabel(event.eventType),
    createdAt: event.createdAt,
    createdAtLabel: formatAttentionDate(event.createdAt, options.timeZone),
    actorLabel: options.actorLabel,
    summaryLabel: parts.length > 0 ? parts.join(" · ") : null,
    reasonLabel: reason,
    sourceLabel:
      event.source === "manual"
        ? "Manual"
        : event.source === "rule"
          ? "Rule"
          : "System",
  };
}

export type AttentionSignalPresentation = {
  id: string;
  originLabel: string;
  ruleLabel: string | null;
  explanationLabel: string | null;
  detectedAt: string;
  detectedAtLabel: string;
};

export function toAttentionSignalPresentation(
  signal: AttentionSignalReadModel,
  options: { timeZone: string },
): AttentionSignalPresentation {
  let ruleLabel: string | null = null;
  if (signal.ruleKey === "enrollment_no_recent_progress") {
    ruleLabel = "No recent progress";
  } else if (signal.ruleKey) {
    ruleLabel = signal.ruleKey;
  }

  return {
    id: signal.id,
    originLabel: resolveAttentionSignalOriginLabel(signal.signalOrigin),
    ruleLabel,
    explanationLabel: signal.explanation?.trim()
      ? signal.explanation.trim()
      : null,
    detectedAt: signal.detectedAt,
    detectedAtLabel: formatAttentionDate(signal.detectedAt, options.timeZone),
  };
}

/**
 * Maps application errors to safe UI copy.
 * Never surfaces raw causes, SQL, or security codes to end users.
 */
export function toAttentionSafeErrorPresentation(
  error: AttentionApplicationError | undefined,
  fallbackMessage = "Unable to load Attention. Please try again.",
): { title: string; message: string; retryable: boolean } {
  if (!error) {
    return { title: "Something went wrong", message: fallbackMessage, retryable: true };
  }

  switch (error.code) {
    case "AUTH_REQUIRED":
      return {
        title: "Sign in required",
        message: "Please sign in to view Attention for your organization.",
        retryable: false,
      };
    case "ORG_CONTEXT_MISSING":
      return {
        title: "Organization unavailable",
        message: "No active organization membership is available for this account.",
        retryable: false,
      };
    case "ATTENTION_ITEM_UNAVAILABLE":
    case "PERMISSION_DENIED":
    case "INSUFFICIENT_ROLE":
      return {
        title: "Attention unavailable",
        message:
          "This attention item is unavailable. It may have been removed or you may not have access.",
        retryable: false,
      };
    case "DATABASE_UNAVAILABLE":
    case "NETWORK_ERROR":
    case "TIMEOUT":
    case "RATE_LIMITED":
      return {
        title: "Unable to load Attention",
        message: "Service temporarily unavailable. Please try again.",
        retryable: true,
      };
    default:
      return {
        title: "Unable to load Attention",
        message: fallbackMessage,
        retryable: error.retryable,
      };
  }
}
