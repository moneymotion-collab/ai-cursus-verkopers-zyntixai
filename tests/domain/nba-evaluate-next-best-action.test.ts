import { describe, expect, it } from "vitest";
import { evaluateNextBestAction } from "@/features/nba/domain/evaluate-next-best-action";
import {
  NEXT_BEST_ACTION_TYPES,
  isNextBestActionType,
  type AuthorizedNbaContext,
  type NextBestAction,
} from "@/features/nba/domain/types";

const ATTENTION_ID = "att-nba-1";
const ENROLLMENT_ID = "enr-nba-1";
const CUSTOMER_ID = "cus-nba-1";
const PROGRAM_ID = "prg-nba-1";
const ASSIGNEE_ID = "mem-nba-1";

function baseContext(
  overrides: Partial<AuthorizedNbaContext> = {},
): AuthorizedNbaContext {
  return {
    attentionItemId: ATTENTION_ID,
    status: "open",
    archivedAt: null,
    assigneeMemberId: null,
    hasStaleProgressEvidence: false,
    hasAuthorizedEnrollment: false,
    hasAuthorizedCustomer: false,
    ...overrides,
  };
}

describe("NBA action catalog exclusions", () => {
  it("T15/T16: catalog excludes resolve, dismiss, and create_follow_up_task", () => {
    expect([...NEXT_BEST_ACTION_TYPES]).toEqual([
      "acknowledge_attention",
      "assign_attention_owner",
      "review_progress",
      "open_enrollment",
      "open_customer",
    ]);
    expect(isNextBestActionType("resolve_attention")).toBe(false);
    expect(isNextBestActionType("dismiss_attention")).toBe(false);
    expect(isNextBestActionType("create_follow_up_task")).toBe(false);
  });
});

