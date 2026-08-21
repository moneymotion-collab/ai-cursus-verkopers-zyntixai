import { describe, expect, it } from "vitest";
import {
  ATTENTION_ITEM_STATUSES,
  NON_TERMINAL_ATTENTION_ITEM_STATUSES,
  TERMINAL_ATTENTION_ITEM_STATUSES,
  getAllowedAttentionStatusTransitions,
  getAttentionItemStatusLabel,
  isAllowedAttentionStatusTransition,
  isAttentionItemStatus,
  isNonTerminalAttentionStatus,
  isTerminalAttentionStatus,
} from "@/features/attention/domain/status";
import {
  assertAttentionStatusTransition,
  canTransitionAttentionStatus,
  evaluateAttentionStatusTransition,
} from "@/features/attention/domain/transitions";
import {
  ATTENTION_SEVERITIES,
  DEFAULT_ATTENTION_SEVERITY,
  compareAttentionSeverityDesc,
  getAttentionSeverityLabel,
  getAttentionSeverityRank,
  isAttentionSeverity,
} from "@/features/attention/domain/severity";
import {
  buildManualAttentionDedupeKey,
  buildRuleAttentionDedupeKey,
  isNonTerminalDedupeConflict,
} from "@/features/attention/domain/deduplication";
import {
  ENROLLMENT_NO_RECENT_PROGRESS_CONFIG,
  STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS,
  isStaleProgressEligibleEnrollmentStatus,
} from "@/features/attention/domain/rules";
import {
  assertCanArchiveAttentionItem,
  canArchiveAttentionItem,
  canMutateAttentionItemOperationally,
  evaluateEnrollmentNoRecentProgress,
  isArchivedAttentionItem,
  utcCalendarDaysBetween,
} from "@/features/attention/domain/eligibility";
import {
  validateAssignAttentionItemInput,
  validateCreateManualAttentionItemInput,
  validateDismissAttentionItemInput,
  validateResolveAttentionItemInput,
  validateAttentionRuleKeyValue,
  validateAttentionSignalOriginValue,
  validateAttentionSignalEvidence,
} from "@/features/attention/domain/validation";
import {
  ATTENTION_SIGNAL_ORIGINS,
  ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY,
  isAttentionRuleKey,
  isAttentionSignalOrigin,
} from "@/features/attention/domain/signal";
import { ATTENTION_PRIMARY_SOURCE_TYPE } from "@/features/attention/domain/source";

const ORG_A = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee1";
const ORG_B = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeee2";
const ENROLLMENT_A = "11111111-2222-4333-8444-555555555501";
const ENROLLMENT_B = "11111111-2222-4333-8444-555555555502";
const ITEM_ID = "99999999-aaaa-4bbb-8ccc-ddddddddddd1";
const MEMBER_ID = "66666666-7777-4888-8999-aaaaaaaaaaa1";

describe("attention item statuses", () => {
  it("exposes exact Release 1 statuses", () => {
    expect([...ATTENTION_ITEM_STATUSES]).toEqual([
      "open",
      "acknowledged",
      "resolved",
      "dismissed",
      "expired",
    ]);
  });

  it("rejects unknown status values", () => {
    expect(isAttentionItemStatus("open")).toBe(true);
    expect(isAttentionItemStatus("snoozed")).toBe(false);
    expect(isAttentionItemStatus("archived")).toBe(false);
    expect(isAttentionItemStatus("closed")).toBe(false);
  });

  it("classifies terminal and non-terminal statuses", () => {
    expect([...TERMINAL_ATTENTION_ITEM_STATUSES]).toEqual([
      "resolved",
      "dismissed",
      "expired",
    ]);
    expect([...NON_TERMINAL_ATTENTION_ITEM_STATUSES]).toEqual([
      "open",
      "acknowledged",
    ]);
    for (const status of TERMINAL_ATTENTION_ITEM_STATUSES) {
      expect(isTerminalAttentionStatus(status)).toBe(true);
      expect(isNonTerminalAttentionStatus(status)).toBe(false);
    }
    for (const status of NON_TERMINAL_ATTENTION_ITEM_STATUSES) {
      expect(isNonTerminalAttentionStatus(status)).toBe(true);
      expect(isTerminalAttentionStatus(status)).toBe(false);
    }
  });

  it("provides labels", () => {
    expect(getAttentionItemStatusLabel("open")).toBe("Open");
    expect(getAttentionItemStatusLabel("acknowledged")).toBe("Acknowledged");
  });
});

