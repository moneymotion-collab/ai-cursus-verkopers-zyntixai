import type {
  AttentionRuleKey,
  AttentionSignalOrigin,
} from "@/features/attention/domain/types";

export const ATTENTION_SIGNAL_ORIGINS = [
  "manual",
  "rule",
] as const satisfies readonly AttentionSignalOrigin[];

export const ATTENTION_RULE_KEYS = [
  "enrollment_no_recent_progress",
] as const satisfies readonly AttentionRuleKey[];

export const ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY =
  "enrollment_no_recent_progress" as const satisfies AttentionRuleKey;

export function isAttentionSignalOrigin(
  value: string,
): value is AttentionSignalOrigin {
  return (ATTENTION_SIGNAL_ORIGINS as readonly string[]).includes(value);
}

export function isAttentionRuleKey(value: string): value is AttentionRuleKey {
  return (ATTENTION_RULE_KEYS as readonly string[]).includes(value);
}
