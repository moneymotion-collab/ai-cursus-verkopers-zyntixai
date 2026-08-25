import { describe, expect, it } from "vitest";
import {
  allocateActivityKey,
  assertClassifiedForActive,
  assertInternalQaReadiness,
  isExactTaxContextCompatible,
  slugifyActivityKey,
} from "@/features/org-context/domain/validation";

describe("ORG-CONTEXT domain validation", () => {
  it("generates a stable activity_key from display name without using display_name as identity", () => {
    expect(slugifyActivityKey("Online Course Business")).toBe("online_course_business");
    expect(slugifyActivityKey("123 Launch")).toBe("a_123_launch");
    expect(slugifyActivityKey("A")).toBe("ax");
  });

  it("allocates a collision-safe suffix inside one Organization", () => {
    const first = allocateActivityKey("online_course", new Set(["online_course"]));
    expect(first).toMatchObject({ ok: true, value: "online_course_2" });
    const second = allocateActivityKey(
      "online_course",
      new Set(["online_course", "online_course_2"]),
    );
    expect(second).toMatchObject({ ok: true, value: "online_course_3" });
  });

  it("rejects active unclassified and primary draft", () => {
    expect(
      assertClassifiedForActive({
        status: "active",
        classification: null,
        isPrimary: false,
      }),
    ).toMatchObject({ ok: false, error: { code: "MUTATION_FAILED" } });
    expect(
      assertClassifiedForActive({
        status: "draft",
        classification: null,
        isPrimary: true,
      }),
    ).toMatchObject({ ok: false, error: { code: "PRIMARY_ACTIVITY_CONFLICT" } });
  });

  it("requires exact TAX kind+target match and rejects ancestor fallback", () => {
    const niche = { kind: "niche" as const, targetId: "niche-1" };
    expect(
      isExactTaxContextCompatible({
        classification: niche,
        packKind: "niche",
        packTargetId: "niche-1",
      }),
    ).toBe(true);
    expect(
      isExactTaxContextCompatible({
        classification: niche,
        packKind: "foundation",
        packTargetId: "foundation-1",
      }),
    ).toBe(false);
    expect(
      isExactTaxContextCompatible({
        classification: null,
        packKind: "niche",
        packTargetId: "niche-1",
      }),
    ).toBe(false);
  });

  it("allows context_ready under internal_qa and rejects planned or missing readiness", () => {
    expect(assertInternalQaReadiness("internal_qa", "context_ready")).toMatchObject({
      ok: true,
      value: "context_ready",
    });
    expect(assertInternalQaReadiness("internal_qa", "beta_supported")).toMatchObject({
      ok: true,
    });
    expect(assertInternalQaReadiness("internal_qa", "production_verified")).toMatchObject({
      ok: true,
    });
    expect(assertInternalQaReadiness("internal_qa", "planned")).toMatchObject({
      ok: false,
      error: { code: "CONTEXT_VERSION_NOT_ASSIGNABLE" },
    });
    expect(assertInternalQaReadiness("internal_qa", null)).toMatchObject({
      ok: false,
      error: { code: "CONTEXT_VERSION_NOT_ASSIGNABLE" },
    });
  });
});
