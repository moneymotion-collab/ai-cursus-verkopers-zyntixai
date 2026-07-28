import { describe, expect, it } from "vitest";
import {
  enrollmentAllowsManualProgressRecord,
  enrollmentAllowsProgressCorrectionOrVoid,
  getProgressFactTypeLabel,
  isProgressFactSource,
  isProgressFactType,
  PROGRESS_FACT_TYPES,
} from "@/features/progress/domain/fact-types";

describe("progress fact types", () => {
  it("accepts only proven CHECK fact types", () => {
    for (const factType of PROGRESS_FACT_TYPES) {
      expect(isProgressFactType(factType)).toBe(true);
      expect(getProgressFactTypeLabel(factType).length).toBeGreaterThan(0);
    }
    expect(isProgressFactType("health_score")).toBe(false);
    expect(isProgressFactSource("manual")).toBe(true);
    expect(isProgressFactSource("system")).toBe(false);
  });

  it("allows manual record only for active/paused non-archived enrollments", () => {
    expect(enrollmentAllowsManualProgressRecord("active", null)).toBe(true);
    expect(enrollmentAllowsManualProgressRecord("paused", null)).toBe(true);
    expect(enrollmentAllowsManualProgressRecord("pending", null)).toBe(false);
    expect(enrollmentAllowsManualProgressRecord("completed", null)).toBe(false);
    expect(
      enrollmentAllowsManualProgressRecord("active", "2026-07-01T00:00:00.000Z"),
    ).toBe(false);
  });

  it("applies role-specific correction/void enrollment gates", () => {
    expect(
      enrollmentAllowsProgressCorrectionOrVoid({
        status: "completed",
        archivedAt: null,
        role: "owner",
      }),
    ).toBe(true);
    expect(
      enrollmentAllowsProgressCorrectionOrVoid({
        status: "completed",
        archivedAt: null,
        role: "staff",
      }),
    ).toBe(false);
    expect(
      enrollmentAllowsProgressCorrectionOrVoid({
        status: "active",
        archivedAt: null,
        role: "staff",
      }),
    ).toBe(true);
    expect(
      enrollmentAllowsProgressCorrectionOrVoid({
        status: "active",
        archivedAt: null,
        role: "viewer",
      }),
    ).toBe(false);
  });
});
