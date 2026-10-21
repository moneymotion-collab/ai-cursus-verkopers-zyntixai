import type { AttentionItemStatus } from "@/features/attention/domain/types";

export const ATTENTION_ITEM_STATUSES = [
  "open",
  "acknowledged",
  "resolved",
  "dismissed",
  "expired",
] as const satisfies readonly AttentionItemStatus[];

export const TERMINAL_ATTENTION_ITEM_STATUSES = [
  "resolved",
  "dismissed",
  "expired",
] as const satisfies readonly AttentionItemStatus[];

export const NON_TERMINAL_ATTENTION_ITEM_STATUSES = [
  "open",
  "acknowledged",
] as const satisfies readonly AttentionItemStatus[];

const STATUS_LABELS: Record<AttentionItemStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  dismissed: "Dismissed",
  expired: "Expired",
};

/**
 * Mirrors B1.7.0 transition matrix (domain hints only; RPC enforcement later).
 * Same-status is not an allowed transition (use evaluate helper for noop).
 */
const ALLOWED_TRANSITIONS: Record<
  AttentionItemStatus,
  readonly AttentionItemStatus[]
> = {
  open: ["acknowledged", "resolved", "dismissed", "expired"],
  acknowledged: ["resolved", "dismissed", "expired"],
  resolved: [],
  dismissed: [],
  expired: [],
};

export function isAttentionItemStatus(
  value: string,
): value is AttentionItemStatus {
  return (ATTENTION_ITEM_STATUSES as readonly string[]).includes(value);
}

export function isTerminalAttentionStatus(status: AttentionItemStatus): boolean {
  return (TERMINAL_ATTENTION_ITEM_STATUSES as readonly string[]).includes(status);
}

export function isNonTerminalAttentionStatus(
  status: AttentionItemStatus,
): boolean {
  return (NON_TERMINAL_ATTENTION_ITEM_STATUSES as readonly string[]).includes(
    status,
  );
}

export function getAttentionItemStatusLabel(status: AttentionItemStatus): string {
  return STATUS_LABELS[status];
}

export function getAllowedAttentionStatusTransitions(
  fromStatus: AttentionItemStatus,
): AttentionItemStatus[] {
  return [...ALLOWED_TRANSITIONS[fromStatus]];
}

export function isAllowedAttentionStatusTransition(
  fromStatus: AttentionItemStatus,
  toStatus: AttentionItemStatus,
): boolean {
  if (fromStatus === toStatus) {
    return false;
  }
  return ALLOWED_TRANSITIONS[fromStatus].includes(toStatus);
}
