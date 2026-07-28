import { describe, expect, it } from "vitest";
import { canShowEnrollmentRecordProgressEntry } from "@/features/progress/ui/progress-pe-entry-visibility";

describe("canShowEnrollmentRecordProgressEntry", () => {
  const eligible = {
    role: "staff",
    enrollmentStatus: "active",
    isArchived: false,
  } as const;

  it("allows owner/admin/staff on active or paused non-archived enrollments", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      expect(
        canShowEnrollmentRecordProgressEntry({ ...eligible, role, enrollmentStatus: "active" }),
      ).toBe(true);
      expect(
        canShowEnrollmentRecordProgressEntry({ ...eligible, role, enrollmentStatus: "paused" }),
      ).toBe(true);
    }
  });

  it("never allows viewer", () => {
    expect(canShowEnrollmentRecordProgressEntry({ ...eligible, role: "viewer" })).toBe(false);
  });

  it("never allows archived enrollments", () => {
    expect(canShowEnrollmentRecordProgressEntry({ ...eligible, isArchived: true })).toBe(false);
  });

  it("rejects non-active/paused statuses", () => {
    for (const enrollmentStatus of ["pending", "completed", "cancelled"] as const) {
      expect(canShowEnrollmentRecordProgressEntry({ ...eligible, enrollmentStatus })).toBe(false);
    }
  });

  it("rejects unknown roles", () => {
    expect(canShowEnrollmentRecordProgressEntry({ ...eligible, role: "unknown" })).toBe(false);
  });
});
