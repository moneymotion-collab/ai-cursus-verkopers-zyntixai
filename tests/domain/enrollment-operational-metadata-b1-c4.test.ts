import { describe, expect, it } from "vitest";
import {
  enrollmentProgressHealthLabel,
} from "@/features/enrollments/domain/operational-metadata";
import { evaluateEnrollmentNoRecentProgress } from "@/features/attention/domain/eligibility";

describe("B1-C4 enrollment operational metadata contracts", () => {
  it("labels progress health deterministically", () => {
    expect(enrollmentProgressHealthLabel("healthy")).toBe("Progress current");
    expect(enrollmentProgressHealthLabel("no_recent_progress")).toBe(
      "No recent progress",
    );
    expect(enrollmentProgressHealthLabel("no_progress_yet")).toBe(
      "No progress recorded",
    );
    expect(enrollmentProgressHealthLabel("not_applicable")).toBe(
      "Progress check not applicable",
    );
  });

  it("keeps B1-C3 14-day stale rule as the health source of truth", () => {
    const stale = evaluateEnrollmentNoRecentProgress({
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
      enrollmentCreatedAt: "2026-07-01T00:00:00.000Z",
      latestNonVoidedProgressOccurredAt: "2026-07-28T00:00:00.000Z",
      evaluatedAt: "2026-08-20T00:00:00.000Z",
    });
    expect(stale).toMatchObject({
      eligible: true,
      stale: true,
      reasonCode: "STALE",
    });

    const fresh = evaluateEnrollmentNoRecentProgress({
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
      enrollmentCreatedAt: "2026-07-01T00:00:00.000Z",
      latestNonVoidedProgressOccurredAt: "2026-08-18T00:00:00.000Z",
      evaluatedAt: "2026-08-20T00:00:00.000Z",
    });
    expect(fresh).toMatchObject({
      eligible: true,
      stale: false,
      reasonCode: "NOT_STALE",
    });
  });
});
