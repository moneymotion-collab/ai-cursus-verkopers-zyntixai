import { ATTENTION_PRIMARY_SOURCE_TYPE } from "@/features/attention/domain/source";
import type { AttentionRuleKey } from "@/features/attention/domain/types";
import { ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY } from "@/features/attention/domain/signal";

export type AttentionDedupeIdentity = {
  organizationId: string;
  enrollmentId: string;
  signalKey: AttentionRuleKey | "manual";
};

export type AttentionSourceDedupeIdentity = {
  organizationId: string;
  sourceType: "enrollment" | "social_publication" | "social_connection";
  sourceEntityId: string;
  signalKey: AttentionRuleKey | "manual";
};

/**
 * Domain invariant:
 * At most one *non-terminal* Attention Item per dedupe key.
 * Terminal Items do not block a later new Item for a new incident.
 *
 * Enforcement:
 * - B1.7.1: pure key builder + documented invariant only
 * - B1.7.2+: unique partial index / constraint on open+acknowledged
 * - B1.7.3+: transactional RPC upsert / conflict handling
 */
export function buildAttentionDedupeKey(identity: AttentionDedupeIdentity): string {
  const organizationId = identity.organizationId.trim();
  const enrollmentId = identity.enrollmentId.trim();
  const signalKey = identity.signalKey;

  return [
    "attention",
    ATTENTION_PRIMARY_SOURCE_TYPE,
    organizationId,
    enrollmentId,
    signalKey,
  ].join(":");
}

export function buildRuleAttentionDedupeKey(params: {
  organizationId: string;
  enrollmentId: string;
  ruleKey?: AttentionRuleKey;
}): string {
  return buildAttentionDedupeKey({
    organizationId: params.organizationId,
    enrollmentId: params.enrollmentId,
    signalKey: params.ruleKey ?? ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY,
  });
}

export function buildManualAttentionDedupeKey(params: {
  organizationId: string;
  enrollmentId: string;
}): string {
  return buildAttentionDedupeKey({
    organizationId: params.organizationId,
    enrollmentId: params.enrollmentId,
    signalKey: "manual",
  });
}

export function buildAttentionSourceDedupeKey(
  identity: AttentionSourceDedupeIdentity,
): string {
  return [
    "attention",
    identity.sourceType,
    identity.organizationId.trim(),
    identity.sourceEntityId.trim(),
    identity.signalKey,
  ].join(":");
}

/** True when an existing non-terminal Item with this key blocks creating another. */
export function isNonTerminalDedupeConflict(params: {
  existingItemStatus: "open" | "acknowledged" | "resolved" | "dismissed" | "expired";
  existingDedupeKey: string;
  candidateDedupeKey: string;
}): boolean {
  if (params.existingDedupeKey !== params.candidateDedupeKey) {
    return false;
  }
  return (
    params.existingItemStatus === "open" ||
    params.existingItemStatus === "acknowledged"
  );
}
