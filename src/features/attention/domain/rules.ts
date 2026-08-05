import { ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY } from "@/features/attention/domain/signal";
import type { AttentionRuleKey } from "@/features/attention/domain/types";

/** Platform default for enrollment_no_recent_progress (B1.7.0 locked). */
export const STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS = 14 as const;

export const STALE_PROGRESS_THRESHOLD_UNIT = "calendar_days" as const;

export const STALE_PROGRESS_TIMEZONE_BASIS = "UTC" as const;

export const STALE_PROGRESS_FALLBACK = "enrollment_created_at" as const;

export const STALE_PROGRESS_ELIGIBLE_ENROLLMENT_STATUSES = [
  "active",
  "paused",
] as const;

export type StaleProgressEligibleEnrollmentStatus =
  (typeof STALE_PROGRESS_ELIGIBLE_ENROLLMENT_STATUSES)[number];

export type StaleProgressRuleConfig = {
  ruleKey: typeof ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY;
  thresholdCalendarDays: typeof STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS;
  unit: typeof STALE_PROGRESS_THRESHOLD_UNIT;
  timezoneBasis: typeof STALE_PROGRESS_TIMEZONE_BASIS;
  fallback: typeof STALE_PROGRESS_FALLBACK;
};

export const ENROLLMENT_NO_RECENT_PROGRESS_CONFIG = {
  ruleKey: ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY,
  thresholdCalendarDays: STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS,
  unit: STALE_PROGRESS_THRESHOLD_UNIT,
  timezoneBasis: STALE_PROGRESS_TIMEZONE_BASIS,
  fallback: STALE_PROGRESS_FALLBACK,
} as const satisfies StaleProgressRuleConfig;

export function isStaleProgressEligibleEnrollmentStatus(
  status: string,
): status is StaleProgressEligibleEnrollmentStatus {
  return (STALE_PROGRESS_ELIGIBLE_ENROLLMENT_STATUSES as readonly string[]).includes(
    status,
  );
}

export function isRelease1AttentionRuleKey(
  value: string,
): value is AttentionRuleKey {
  return value === ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY;
}