describe("attention status transitions", () => {
  it("allows the B1.7.0 matrix including open→terminal", () => {
    expect(getAllowedAttentionStatusTransitions("open")).toEqual([
      "acknowledged",
      "resolved",
      "dismissed",
      "expired",
    ]);
    expect(getAllowedAttentionStatusTransitions("acknowledged")).toEqual([
      "resolved",
      "dismissed",
      "expired",
    ]);
    expect(isAllowedAttentionStatusTransition("open", "acknowledged")).toBe(true);
    expect(isAllowedAttentionStatusTransition("open", "resolved")).toBe(true);
    expect(isAllowedAttentionStatusTransition("acknowledged", "dismissed")).toBe(
      true,
    );
    expect(canTransitionAttentionStatus("open", "acknowledged")).toBe(true);
  });

  it("denies forbidden and terminal transitions", () => {
    expect(isAllowedAttentionStatusTransition("acknowledged", "open")).toBe(false);
    expect(isAllowedAttentionStatusTransition("resolved", "open")).toBe(false);
    expect(canTransitionAttentionStatus("dismissed", "acknowledged")).toBe(false);
    expect(evaluateAttentionStatusTransition("expired", "open")).toEqual({
      outcome: "denied",
      code: "TERMINAL_ITEM",
      message: "Terminal Attention Items cannot change status.",
    });
  });

  it("treats same-status as idempotent noop", () => {
    expect(isAllowedAttentionStatusTransition("open", "open")).toBe(false);
    expect(evaluateAttentionStatusTransition("open", "open")).toEqual({
      outcome: "noop",
    });
    expect(assertAttentionStatusTransition("open", "open")).toEqual({
      ok: true,
      value: { outcome: "noop" },
    });
  });

  it("returns domain errors for denied transitions", () => {
    const result = assertAttentionStatusTransition("resolved", "dismissed");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TERMINAL_ITEM");
    }
  });
});

describe("attention severity", () => {
  it("exposes exact values and default", () => {
    expect([...ATTENTION_SEVERITIES]).toEqual([
      "low",
      "medium",
      "high",
      "critical",
    ]);
    expect(DEFAULT_ATTENTION_SEVERITY).toBe("medium");
    expect(isAttentionSeverity("critical")).toBe(true);
    expect(isAttentionSeverity("info")).toBe(false);
  });

  it("ranks and sorts by severity", () => {
    expect(getAttentionSeverityRank("low")).toBe(1);
    expect(getAttentionSeverityRank("critical")).toBe(4);
    expect(getAttentionSeverityLabel("high")).toBe("High");
    // Descending comparator: higher severity sorts before lower (negative = left first).
    expect(compareAttentionSeverityDesc("critical", "low")).toBeLessThan(0);
    expect(
      (["low", "critical", "medium", "high"] as const)
        .slice()
        .sort(compareAttentionSeverityDesc),
    ).toEqual(["critical", "high", "medium", "low"]);
  });
});

describe("attention signal and source types", () => {
  it("limits origins and rule keys to Release 1", () => {
    expect([...ATTENTION_SIGNAL_ORIGINS]).toEqual(["manual", "rule"]);
    expect(isAttentionSignalOrigin("ai")).toBe(false);
    expect(isAttentionRuleKey(ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY)).toBe(true);
    expect(isAttentionRuleKey("scheduled_publication_missed")).toBe(true);
    expect(isAttentionRuleKey("other_rule")).toBe(false);
    expect(ATTENTION_PRIMARY_SOURCE_TYPE).toBe("enrollment");
    expect(validateAttentionSignalOriginValue("manual").ok).toBe(true);
    expect(validateAttentionRuleKeyValue("enrollment_no_recent_progress").ok).toBe(
      true,
    );
    expect(validateAttentionRuleKeyValue("ai").ok).toBe(false);
  });
});

