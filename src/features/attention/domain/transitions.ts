import {
  isAllowedAttentionStatusTransition,
  isTerminalAttentionStatus,
} from "@/features/attention/domain/status";
import type {
  AttentionDomainResult,
  AttentionItemStatus,
} from "@/features/attention/domain/types";

export type AttentionTransitionEvaluation =
  | { outcome: "noop" }
  | { outcome: "allowed" }
  | {
      outcome: "denied";
      code: "INVALID_TRANSITION" | "TERMINAL_ITEM";
      message: string;
    };

/**
 * Pure lifecycle evaluation. No role checks. No DB.
 * Same-status → noop (idempotent). Terminal → denied.
 */
export function evaluateAttentionStatusTransition(
  fromStatus: AttentionItemStatus,
  toStatus: AttentionItemStatus,
): AttentionTransitionEvaluation {
  if (fromStatus === toStatus) {
    return { outcome: "noop" };
  }

  if (isTerminalAttentionStatus(fromStatus)) {
    return {
      outcome: "denied",
      code: "TERMINAL_ITEM",
      message: "Terminal Attention Items cannot change status.",
    };
  }

  if (!isAllowedAttentionStatusTransition(fromStatus, toStatus)) {
    return {
      outcome: "denied",
      code: "INVALID_TRANSITION",
      message: `Transition from ${fromStatus} to ${toStatus} is not allowed.`,
    };
  }

  return { outcome: "allowed" };
}

export function canTransitionAttentionStatus(
  fromStatus: AttentionItemStatus,
  toStatus: AttentionItemStatus,
): boolean {
  return evaluateAttentionStatusTransition(fromStatus, toStatus).outcome === "allowed";
}

export function assertAttentionStatusTransition(
  fromStatus: AttentionItemStatus,
  toStatus: AttentionItemStatus,
): AttentionDomainResult<{ outcome: "noop" | "allowed" }> {
  const evaluation = evaluateAttentionStatusTransition(fromStatus, toStatus);
  if (evaluation.outcome === "denied") {
    return {
      ok: false,
      error: {
        code: evaluation.code,
        message: evaluation.message,
      },
    };
  }
  return { ok: true, value: { outcome: evaluation.outcome } };
}
