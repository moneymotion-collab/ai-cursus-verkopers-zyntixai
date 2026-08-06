import { describe, expect, it } from "vitest";
import { canShowEnrollmentViewAttentionEntry } from "@/features/attention/ui/attention-pe-entry-visibility";
import { buildAttentionListHref } from "@/features/attention/domain/attention-navigation";
import { ATTENTION_ITEM_ID, ENROLLMENT_ID, ORG_ID } from "../helpers/attention-test-fixtures";

describe("enrollment Attention entrypoint visibility (B1.7.5-E)", () => {
  it("allows known Attention roles without requiring a count query", () => {
    for (const role of ["owner", "admin", "staff", "viewer"] as const) {
      expect(
        canShowEnrollmentViewAttentionEntry({ role }),
      ).toBe(true);
    }
    expect(
      canShowEnrollmentViewAttentionEntry({
        role: "owner",
        isEnrollmentUnavailable: true,
      }),
    ).toBe(false);
    expect(canShowEnrollmentViewAttentionEntry({ role: "guest" })).toBe(false);
  });

  it("builds canonical Attention list href with org and enrollmentId only", () => {
    const href = buildAttentionListHref({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
    });
    expect(href).toBe(
      `/attention?org=${ORG_ID}&enrollmentId=${ENROLLMENT_ID}`,
    );
    expect(href).not.toContain("count");
    expect(href).not.toContain(ATTENTION_ITEM_ID);
  });
});