describe("attention validation", () => {
  it("accepts valid manual create input", () => {
    const result = validateCreateManualAttentionItemInput({
      enrollmentId: ENROLLMENT_A,
      title: "Needs follow-up",
      explanation: "No recent progress observed.",
      severity: "high",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.title).toBe("Needs follow-up");
      expect(result.value.severity).toBe("high");
    }
  });

  it("rejects empty title and empty dismissal/resolution reasons", () => {
    expect(
      validateCreateManualAttentionItemInput({
        enrollmentId: ENROLLMENT_A,
        title: "   ",
        explanation: "Why",
      }).ok,
    ).toBe(false);

    expect(
      validateDismissAttentionItemInput({
        attentionItemId: ITEM_ID,
        dismissalReason: "",
      }).ok,
    ).toBe(false);

    expect(
      validateResolveAttentionItemInput({
        attentionItemId: ITEM_ID,
        resolutionReason: "   ",
      }).ok,
    ).toBe(false);
  });

  it("accepts valid dismiss/resolve/assign and rejects empty assignee string", () => {
    expect(
      validateDismissAttentionItemInput({
        attentionItemId: ITEM_ID,
        dismissalReason: "No action needed",
      }).ok,
    ).toBe(true);
    expect(
      validateResolveAttentionItemInput({
        attentionItemId: ITEM_ID,
        resolutionReason: "Progress resumed",
      }).ok,
    ).toBe(true);
    expect(
      validateAssignAttentionItemInput({
        attentionItemId: ITEM_ID,
        assigneeMemberId: null,
      }).ok,
    ).toBe(true);
    expect(
      validateAssignAttentionItemInput({
        attentionItemId: ITEM_ID,
        assigneeMemberId: MEMBER_ID,
      }).ok,
    ).toBe(true);
    expect(
      validateAssignAttentionItemInput({
        attentionItemId: ITEM_ID,
        assigneeMemberId: "   ",
      }).ok,
    ).toBe(false);
  });

  it("validates evidence payloads", () => {
    expect(
      validateAttentionSignalEvidence({
        kind: "stale_progress",
        ageCalendarDays: 14,
      }).ok,
    ).toBe(true);
    expect(
      validateAttentionSignalEvidence({
        kind: "manual_note",
        citedProgressFactIds: ["not-a-uuid"],
      }).ok,
    ).toBe(false);
  });
});

describe("attention deduplication", () => {
  it("builds stable keys independent of mutable summary", () => {
    const a = buildRuleAttentionDedupeKey({
      organizationId: ORG_A,
      enrollmentId: ENROLLMENT_A,
    });
    const b = buildRuleAttentionDedupeKey({
      organizationId: ORG_A,
      enrollmentId: ENROLLMENT_A,
      ruleKey: ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY,
    });
    expect(a).toBe(b);
    expect(a).toContain(ORG_A);
    expect(a).toContain(ENROLLMENT_A);
    expect(a).toContain("enrollment_no_recent_progress");
  });

  it("changes key for org, enrollment, or signal family", () => {
    const base = buildRuleAttentionDedupeKey({
      organizationId: ORG_A,
      enrollmentId: ENROLLMENT_A,
    });
    expect(
      buildRuleAttentionDedupeKey({
        organizationId: ORG_B,
        enrollmentId: ENROLLMENT_A,
      }),
    ).not.toBe(base);
    expect(
      buildRuleAttentionDedupeKey({
        organizationId: ORG_A,
        enrollmentId: ENROLLMENT_B,
      }),
    ).not.toBe(base);
    expect(
      buildManualAttentionDedupeKey({
        organizationId: ORG_A,
        enrollmentId: ENROLLMENT_A,
      }),
    ).not.toBe(base);
  });

  it("detects non-terminal conflicts only", () => {
    const key = buildManualAttentionDedupeKey({
      organizationId: ORG_A,
      enrollmentId: ENROLLMENT_A,
    });
    expect(
      isNonTerminalDedupeConflict({
        existingItemStatus: "open",
        existingDedupeKey: key,
        candidateDedupeKey: key,
      }),
    ).toBe(true);
    expect(
      isNonTerminalDedupeConflict({
        existingItemStatus: "resolved",
        existingDedupeKey: key,
        candidateDedupeKey: key,
      }),
    ).toBe(false);
  });
});

