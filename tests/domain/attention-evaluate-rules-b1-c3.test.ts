import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  ATTENTION_EVALUATE_RULES_ACTION,
  summarizeAttentionEvaluateRulesResult,
} from "@/features/attention/domain/evaluate-action-types";
import { evaluateEnrollmentNoRecentProgress } from "@/features/attention/domain/eligibility";
import { buildAttentionDedupeKey } from "@/features/attention/domain/deduplication";
import { ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY } from "@/features/attention/domain/signal";
import {
  listAttentionEvaluateRevalidationPaths,
  resolveAttentionEvaluateReturnPath,
} from "@/features/attention/ui/attention-evaluate-return";
import { parseEvaluateAttentionRulesActionInput } from "@/features/attention/actions/evaluate-attention-rules-action-schemas";
import { evaluateAttentionModuleAccess } from "@/features/attention/server/enforce-attention-module-access";

const ORG_ID = "2fc07699-ece5-44b9-bbb3-abbc23e9fffb";
const ENROLLMENT_ID = "e405c5c8-8b26-4768-bc74-67c7d52224e0";
const OTHER_ORG_ID = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("B1-C3 evaluate Attention rules domain helpers", () => {
  it("summarizes created/updated/expired and empty outcomes", () => {
    expect(
      summarizeAttentionEvaluateRulesResult({
        created: 2,
        updated: 1,
        expired: 0,
        evaluatedAt: "2026-08-20T00:00:00.000Z",
      }),
    ).toBe("2 new items created; 1 open item updated.");

    expect(
      summarizeAttentionEvaluateRulesResult({
        created: 0,
        updated: 0,
        expired: 1,
        evaluatedAt: "2026-08-20T00:00:00.000Z",
      }),
    ).toBe("1 item expired.");

    expect(
      summarizeAttentionEvaluateRulesResult({
        created: 0,
        updated: 0,
        expired: 0,
        evaluatedAt: "2026-08-20T00:00:00.000Z",
      }),
    ).toContain("No enrollment Attention changes");
  });

  it("keeps evaluate return paths on Attention, Home, or Enrollments", () => {
    expect(
      resolveAttentionEvaluateReturnPath(
        `/attention?org=${ORG_ID}`,
        "/attention",
      ),
    ).toContain("/attention");

    expect(
      resolveAttentionEvaluateReturnPath(`/home?org=${ORG_ID}`, "/attention"),
    ).toContain("/home");

    expect(
      resolveAttentionEvaluateReturnPath(
        `/enrollments/${ENROLLMENT_ID}?org=${ORG_ID}`,
        "/attention",
      ),
    ).toContain("/enrollments/");

    expect(
      resolveAttentionEvaluateReturnPath("https://evil.example/", "/attention"),
    ).toBe("/attention");

    expect(
      resolveAttentionEvaluateReturnPath("/tasks", "/attention"),
    ).toBe("/attention");
  });

  it("lists bounded revalidation paths including home and optional enrollment", () => {
    const orgOnly = listAttentionEvaluateRevalidationPaths(ORG_ID);
    expect(orgOnly).toContain("/attention");
    expect(orgOnly).toContain("/home");
    expect(orgOnly.some((p) => p.includes(ORG_ID))).toBe(true);

    const withEnrollment = listAttentionEvaluateRevalidationPaths(
      ORG_ID,
      ENROLLMENT_ID,
    );
    expect(withEnrollment.some((p) => p.includes(ENROLLMENT_ID))).toBe(true);
  });

  it("parses evaluate action input with optional enrollment and returnPath", () => {
    const ok = parseEvaluateAttentionRulesActionInput({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      returnPath: `/attention?org=${ORG_ID}`,
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.enrollmentId).toBe(ENROLLMENT_ID);
    }

    const orgWide = parseEvaluateAttentionRulesActionInput({
      organizationId: ORG_ID,
    });
    expect(orgWide.success).toBe(true);

    const bad = parseEvaluateAttentionRulesActionInput({
      organizationId: "not-a-uuid",
    });
    expect(bad.success).toBe(false);
  });

  it("exports stable evaluate action id", () => {
    expect(ATTENTION_EVALUATE_RULES_ACTION).toBe("evaluate_rules");
  });

  it("false-positive safeguards: archived, terminal status, fresh progress, and org-bound dedupe", () => {
    const evaluatedAt = "2026-08-20T12:00:00.000Z";

    expect(
      evaluateEnrollmentNoRecentProgress({
        enrollmentStatus: "active",
        enrollmentArchivedAt: "2026-08-01T00:00:00.000Z",
        enrollmentCreatedAt: "2026-07-01T00:00:00.000Z",
        latestNonVoidedProgressOccurredAt: null,
        evaluatedAt,
      }).reasonCode,
    ).toBe("ENROLLMENT_ARCHIVED");

    expect(
      evaluateEnrollmentNoRecentProgress({
        enrollmentStatus: "completed",
        enrollmentArchivedAt: null,
        enrollmentCreatedAt: "2026-07-01T00:00:00.000Z",
        latestNonVoidedProgressOccurredAt: null,
        evaluatedAt,
      }).reasonCode,
    ).toBe("ENROLLMENT_STATUS_INELIGIBLE");

    expect(
      evaluateEnrollmentNoRecentProgress({
        enrollmentStatus: "active",
        enrollmentArchivedAt: null,
        enrollmentCreatedAt: "2026-07-01T00:00:00.000Z",
        latestNonVoidedProgressOccurredAt: "2026-08-18T00:00:00.000Z",
        evaluatedAt,
      }),
    ).toMatchObject({ eligible: true, stale: false, reasonCode: "NOT_STALE" });

    expect(
      evaluateEnrollmentNoRecentProgress({
        enrollmentStatus: "paused",
        enrollmentArchivedAt: null,
        enrollmentCreatedAt: "2026-07-01T00:00:00.000Z",
        latestNonVoidedProgressOccurredAt: "2026-07-28T00:00:00.000Z",
        evaluatedAt,
      }),
    ).toMatchObject({ eligible: true, stale: true, reasonCode: "STALE" });

    const keyA = buildAttentionDedupeKey({
      organizationId: ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      signalKey: ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY,
    });
    const keyB = buildAttentionDedupeKey({
      organizationId: OTHER_ORG_ID,
      enrollmentId: ENROLLMENT_ID,
      signalKey: ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY,
    });
    expect(keyA).toContain(ORG_ID);
    expect(keyA).toContain(ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY);
    expect(keyA).not.toBe(keyB);
  });
});

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/attention/server/attention-rpc-adapters", () => ({
  evaluateAttentionRules: vi.fn(),
  evaluateProjectAttentionRules: vi.fn(),
}));

