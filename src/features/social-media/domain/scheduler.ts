/**
 * SMM-B1.11-C — Fail-closed scheduler worker contracts.
 * Automatic provider execution requires BOTH scheduling and publishing gates.
 * Dry-run discovers due work without claim/credentials/adapter.
 */

import {
  parseSocialPublishingEnabled,
  type SocialPublicationStatus,
} from "./publishing";
import { SOCIAL_SCHEDULE_MISS_GRACE_SECONDS } from "./scheduling";

export const SOCIAL_SCHEDULING_ENABLED_ENV = "SOCIAL_SCHEDULING_ENABLED";

export const SOCIAL_SCHEDULER_CRON_PATH = "/api/cron/social-publications";

/** Intended Beta 1 cadence. Hobby Production currently allows only daily Vercel Cron. */
export const SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET = "*/5 * * * *";

/** Deployed cadence under the current Vercel Hobby plan (once per day, 00:00 UTC). */
export const SOCIAL_SCHEDULER_CRON_SCHEDULE = "0 0 * * *";

/** Canonical worker origin. Supabase Cron may only invoke this host. */
export const SOCIAL_SCHEDULER_CANONICAL_ORIGIN = "https://www.zyntixai.com";

/** Private Postgres timer function. No URL/org/publication/secret parameters. */
export const SOCIAL_SCHEDULER_SUPABASE_TRIGGER_FUNCTION =
  "private.invoke_social_publication_scheduler";

/** Named pg_cron job. Command must only call the private trigger function. */
export const SOCIAL_SCHEDULER_SUPABASE_CRON_JOB_NAME =
  "zyntixai_social_publication_scheduler_5m";

/** Vault secret name for the existing Vercel CRON_SECRET. Never store the value in Git. */
export const SOCIAL_SCHEDULER_VAULT_SECRET_NAME =
  "zyntixai_social_scheduler_cron_secret";

export const SOCIAL_SCHEDULER_CRON_CADENCE_EXPLANATION =
  "Target is every 5 minutes (three ticks inside the locked 15-minute miss grace owned by B1.11-D). Native Vercel Cron on Hobby remains 0 0 * * * during the SMM-B1.11-E-PR1 cutover. The intended Production timer is Supabase pg_cron */5 * * * * invoking the existing Vercel worker. Timing remains UTC due instant + later grace, not an exact cron second. Authorized dry-run HTTP invocation of the same route does not wait for a daily tick.";

/** Route maxDuration target. Instagram container poll sleeps up to 240s plus HTTP. */
export const SOCIAL_SCHEDULER_MAX_DURATION_SECONDS = 300;

/** Claim lease must outlive the 300s route budget and ~70.69s historical IMAGE publish. */
export const SOCIAL_SCHEDULER_CLAIM_LEASE_SECONDS = 360;

/**
 * One publication per invocation: historical IMAGE publish ~70.69s and adapter
 * polls 60s × up to 5. Sequential correctness over throughput. No Promise.all.
 */
export const SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT = 1;

/** Dry-run discovery cap so one cron call cannot dump an unbounded backlog. */
export const SOCIAL_SCHEDULER_DISCOVERY_LIMIT = 5;

export const SOCIAL_SCHEDULER_CRON_SECRET_ENV = "CRON_SECRET";

export type SocialSchedulerMode = "dry-run" | "execute";

export function parseSocialSchedulingEnabled(
  value: string | undefined | null,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

export function resolveSocialSchedulerMode(input: {
  schedulingEnabled: string | undefined | null;
  publishingEnabled: string | undefined | null;
}): SocialSchedulerMode {
  if (
    parseSocialSchedulingEnabled(input.schedulingEnabled) &&
    parseSocialPublishingEnabled(input.publishingEnabled)
  ) {
    return "execute";
  }
  return "dry-run";
}

export function socialSchedulerAllowsClaim(input: {
  mode: SocialSchedulerMode;
  schedulingEnabled: string | undefined | null;
  publishingEnabled: string | undefined | null;
}): boolean {
  return (
    input.mode === "execute" &&
    parseSocialSchedulingEnabled(input.schedulingEnabled) &&
    parseSocialPublishingEnabled(input.publishingEnabled)
  );
}

export function socialSchedulerAllowsProviderWrite(input: {
  mode: SocialSchedulerMode;
  schedulingEnabled: string | undefined | null;
  publishingEnabled: string | undefined | null;
}): boolean {
  return socialSchedulerAllowsClaim(input);
}

export function socialSchedulerAllowsMissedMutation(input: {
  schedulingEnabled: string | undefined | null;
}): boolean {
  return parseSocialSchedulingEnabled(input.schedulingEnabled);
}

export const SOCIAL_SCHEDULER_DUE_ELIGIBLE_STATUSES = [
  "pending",
  "queued",
  "failed_retryable",
] as const satisfies readonly SocialPublicationStatus[];

export const SOCIAL_SCHEDULER_SKIP_STATUSES = [
  "succeeded",
  "cancelled",
  "unknown_external_outcome",
  "manual_intervention",
  "failed_terminal",
  "processing",
] as const satisfies readonly SocialPublicationStatus[];

export function isScheduledExecutionMode(value: string | null | undefined): boolean {
  return value === "scheduled";
}

export function isDueScheduledClock(input: {
  nowMs: number;
  nextAttemptAtMs: number | null;
  intendedExecuteAtMs: number | null;
}): boolean {
  const dueMs = input.nextAttemptAtMs ?? input.intendedExecuteAtMs;
  if (dueMs == null) {
    return false;
  }
  return dueMs <= input.nowMs;
}

export function isMissedBeyondSchedulerGrace(input: {
  nowMs: number;
  dueAtMs: number;
  graceSeconds?: number;
}): boolean {
  const grace = input.graceSeconds ?? SOCIAL_SCHEDULE_MISS_GRACE_SECONDS;
  return input.nowMs - input.dueAtMs > grace * 1000;
}

export type SocialSchedulerAuthResult =
  | { ok: true }
  | {
      ok: false;
      reason: "missing_secret" | "missing_credentials" | "invalid_credentials";
    };

function authorizationBearer(header: string | null | undefined): string | null {
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header.trim());
  if (!match) {
    return null;
  }
  return match[1] ?? null;
}

