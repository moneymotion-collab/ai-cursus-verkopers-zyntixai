import { describe, expect, it } from "vitest";
import type { AttentionItemDetailReadModel } from "@/features/attention/domain/read-types";
import { buildAuthorizedNbaContext } from "@/features/nba/application/build-authorized-nba-context";
import {
  ATTENTION_ITEM_ID,
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  SIGNAL_ID,
} from "../helpers/attention-test-fixtures";

function baseItem(
  overrides: Partial<AttentionItemDetailReadModel> = {},
): AttentionItemDetailReadModel {
  return {
    id: ATTENTION_ITEM_ID,
    organizationId: ORG_ID,
    sourceType: "enrollment",
    sourceEntityId: ENROLLMENT_ID,
    enrollmentId: ENROLLMENT_ID,
    customerId: CUSTOMER_ID,
    programId: PROGRAM_ID,
    projectId: null,
    taskId: null,
    title: "No recent progress",
    summary: "Enrollment went quiet",
    status: "open",
    severity: "high",
    assigneeMemberId: null,
    dedupeKey: `enrollment:${ENROLLMENT_ID}:enrollment_no_recent_progress`,
    detectionCount: 1,
    firstDetectedAt: "2026-08-01T10:00:00.000Z",
    lastDetectedAt: "2026-08-01T10:00:00.000Z",
    acknowledgedAt: null,
    isAcknowledged: false,
    resolvedAt: null,
    dismissedAt: null,
    expiredAt: null,
    archivedAt: null,
    resolutionReason: null,
    dismissalReason: null,
    createdByMemberId: MEMBER_ID,
    updatedByMemberId: MEMBER_ID,
    createdAt: "2026-08-01T10:00:00.000Z",
    updatedAt: "2026-08-01T10:00:00.000Z",
    enrollment: {
      id: ENROLLMENT_ID,
      status: "active",
      archivedAt: null,
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    },
    customer: {
      id: CUSTOMER_ID,
      displayName: "Acme Corp",
      status: "active",
      archivedAt: null,
    },
    program: {
      id: PROGRAM_ID,
      name: "Growth Lab",
      status: "active",
      archivedAt: null,
    },
    project: null,
    task: null,
    signals: [],
    events: [],
    derived: {
      isAcknowledged: false,
      isArchived: false,
      isTerminal: false,
      isResolved: false,
      isDismissed: false,
      isExpired: false,
    },
    ...overrides,
  };
}