describe("evaluateNextBestAction", () => {
  const cases: Array<{
    id: string;
    name: string;
    context: AuthorizedNbaContext;
    expectedAction: NextBestAction["actionType"] | null;
    expectedReason?: NextBestAction["reasonCode"];
  }> = [
    {
      id: "T1",
      name: "open => acknowledge_attention",
      context: baseContext({ status: "open" }),
      expectedAction: "acknowledge_attention",
      expectedReason: "attention_open_needs_acknowledge",
    },
    {
      id: "T2",
      name: "acknowledged + unassigned => assign_attention_owner",
      context: baseContext({
        status: "acknowledged",
        assigneeMemberId: null,
      }),
      expectedAction: "assign_attention_owner",
      expectedReason: "attention_unassigned_needs_owner",
    },
    {
      id: "T3",
      name: "acknowledged + assigned + stale + enrollment => review_progress",
      context: baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: true,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
        programId: PROGRAM_ID,
      }),
      expectedAction: "review_progress",
      expectedReason: "attention_stale_progress_needs_review",
    },
    {
      id: "T4",
      name: "acknowledged + assigned + no stale + enrollment => open_enrollment",
      context: baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: false,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
      }),
      expectedAction: "open_enrollment",
      expectedReason: "attention_open_enrollment_context",
    },
    {
      id: "T4b",
      name: "no enrollment + authorized customer => open_customer",
      context: baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: false,
        hasAuthorizedEnrollment: false,
        enrollmentId: ENROLLMENT_ID,
        hasAuthorizedCustomer: true,
        customerId: CUSTOMER_ID,
      }),
      expectedAction: "open_customer",
      expectedReason: "attention_open_customer_context",
    },
    {
      id: "T4c",
      name: "no authorized context => null",
      context: baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: false,
        hasAuthorizedEnrollment: false,
        hasAuthorizedCustomer: false,
      }),
      expectedAction: null,
    },
    {
      id: "T5",
      name: "resolved => null",
      context: baseContext({ status: "resolved" }),
      expectedAction: null,
    },
    {
      id: "T6",
      name: "dismissed => null",
      context: baseContext({ status: "dismissed" }),
      expectedAction: null,
    },
    {
      id: "T7",
      name: "expired => null",
      context: baseContext({ status: "expired" }),
      expectedAction: null,
    },
    {
      id: "T8",
      name: "archived => null even when otherwise eligible",
      context: baseContext({
        status: "open",
        archivedAt: "2026-08-01T00:00:00.000Z",
        hasStaleProgressEvidence: true,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
      }),
      expectedAction: null,
    },
    {
      id: "T9",
      name: "open + assigned + stale => acknowledge_attention",
      context: baseContext({
        status: "open",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: true,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
      }),
      expectedAction: "acknowledge_attention",
      expectedReason: "attention_open_needs_acknowledge",
    },
    {
      id: "T17",
      name: "open + unassigned + stale => acknowledge_attention",
      context: baseContext({
        status: "open",
        assigneeMemberId: null,
        hasStaleProgressEvidence: true,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
      }),
      expectedAction: "acknowledge_attention",
      expectedReason: "attention_open_needs_acknowledge",
    },
    {
      id: "T18",
      name: "acknowledged + unassigned + stale => assign_attention_owner",
      context: baseContext({
        status: "acknowledged",
        assigneeMemberId: null,
        hasStaleProgressEvidence: true,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
      }),
      expectedAction: "assign_attention_owner",
      expectedReason: "attention_unassigned_needs_owner",
    },
  ];

  it.each(cases)("$id $name", ({ context, expectedAction, expectedReason }) => {
    const result = evaluateNextBestAction(context);
    if (expectedAction == null) {
      expect(result).toBeNull();
      return;
    }
    expect(result).not.toBeNull();
    expect(result!.actionType).toBe(expectedAction);
    expect(result!.reasonCode).toBe(expectedReason);
    expect(result!.attentionItemId).toBe(context.attentionItemId);
    expect(result!.title.length).toBeGreaterThan(0);
    expect(result!.explanation.length).toBeGreaterThan(0);
  });

  it("T10: identical input yields deep-equal semantic output", () => {
    const context = baseContext({
      status: "acknowledged",
      assigneeMemberId: ASSIGNEE_ID,
      hasStaleProgressEvidence: true,
      hasAuthorizedEnrollment: true,
      enrollmentId: ENROLLMENT_ID,
      severity: "medium",
    });
    const first = evaluateNextBestAction(context);
    const second = evaluateNextBestAction(context);
    expect(first).toEqual(second);
  });

  it("T11: mapper does not mutate input", () => {
    const context = baseContext({
      status: "acknowledged",
      assigneeMemberId: null,
      hasAuthorizedEnrollment: true,
      enrollmentId: ENROLLMENT_ID,
    });
    const snapshot = structuredClone(context);
    evaluateNextBestAction(context);
    expect(context).toEqual(snapshot);
  });

  it("T12: unauthorized enrollment/customer ids do not leak into output", () => {
    const enrollmentLeak = evaluateNextBestAction(
      baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasAuthorizedEnrollment: false,
        enrollmentId: ENROLLMENT_ID,
        programId: PROGRAM_ID,
        hasAuthorizedCustomer: true,
        customerId: CUSTOMER_ID,
      }),
    );
    expect(enrollmentLeak?.actionType).toBe("open_customer");
    expect(enrollmentLeak?.relatedEnrollmentId).toBeUndefined();
    expect(enrollmentLeak?.relatedProgramId).toBeUndefined();
    expect(enrollmentLeak?.relatedCustomerId).toBe(CUSTOMER_ID);

    const customerLeak = evaluateNextBestAction(
      baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
        hasAuthorizedCustomer: false,
        customerId: CUSTOMER_ID,
      }),
    );
    expect(customerLeak?.actionType).toBe("open_enrollment");
    expect(customerLeak?.relatedCustomerId).toBeUndefined();
    expect(customerLeak?.relatedEnrollmentId).toBe(ENROLLMENT_ID);
  });

  it("T13: Viewer-equivalent semantic context matches Staff/Owner-equivalent input", () => {
    const shared = baseContext({
      status: "open",
      assigneeMemberId: null,
      hasStaleProgressEvidence: true,
      hasAuthorizedEnrollment: true,
      enrollmentId: ENROLLMENT_ID,
    });
    // Mapper has no role field; identical semantic context must yield identical NBA.
    expect(evaluateNextBestAction(shared)).toEqual(
      evaluateNextBestAction({ ...shared }),
    );
  });

  it("T14: high/critical severity does not change actionType", () => {
    const medium = evaluateNextBestAction(
      baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: false,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
        severity: "medium",
      }),
    );
    const high = evaluateNextBestAction(
      baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: false,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
        severity: "high",
      }),
    );
    const critical = evaluateNextBestAction(
      baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: false,
        hasAuthorizedEnrollment: true,
        enrollmentId: ENROLLMENT_ID,
        severity: "critical",
      }),
    );

    expect(medium?.actionType).toBe("open_enrollment");
    expect(high?.actionType).toBe(medium?.actionType);
    expect(critical?.actionType).toBe(medium?.actionType);
    expect(high?.actionType).not.toBe("resolve_attention" as never);
    expect(critical?.actionType).not.toBe("dismiss_attention" as never);
  });

  it("destination intents match approved action types", () => {
    expect(
      evaluateNextBestAction(baseContext({ status: "open" }))?.destination,
    ).toEqual({ kind: "attention_control", control: "acknowledge" });

    expect(
      evaluateNextBestAction(
        baseContext({ status: "acknowledged", assigneeMemberId: null }),
      )?.destination,
    ).toEqual({ kind: "attention_control", control: "assign" });

    expect(
      evaluateNextBestAction(
        baseContext({
          status: "acknowledged",
          assigneeMemberId: ASSIGNEE_ID,
          hasStaleProgressEvidence: true,
          hasAuthorizedEnrollment: true,
          enrollmentId: ENROLLMENT_ID,
        }),
      )?.destination,
    ).toEqual({ kind: "navigate", target: "progress_list" });
  });

  it("stale without authorized enrollment skips review_progress safely", () => {
    const result = evaluateNextBestAction(
      baseContext({
        status: "acknowledged",
        assigneeMemberId: ASSIGNEE_ID,
        hasStaleProgressEvidence: true,
        hasAuthorizedEnrollment: false,
        enrollmentId: ENROLLMENT_ID,
        hasAuthorizedCustomer: true,
        customerId: CUSTOMER_ID,
      }),
    );
    expect(result?.actionType).toBe("open_customer");
    expect(result?.relatedEnrollmentId).toBeUndefined();
  });
});
