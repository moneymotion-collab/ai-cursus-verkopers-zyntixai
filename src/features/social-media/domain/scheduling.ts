/**
 * SMM-B1.11-A — Publication execution-clock scheduling contracts.
 * Source of truth: social_publications.execution_mode / intended_execute_at /
 * next_attempt_at. No second schedule aggregate. No worker.
 */

import type { SocialPublicationStatus } from "./publishing";

/** Locked B1.11-D missed policy. B1.11-A records it only; does not execute it. */
export const SOCIAL_SCHEDULE_MISS_GRACE_SECONDS = 15 * 60;

export const SOCIAL_SCHEDULE_MISS_POLICY =
  "B1.11-D: scheduler may still execute up to 15 minutes late; later than 15 minutes must not auto-publish." as const;

/** Statuses that may receive schedule / reschedule / scheduled-cancel. */
export const SOCIAL_PUBLICATION_SCHEDULE_ELIGIBLE_STATUSES = [
  "pending",
  "queued",
  "failed_retryable",
] as const satisfies readonly SocialPublicationStatus[];

export type SocialPublicationScheduleEligibleStatus =
  (typeof SOCIAL_PUBLICATION_SCHEDULE_ELIGIBLE_STATUSES)[number];

export const SOCIAL_PUBLICATION_SCHEDULE_BLOCKED_STATUSES = [
  "claimed",
  "processing",
  "succeeded",
  "cancelled",
  "failed_terminal",
  "manual_intervention",
  "unknown_external_outcome",
] as const satisfies readonly SocialPublicationStatus[];

export function isSocialPublicationScheduleEligibleStatus(
  status: SocialPublicationStatus | string,
): status is SocialPublicationScheduleEligibleStatus {
  return (
    SOCIAL_PUBLICATION_SCHEDULE_ELIGIBLE_STATUSES as readonly string[]
  ).includes(status);
}

/**
 * Unambiguous instant: ISO-8601 with `T` separator and timezone (`Z` or ±HH:MM).
 * Rejects naive local strings such as `2026-10-25 02:30`.
 */
const UNAMBIGUOUS_INSTANT_RE =
  /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})(?::\d{2}(?:\.\d{1,9})?)?(Z|[+-]\d{2}:\d{2})$/;

export function parseUnambiguousExecutionInstant(
  value: string | null | undefined,
): Date | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!UNAMBIGUOUS_INSTANT_RE.test(trimmed)) {
    return null;
  }
  const ms = Date.parse(trimmed);
  if (!Number.isFinite(ms)) {
    return null;
  }
  return new Date(ms);
}

export function isFutureExecutionInstant(instant: Date, now: Date): boolean {
  return instant.getTime() > now.getTime();
}

export type SocialScheduleMutation =
  | "schedule"
  | "reschedule"
  | "cancel_scheduled";

export type SocialScheduleEligibility = {
  schedule: boolean;
  reschedule: boolean;
  cancelScheduled: boolean;
  reason: string;
};

export function resolveSocialPublicationScheduleEligibility(input: {
  status: SocialPublicationStatus | string;
  executionMode: "scheduled" | "immediate" | string;
}): SocialScheduleEligibility {
  const eligibleStatus = isSocialPublicationScheduleEligibleStatus(
    input.status,
  );
  if (!eligibleStatus) {
    return {
      schedule: false,
      reschedule: false,
      cancelScheduled: false,
      reason: "status_not_eligible",
    };
  }
  const scheduled = input.executionMode === "scheduled";
  return {
    schedule: !scheduled,
    reschedule: scheduled,
    cancelScheduled: scheduled,
    reason: scheduled ? "already_scheduled" : "schedulable",
  };
}

export type SocialScheduleRpcSuccessCode = "success" | "already_scheduled";

export const SOCIAL_SCHEDULE_RPC_SUCCESS_CODES = [
  "success",
  "already_scheduled",
] as const satisfies readonly SocialScheduleRpcSuccessCode[];

export function isSocialScheduleRpcSuccessCode(
  value: string | null | undefined,
): value is SocialScheduleRpcSuccessCode {
  return (
    value === "success" || value === "already_scheduled"
  );
}
