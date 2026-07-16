import type { LeadHistorySource, LeadStatus } from "@/features/leads/domain/types";

export const LEAD_STATUSES = [
  "open",
  "converted",
  "lost",
  "disqualified",
] as const satisfies readonly LeadStatus[];

/**
 * Statuses accepted by `transition_lead_status`.
 * Conversion to `converted` requires `convert_lead_to_customer`.
 */
export const LEAD_STATUS_TRANSITION_TARGETS = [
  "open",
  "lost",
  "disqualified",
] as const satisfies readonly Exclude<LeadStatus, "converted">[];

export type LeadStatusTransitionTarget = (typeof LEAD_STATUS_TRANSITION_TARGETS)[number];

export const LEAD_HISTORY_SOURCES = [
  "manual",
  "system",
  "import",
  "conversion",
] as const satisfies readonly LeadHistorySource[];

const STATUS_LABELS: Record<LeadStatus, string> = {
  open: "Open",
  converted: "Converted",
  lost: "Lost",
  disqualified: "Disqualified",
};

/**
 * Mirrors `private.is_allowed_lead_status_transition` in lead helpers.
 * Conversion is not represented here.
 */
const ALLOWED_TRANSITIONS: Record<LeadStatus, readonly LeadStatus[]> = {
  open: ["lost", "disqualified"],
  lost: ["open"],
  disqualified: ["open"],
  converted: [],
};

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export function isLeadStatusTransitionTarget(
  value: string,
): value is LeadStatusTransitionTarget {
  return (LEAD_STATUS_TRANSITION_TARGETS as readonly string[]).includes(value);
}

export function isLeadHistorySource(value: string): value is LeadHistorySource {
  return (LEAD_HISTORY_SOURCES as readonly string[]).includes(value);
}

export function getLeadStatusLabel(status: LeadStatus): string {
  return STATUS_LABELS[status];
}

export function getAllowedLeadStatusTransitions(fromStatus: LeadStatus): LeadStatus[] {
  return [...ALLOWED_TRANSITIONS[fromStatus]];
}

export function isAllowedLeadStatusTransition(
  fromStatus: LeadStatus,
  toStatus: LeadStatus,
): boolean {
  if (fromStatus === toStatus) {
    return false;
  }

  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}

export function isTerminalLeadStatus(status: LeadStatus): boolean {
  return status === "converted";
}

export function isConvertibleLeadStatus(status: LeadStatus): boolean {
  return status === "open";
}