vi.mock("@/features/attention/server/enforce-attention-module-access", () => ({
  evaluateAttentionModuleAccess: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("evaluateAttentionRulesAction", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.mocked(evaluateAttentionModuleAccess).mockResolvedValue({ allowed: true });
  });

  it("evaluates with verified org context and revalidates home/attention", async () => {
    const { resolveOrganizationContext } = await import(
      "@/features/organizations/server/resolve-organization-context"
    );
    const { createSupabaseServerClient } = await import(
      "@/lib/supabase/server"
    );
    const { evaluateAttentionRules } = await import(
      "@/features/attention/server/attention-rpc-adapters"
    );
    const { revalidatePath } = await import("next/cache");
    const { evaluateAttentionRulesAction } = await import(
      "@/features/attention/actions/evaluate-attention-rules-action"
    );

    const supabase = { rpc: vi.fn() };
    vi.mocked(createSupabaseServerClient).mockResolvedValue(supabase as never);
    vi.mocked(resolveOrganizationContext).mockResolvedValue({
      ok: true,
      context: {
        organizationId: ORG_ID,
        role: "owner",
        membershipId: "11111111-1111-4111-8111-111111111111",
        timezone: "UTC",
      },
    } as never);
    vi.mocked(evaluateAttentionRules).mockResolvedValue({
      ok: true,
      data: {
        created: 2,
        updated: 0,
        expired: 0,
        evaluatedAt: "2026-08-20T05:00:00.000Z",
      },
    });

    const result = await evaluateAttentionRulesAction({
      organizationId: ORG_ID,
      returnPath: `/attention?org=${ORG_ID}`,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.result.created).toBe(2);
      expect(result.scope).toBe("organization");
    }
    expect(evaluateAttentionRules).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        input: expect.objectContaining({ organizationId: ORG_ID }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/attention");
    expect(revalidatePath).toHaveBeenCalledWith("/home");
  });

  it("denies when org context missing before RPC adapter", async () => {
    const { resolveOrganizationContext } = await import(
      "@/features/organizations/server/resolve-organization-context"
    );
    const { createSupabaseServerClient } = await import(
      "@/lib/supabase/server"
    );
    const { evaluateAttentionRules } = await import(
      "@/features/attention/server/attention-rpc-adapters"
    );
    const { evaluateAttentionRulesAction } = await import(
      "@/features/attention/actions/evaluate-attention-rules-action"
    );

    vi.mocked(createSupabaseServerClient).mockResolvedValue({} as never);
    vi.mocked(resolveOrganizationContext).mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    } as never);

    const result = await evaluateAttentionRulesAction({
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
    }
    expect(evaluateAttentionRules).not.toHaveBeenCalled();
  });

  it.each([
    [
      "enrollment evaluation",
      async () => {
        const { evaluateAttentionRulesAction } = await import(
          "@/features/attention/actions/evaluate-attention-rules-action"
        );
        return evaluateAttentionRulesAction({ organizationId: ORG_ID });
      },
      "evaluateAttentionRules",
    ],
    [
      "project evaluation",
      async () => {
        const { evaluateProjectAttentionRulesAction } = await import(
          "@/features/attention/actions/evaluate-project-attention-rules-action"
        );
        return evaluateProjectAttentionRulesAction({ organizationId: ORG_ID });
      },
      "evaluateProjectAttentionRules",
    ],
  ] as const)("denies %s before its RPC when Attention is hidden", async (
    _name,
    run,
    adapterName,
  ) => {
    const { resolveOrganizationContext } = await import(
      "@/features/organizations/server/resolve-organization-context"
    );
    const { createSupabaseServerClient } = await import("@/lib/supabase/server");
    const adapters = await import("@/features/attention/server/attention-rpc-adapters");

    vi.mocked(createSupabaseServerClient).mockResolvedValue({} as never);
    vi.mocked(resolveOrganizationContext).mockResolvedValue({
      ok: true,
      context: { organizationId: ORG_ID, role: "owner" },
    } as never);
    vi.mocked(evaluateAttentionModuleAccess).mockResolvedValue({
      allowed: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "This area is not available for your organization.",
        retryable: false,
        category: "permission",
      },
    });

    const result = await run();

    expect(result).toMatchObject({
      ok: false,
      committed: false,
      error: { code: "PERMISSION_DENIED" },
    });
    expect(adapters[adapterName]).not.toHaveBeenCalled();
  });
});