/**
 * Machine authorization only. Query-string secrets are ignored and never accepted.
 * Cookie/session presence is irrelevant: this does not inspect member roles.
 */
export function authorizeSocialSchedulerCronRequest(input: {
  authorizationHeader: string | null | undefined;
  configuredSecret: string | undefined | null;
  querySecret?: string | null;
}): SocialSchedulerAuthResult {
  const expected = input.configuredSecret?.trim() ?? "";
  if (!expected) {
    return { ok: false, reason: "missing_secret" };
  }
  const presented = authorizationBearer(input.authorizationHeader);
  if (!presented) {
    return { ok: false, reason: "missing_credentials" };
  }
  // Query secrets are intentionally unused even if they match.
  void input.querySecret;
  if (presented.length !== expected.length) {
    return { ok: false, reason: "invalid_credentials" };
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= presented.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  if (mismatch !== 0) {
    return { ok: false, reason: "invalid_credentials" };
  }
  return { ok: true };
}

export type SocialSchedulerDueRow = {
  organizationId: string;
  publicationId: string;
  status: string;
  executionMode: string;
  intendedExecuteAt: string | null;
  nextAttemptAt: string | null;
  dueAt: string | null;
  secondsLate: number;
};

export type SocialSchedulerSkipReason =
  | "not_due"
  | "future"
  | "not_scheduled"
  | "already_succeeded"
  | "cancelled"
  | "unknown_external_outcome"
  | "manual_intervention"
  | "failed_terminal"
  | "processing"
  | "missed_window"
  | "workflow_not_ready"
  | "connection_ineligible"
  | "capability_missing"
  | "closed_beta"
  | "skipped_locked"
  | "conflict"
  | "none_due"
  | "feature_disabled"
  | "format_unsupported"
  | "credential_unavailable";

export type SocialSchedulerSafeSummary = {
  invocationId: string;
  mode: SocialSchedulerMode;
  schedulingEnabled: boolean;
  publishingEnabled: boolean;
  dueDiscovered: number;
  dueStale: number;
  dueWithinGrace: number;
  missedMarked: number;
  attentionUpserted: number;
  claimed: number;
  skipped: number;
  succeeded: number;
  retryable: number;
  terminal: number;
  unknownOutcome: number;
  providerWriteAttempted: boolean;
  durationMs: number;
  publicationIds: string[];
  skipReasons: Partial<Record<SocialSchedulerSkipReason, number>>;
};

export function createEmptySocialSchedulerSummary(input: {
  invocationId: string;
  mode: SocialSchedulerMode;
  schedulingEnabled: boolean;
  publishingEnabled: boolean;
}): SocialSchedulerSafeSummary {
  return {
    invocationId: input.invocationId,
    mode: input.mode,
    schedulingEnabled: input.schedulingEnabled,
    publishingEnabled: input.publishingEnabled,
    dueDiscovered: 0,
    dueStale: 0,
    dueWithinGrace: 0,
    missedMarked: 0,
    attentionUpserted: 0,
    claimed: 0,
    skipped: 0,
    succeeded: 0,
    retryable: 0,
    terminal: 0,
    unknownOutcome: 0,
    providerWriteAttempted: false,
    durationMs: 0,
    publicationIds: [],
    skipReasons: {},
  };
}

export function classifySchedulerStartCode(
  code: string | null | undefined,
): SocialSchedulerSkipReason | "success" | "unexpected" {
  switch (code) {
    case "success":
      return "success";
    case "none_due":
      return "none_due";
    case "not_scheduled":
      return "not_scheduled";
    case "missed_window":
      return "missed_window";
    case "workflow_not_ready":
      return "workflow_not_ready";
    case "connection_ineligible":
      return "connection_ineligible";
    case "capability_missing":
      return "capability_missing";
    case "skipped_locked":
      return "skipped_locked";
    case "conflict":
      return "conflict";
    case "feature_disabled":
      return "feature_disabled";
    case "format_unsupported":
      return "format_unsupported";
    case "credential_unavailable":
      return "credential_unavailable";
    case "closed_beta_not_enrolled":
    case "closed_beta_paused":
    case "closed_beta_revoked":
    case "closed_beta_publish_not_allowed":
      return "closed_beta";
    default:
      return "unexpected";
  }
}
