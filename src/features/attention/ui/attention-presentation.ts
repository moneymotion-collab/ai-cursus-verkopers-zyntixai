import type {
  AttentionItemDetailReadModel,
  AttentionItemListItemReadModel,
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
  AttentionItemStatus,
  AttentionSeverity,
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

export function resolveAttentionProgramLabel(
  name: string | null | undefined,
): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "Unknown program";
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
    customerLabel: resolveAttentionCustomerLabel(item.customerDisplayName),
    programLabel: resolveAttentionProgramLabel(item.programName),
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
  customerLabel: string;
  programLabel: string;
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
  isArchived: boolean;
  isTerminal: boolean;
};

export function toAttentionDetailPresentation(
  item: AttentionItemDetailReadModel,
  options: { timeZone: string },
): AttentionDetailPresentation {
  const customerName = item.customer?.displayName ?? null;
  const programName = item.program?.name ?? null;

  return {
    id: item.id,
    titleLabel: resolveAttentionTitleLabel(item.title),
    summaryLabel: item.summary?.trim() ? item.summary.trim() : null,
    statusLabel: resolveAttentionStatusLabel(item.status),
    severityLabel: resolveAttentionSeverityLabel(item.severity),
    customerLabel: resolveAttentionCustomerLabel(customerName),
    programLabel: resolveAttentionProgramLabel(programName),
    assigneeLabel: resolveAttentionAssigneeLabel(
      null,
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
    isArchived: item.derived.isArchived,
    isTerminal: item.derived.isTerminal,
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