describe("stale progress rule", () => {
  it("locks threshold config", () => {
    expect(STALE_PROGRESS_THRESHOLD_CALENDAR_DAYS).toBe(14);
    expect(ENROLLMENT_NO_RECENT_PROGRESS_CONFIG.timezoneBasis).toBe("UTC");
    expect(ENROLLMENT_NO_RECENT_PROGRESS_CONFIG.fallback).toBe(
      "enrollment_created_at",
    );
    expect(isStaleProgressEligibleEnrollmentStatus("active")).toBe(true);
    expect(isStaleProgressEligibleEnrollmentStatus("paused")).toBe(true);
    expect(isStaleProgressEligibleEnrollmentStatus("pending")).toBe(false);
  });

  it("computes UTC calendar day gaps", () => {
    const earlier = new Date("2026-01-01T23:00:00.000Z");
    const later = new Date("2026-01-15T01:00:00.000Z");
    expect(utcCalendarDaysBetween(earlier, later)).toBe(14);
  });

  it("marks 13 days not stale and 14 days stale", () => {
    const created = "2026-01-01T12:00:00.000Z";
    const day13 = evaluateEnrollmentNoRecentProgress({
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
      enrollmentCreatedAt: created,
      latestNonVoidedProgressOccurredAt: null,
      evaluatedAt: "2026-01-14T12:00:00.000Z",
    });
    expect(day13.eligible).toBe(true);
    if (day13.eligible) {
      expect(day13.ageCalendarDays).toBe(13);
      expect(day13.stale).toBe(false);
      expect(day13.reasonCode).toBe("NOT_STALE");
    }

    const day14 = evaluateEnrollmentNoRecentProgress({
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
      enrollmentCreatedAt: created,
      latestNonVoidedProgressOccurredAt: null,
      evaluatedAt: "2026-01-15T12:00:00.000Z",
    });
    expect(day14.eligible).toBe(true);
    if (day14.eligible) {
      expect(day14.ageCalendarDays).toBe(14);
      expect(day14.stale).toBe(true);
      expect(day14.reasonCode).toBe("STALE");
    }
  });

  it("uses Progress occurred_at when present and falls back to enrollment.created_at", () => {
    const withProgress = evaluateEnrollmentNoRecentProgress({
      enrollmentStatus: "paused",
      enrollmentArchivedAt: null,
      enrollmentCreatedAt: "2026-01-01T00:00:00.000Z",
      latestNonVoidedProgressOccurredAt: "2026-01-10T00:00:00.000Z",
      evaluatedAt: "2026-01-20T00:00:00.000Z",
    });
    expect(withProgress.eligible).toBe(true);
    if (withProgress.eligible) {
      expect(withProgress.referenceTimestamp).toBe("2026-01-10T00:00:00.000Z");
      expect(withProgress.ageCalendarDays).toBe(10);
      expect(withProgress.stale).toBe(false);
    }
  });

  it("treats future Progress reference as not stale", () => {
    const result = evaluateEnrollmentNoRecentProgress({
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
      enrollmentCreatedAt: "2026-01-01T00:00:00.000Z",
      latestNonVoidedProgressOccurredAt: "2026-02-01T00:00:00.000Z",
      evaluatedAt: "2026-01-15T00:00:00.000Z",
    });
    expect(result.eligible).toBe(true);
    if (result.eligible) {
      expect(result.stale).toBe(false);
      expect(result.reasonCode).toBe("FUTURE_REFERENCE");
    }
  });

  it("rejects ineligible and archived enrollments", () => {
    expect(
      evaluateEnrollmentNoRecentProgress({
        enrollmentStatus: "completed",
        enrollmentArchivedAt: null,
        enrollmentCreatedAt: "2026-01-01T00:00:00.000Z",
        latestNonVoidedProgressOccurredAt: null,
        evaluatedAt: "2026-03-01T00:00:00.000Z",
      }).reasonCode,
    ).toBe("ENROLLMENT_STATUS_INELIGIBLE");

    expect(
      evaluateEnrollmentNoRecentProgress({
        enrollmentStatus: "active",
        enrollmentArchivedAt: "2026-02-01T00:00:00.000Z",
        enrollmentCreatedAt: "2026-01-01T00:00:00.000Z",
        latestNonVoidedProgressOccurredAt: null,
        evaluatedAt: "2026-03-01T00:00:00.000Z",
      }).reasonCode,
    ).toBe("ENROLLMENT_ARCHIVED");
  });
});

describe("attention archive helpers", () => {
  it("allows archive only for terminal non-archived items", () => {
    expect(
      canArchiveAttentionItem({ status: "open", archivedAt: null }),
    ).toBe(false);
    expect(
      canArchiveAttentionItem({ status: "resolved", archivedAt: null }),
    ).toBe(true);
    expect(
      canArchiveAttentionItem({
        status: "resolved",
        archivedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe(false);
    expect(isArchivedAttentionItem(null)).toBe(false);
    expect(isArchivedAttentionItem("2026-01-01T00:00:00.000Z")).toBe(true);

    const denied = assertCanArchiveAttentionItem({
      status: "acknowledged",
      archivedAt: null,
    });
    expect(denied.ok).toBe(false);

    expect(
      canMutateAttentionItemOperationally({
        status: "open",
        archivedAt: null,
      }).ok,
    ).toBe(true);
    expect(
      canMutateAttentionItemOperationally({
        status: "resolved",
        archivedAt: null,
      }).ok,
    ).toBe(false);
  });
});
