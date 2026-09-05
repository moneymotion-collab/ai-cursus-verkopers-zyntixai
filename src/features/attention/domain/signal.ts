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
  "scheduled_publication_missed",
  "publication_result_unknown",
  "social_account_reauthorization_required",
  "provider_permission_missing",
  "scheduled_publication_failed",
  "project_overdue_active",
  "project_task_overdue",
  "project_no_owner",
  "work_order_overdue",
  "work_order_unassigned",
] as const satisfies readonly AttentionRuleKey[];

export const ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY =
  "enrollment_no_recent_progress" as const satisfies AttentionRuleKey;

export const SCHEDULED_PUBLICATION_MISSED_RULE_KEY =
  "scheduled_publication_missed" as const satisfies AttentionRuleKey;

export const PUBLICATION_RESULT_UNKNOWN_RULE_KEY =
  "publication_result_unknown" as const satisfies AttentionRuleKey;

export function isAttentionSignalOrigin(
  value: string,
): value is AttentionSignalOrigin {
  return (ATTENTION_SIGNAL_ORIGINS as readonly string[]).includes(value);
}

export function isAttentionRuleKey(value: string): value is AttentionRuleKey {
  return (ATTENTION_RULE_KEYS as readonly string[]).includes(value);
}
