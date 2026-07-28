import { describe, expect, it } from "vitest";
import {
  isKnownProgressRole,
  resolveProgressPermissions,
} from "@/features/progress/domain/permissions";
import { EMPTY_PROGRESS_PERMISSIONS } from "@/features/progress/domain/types";

describe("resolveProgressPermissions", () => {
  it("grants owner/admin voided visibility and mutation rights on active enrollments", () => {
    for (const role of ["owner", "admin"] as const) {
      const permissions = resolveProgressPermissions(role, {
        enrollmentStatus: "active",
        enrollmentArchivedAt: null,
      });
      expect(permissions.canListFacts).toBe(true);
      expect(permissions.canViewFact).toBe(true);
      expect(permissions.canViewVoidedFacts).toBe(true);
      expect(permissions.canRecordManualFact).toBe(true);
      expect(permissions.canCorrectFact).toBe(true);
      expect(permissions.canVoidFact).toBe(true);
    }
  });

  it("allows owner/admin correction/void on completed enrollments but not manual record", () => {
    const permissions = resolveProgressPermissions("owner", {
      enrollmentStatus: "completed",
      enrollmentArchivedAt: null,
    });
    expect(permissions.canRecordManualFact).toBe(false);
    expect(permissions.canCorrectFact).toBe(true);
    expect(permissions.canVoidFact).toBe(true);
  });

  it("allows staff mutations only on active/paused and never voided visibility", () => {
    const active = resolveProgressPermissions("staff", {
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
    });
    expect(active.canRecordManualFact).toBe(true);
    expect(active.canCorrectFact).toBe(true);
    expect(active.canVoidFact).toBe(true);
    expect(active.canViewVoidedFacts).toBe(false);

    const completed = resolveProgressPermissions("staff", {
      enrollmentStatus: "completed",
      enrollmentArchivedAt: null,
    });
    expect(completed.canRecordManualFact).toBe(false);
    expect(completed.canCorrectFact).toBe(false);
    expect(completed.canVoidFact).toBe(false);
  });

  it("keeps viewer read-only without voided visibility", () => {
    const permissions = resolveProgressPermissions("viewer", {
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
    });
    expect(permissions.canListFacts).toBe(true);
    expect(permissions.canViewFact).toBe(true);
    expect(permissions.canViewVoidedFacts).toBe(false);
    expect(permissions.canRecordManualFact).toBe(false);
    expect(permissions.canCorrectFact).toBe(false);
    expect(permissions.canVoidFact).toBe(false);
  });

  it("fails closed for unknown or missing roles", () => {
    expect(isKnownProgressRole("owner")).toBe(true);
    expect(isKnownProgressRole("ghost")).toBe(false);
    expect(resolveProgressPermissions(null)).toEqual(EMPTY_PROGRESS_PERMISSIONS);
    expect(resolveProgressPermissions(undefined)).toEqual(EMPTY_PROGRESS_PERMISSIONS);
  });

  it("locks mutations when the fact is already voided", () => {
    const permissions = resolveProgressPermissions("owner", {
      isVoided: true,
      enrollmentStatus: "active",
      enrollmentArchivedAt: null,
    });
    expect(permissions.canRecordManualFact).toBe(false);
    expect(permissions.canCorrectFact).toBe(false);
    expect(permissions.canVoidFact).toBe(false);
    expect(permissions.canViewVoidedFacts).toBe(true);
  });
});