describe("buildAuthorizedNbaContext", () => {
  it("I3: qualifying ruleKey yields stale true", () => {
    const context = buildAuthorizedNbaContext(
      baseItem({
        signals: [
          {
            id: SIGNAL_ID,
            organizationId: ORG_ID,
            attentionItemId: ATTENTION_ITEM_ID,
            enrollmentId: ENROLLMENT_ID,
            signalOrigin: "rule",
            ruleKey: "enrollment_no_recent_progress",
            explanation: "No progress for 14 days",
            evidence: { kind: "generic" },
            detectedAt: "2026-08-01T10:00:00.000Z",
            createdByMemberId: null,
            createdAt: "2026-08-01T10:00:00.000Z",
          },
        ],
      }),
    );
    expect(context.hasStaleProgressEvidence).toBe(true);
  });

  it("I3b: qualifying evidence.kind yields stale true", () => {
    const context = buildAuthorizedNbaContext(
      baseItem({
        signals: [
          {
            id: SIGNAL_ID,
            organizationId: ORG_ID,
            attentionItemId: ATTENTION_ITEM_ID,
            enrollmentId: ENROLLMENT_ID,
            signalOrigin: "manual",
            ruleKey: null,
            explanation: "Operator note",
            evidence: { kind: "stale_progress", ageCalendarDays: 20 },
            detectedAt: "2026-08-01T10:00:00.000Z",
            createdByMemberId: MEMBER_ID,
            createdAt: "2026-08-01T10:00:00.000Z",
          },
        ],
      }),
    );
    expect(context.hasStaleProgressEvidence).toBe(true);
  });

  it("I4: manual/generic/nonmatching signals yield stale false", () => {
    const context = buildAuthorizedNbaContext(
      baseItem({
        signals: [
          {
            id: SIGNAL_ID,
            organizationId: ORG_ID,
            attentionItemId: ATTENTION_ITEM_ID,
            enrollmentId: ENROLLMENT_ID,
            signalOrigin: "manual",
            ruleKey: null,
            explanation: "Manual note with secret text",
            evidence: { kind: "manual_note", note: "private operator note" },
            detectedAt: "2026-08-01T10:00:00.000Z",
            createdByMemberId: MEMBER_ID,
            createdAt: "2026-08-01T10:00:00.000Z",
          },
        ],
      }),
    );
    expect(context.hasStaleProgressEvidence).toBe(false);
  });

  it("I5: authorized enrollment present includes flag and id", () => {
    const context = buildAuthorizedNbaContext(baseItem());
    expect(context.hasAuthorizedEnrollment).toBe(true);
    expect(context.enrollmentId).toBe(ENROLLMENT_ID);
  });

  it("I6: enrollment null with raw FK present does not leak enrollmentId", () => {
    const context = buildAuthorizedNbaContext(
      baseItem({
        enrollmentId: ENROLLMENT_ID,
        enrollment: null,
      }),
    );
    expect(context.hasAuthorizedEnrollment).toBe(false);
    expect(context.enrollmentId).toBeUndefined();
    expect(JSON.stringify(context)).not.toContain(ENROLLMENT_ID);
  });

  it("I7: authorized customer present includes flag and id", () => {
    const context = buildAuthorizedNbaContext(baseItem());
    expect(context.hasAuthorizedCustomer).toBe(true);
    expect(context.customerId).toBe(CUSTOMER_ID);
  });

  it("I8: customer null with raw FK present does not leak customerId", () => {
    const context = buildAuthorizedNbaContext(
      baseItem({
        customerId: CUSTOMER_ID,
        customer: null,
      }),
    );
    expect(context.hasAuthorizedCustomer).toBe(false);
    expect(context.customerId).toBeUndefined();
    expect(JSON.stringify(context)).not.toContain(CUSTOMER_ID);
  });

  it("omits programId even when program summary is present", () => {
    const context = buildAuthorizedNbaContext(baseItem());
    expect(context).not.toHaveProperty("programId");
    expect(JSON.stringify(context)).not.toContain(PROGRAM_ID);
  });

  it("copies canonical status/archive/assignee fields and does not copy signals", () => {
    const item = baseItem({
      status: "acknowledged",
      archivedAt: null,
      assigneeMemberId: MEMBER_ID,
      signals: [
        {
          id: SIGNAL_ID,
          organizationId: ORG_ID,
          attentionItemId: ATTENTION_ITEM_ID,
          enrollmentId: ENROLLMENT_ID,
          signalOrigin: "rule",
          ruleKey: "enrollment_no_recent_progress",
          explanation: "No progress for 14 days",
          evidence: {
            kind: "stale_progress",
            note: "must-not-copy",
            citedProgressFactIds: ["fact-1"],
          },
          detectedAt: "2026-08-01T10:00:00.000Z",
          createdByMemberId: null,
          createdAt: "2026-08-01T10:00:00.000Z",
        },
      ],
    });
    const context = buildAuthorizedNbaContext(item);
    expect(context.attentionItemId).toBe(ATTENTION_ITEM_ID);
    expect(context.status).toBe("acknowledged");
    expect(context.archivedAt).toBeNull();
    expect(context.assigneeMemberId).toBe(MEMBER_ID);
    expect(context.severity).toBe("high");
    expect(context.hasStaleProgressEvidence).toBe(true);
    expect(context).not.toHaveProperty("signals");
    expect(JSON.stringify(context)).not.toContain("must-not-copy");
    expect(JSON.stringify(context)).not.toContain("fact-1");
    expect(JSON.stringify(context)).not.toContain("citedProgressFactIds");
  });

  it("does not mutate the source Attention detail model", () => {
    const item = baseItem({
      signals: [
        {
          id: SIGNAL_ID,
          organizationId: ORG_ID,
          attentionItemId: ATTENTION_ITEM_ID,
          enrollmentId: ENROLLMENT_ID,
          signalOrigin: "manual",
          ruleKey: null,
          explanation: "note",
          evidence: { kind: "manual_note", note: "keep" },
          detectedAt: "2026-08-01T10:00:00.000Z",
          createdByMemberId: null,
          createdAt: "2026-08-01T10:00:00.000Z",
        },
      ],
    });
    const snapshot = structuredClone(item);
    buildAuthorizedNbaContext(item);
    expect(item).toEqual(snapshot);
  });
});
