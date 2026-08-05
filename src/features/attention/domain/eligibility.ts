import {
  ENROLLMENT_NO_RECENT_PROGRESS_CONFIG,
  isStaleProgressEligibleEnrollmentStatus,
  STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS,
} from "@/features/attention/domain/rules";
import { isTerminalAttentionStatus } from "@/features/attention/domain/status";
import type {
  AttentionDomainResult,
  AttentionItemStatus,
} from "@/features/attention/domain/types";

export type StaleProgressEvaluationInput = {
  enrollmentStatus: string;
  enrollmentArchivedAt: string | null | undefined;
  enrollmentCreatedAt: string;
  latestNonVoidedProgressOccurredAt: string | null;
  /** Injected evaluation instant (server clock). */
  evaluatedAt: string;
};

export type StaleProgressEvaluation =
  | {
      eligible: false;
      stale: false;
      reasonCode:
        | "ENROLLMENT_ARCHIVED"
        | "ENROLLMENT_STATUS_INELIGIBLE"
        | "INVALID_EVALUATION_TIME"
        | "INVALID_ENROLLMENT_CREATED_AT"
        | "INVALID_PROGRESS_TIMESTAMP";
      referenceTimestamp: string | null;
      ageCalendarDays: number | null;
    }
  | {
      eligible: true;
      stale: boolean;
      reasonCode: "STALE" | "NOT_STALE" | "FUTURE_REFERENCE";
      referenceTimestamp: string;
      ageCalendarDays: number;
      ruleKey: typeof ENROLLMENT_NO_RECENT_PROGRESS_CONFIG.ruleKey;
      thresholdCalendarDays: typeof STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS;
    };

function parseInstant(value: string): Date | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/** Whole UTC calendar days from earlier date to later date (floor). */
export function utcCalendarDaysBetween(earlier: Date, later: Date): number {
  const start = Date.UTC(
    earlier.getUTCFullYear(),
    earlier.getUTCMonth(),
    earlier.getUTCDate(),
  );
  const end = Date.UTC(
    later.getUTCFullYear(),
    later.getUTCMonth(),
    later.getUTCDate(),
  );
  return Math.floor((end - start) / 86_400_000);
}

/**
 * Pure evaluator for enrollment_no_recent_progress.
 * No DB, no Item create, no side effects.
 */
export function evaluateEnrollmentNoRecentProgress(
  input: StaleProgressEvaluationInput,
): StaleProgressEvaluation {
  if (input.enrollmentArchivedAt != null) {
    return {
      eligible: false,
      stale: false,
      reasonCode: "ENROLLMENT_ARCHIVED",
      referenceTimestamp: null,
      ageCalendarDays: null,
    };
  }

  if (!isStaleProgressEligibleEnrollmentStatus(input.enrollmentStatus)) {
    return {
      eligible: false,
      stale: false,
      reasonCode: "ENROLLMENT_STATUS_INELIGIBLE",
      referenceTimestamp: null,
      ageCalendarDays: null,
    };
  }

  const evaluatedAt = parseInstant(input.evaluatedAt);
  if (!evaluatedAt) {
    return {
      eligible: false,
      stale: false,
      reasonCode: "INVALID_EVALUATION_TIME",
      referenceTimestamp: null,
      ageCalendarDays: null,
    };
  }

  const enrollmentCreatedAt = parseInstant(input.enrollmentCreatedAt);
  if (!enrollmentCreatedAt) {
    return {
      eligible: false,
      stale: false,
      reasonCode: "INVALID_ENROLLMENT_CREATED_AT",
      referenceTimestamp: null,
      ageCalendarDays: null,
    };
  }

  let referenceTimestamp = input.enrollmentCreatedAt;
  let referenceDate = enrollmentCreatedAt;

  if (input.latestNonVoidedProgressOccurredAt != null) {
    const progressAt = parseInstant(input.latestNonVoidedProgressOccurredAt);
    if (!progressAt) {
      return {
        eligible: false,
        stale: false,
        reasonCode: "INVALID_PROGRESS_TIMESTAMP",
        referenceTimestamp: null,
        ageCalendarDays: null,
      };
    }
    referenceTimestamp = input.latestNonVoidedProgressOccurredAt;
    referenceDate = progressAt;
  }

  const ageCalendarDays = utcCalendarDaysBetween(referenceDate, evaluatedAt);

  if (ageCalendarDays < 0) {
    return {
      eligible: true,
      stale: false,
      reasonCode: "FUTURE_REFERENCE",
      referenceTimestamp,
      ageCalendarDays,
      ruleKey: ENROLLMENT_NO_RECENT_PROGRESS_CONFIG.ruleKey,
      thresholdCalendarDays: STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS,
    };
  }

  const stale = ageCalendarDays >= STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS;

  return {
    eligible: true,
    stale,
    reasonCode: stale ? "STALE" : "NOT_STALE",
    referenceTimestamp,
    ageCalendarDays,
    ruleKey: ENROLLMENT_NO_RECENT_PROGRESS_CONFIG.ruleKey,
    thresholdCalendarDays: STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS,
  };
}

export function isArchivedAttentionItem(
  archivedAt: string | null | undefined,
): boolean {
  return archivedAt != null;
}

/**
 * Domain-level archive eligibility (terminal + not already archived).
 * Role checks belong in later authorization layers.
 */
export function canArchiveAttentionItem(params: {
  status: AttentionItemStatus;
  archivedAt: string | null | undefined;
}): boolean {
  if (isArchivedAttentionItem(params.archivedAt)) {
    return false;
  }
  return isTerminalAttentionStatus(params.status);
}

export function assertCanArchiveAttentionItem(params: {
  status: AttentionItemStatus;
  archivedAt: string | null | undefined;
}): AttentionDomainResult<true> {
  if (isArchivedAttentionItem(params.archivedAt)) {
    return {
      ok: false,
      error: {
        code: "ARCHIVED_ITEM",
        message: "Attention Item is already archived.",
      },
    };
  }
  if (!isTerminalAttentionStatus(params.status)) {
    return {
      ok: false,
      error: {
        code: "NON_TERMINAL_NOT_ARCHIVABLE",
        message: "Only terminal Attention Items may be archived.",
      },
    };
  }
  return { ok: true, value: true };
}

/** Operational mutations require non-terminal and non-archived. */
export function canMutateAttentionItemOperationally(params: {
  status: AttentionItemStatus;
  archivedAt: string | null | undefined;
}): AttentionDomainResult<true> {
  if (isArchivedAttentionItem(params.archivedAt)) {
    return {
      ok: false,
      error: {
        code: "ARCHIVED_ITEM",
        message: "Archived Attention Items cannot be mutated operationally.",
      },
    };
  }
  if (isTerminalAttentionStatus(params.status)) {
    return {
      ok: false,
      error: {
        code: "TERMINAL_ITEM",
        message: "Terminal Attention Items cannot be mutated operationally.",
      },
    };
  }
  return { ok: true, value: true };
}