describe("reevaluateEnrollmentAttentionAfterProgress", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("skips Staff/Viewer and runs Owner evaluate for enrollment scope", async () => {
    const { evaluateAttentionRules } = await import(
      "@/features/attention/server/attention-rpc-adapters"
    );
    const { reevaluateEnrollmentAttentionAfterProgress } = await import(
      "@/features/attention/server/reevaluate-enrollment-attention-after-progress"
    );
    const { revalidatePath } = await import("next/cache");

    const skipped = await reevaluateEnrollmentAttentionAfterProgress({
      supabase: {} as never,
      organizationId: ORG_ID,
      role: "staff",
      enrollmentId: ENROLLMENT_ID,
    });
    expect(skipped).toEqual({ attempted: false, ok: false });
    expect(evaluateAttentionRules).not.toHaveBeenCalled();

    vi.mocked(evaluateAttentionRules).mockResolvedValue({
      ok: true,
      data: {
        created: 0,
        updated: 0,
        expired: 1,
        evaluatedAt: "2026-08-20T05:00:00.000Z",
      },
    });

    const ran = await reevaluateEnrollmentAttentionAfterProgress({
      supabase: {} as never,
      organizationId: ORG_ID,
      role: "owner",
      enrollmentId: ENROLLMENT_ID,
    });
    expect(ran).toEqual({ attempted: true, ok: true });
    expect(evaluateAttentionRules).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({
          organizationId: ORG_ID,
          enrollmentId: ENROLLMENT_ID,
        }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/home");
  });
});
