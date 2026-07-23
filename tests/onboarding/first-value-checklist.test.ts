import { describe, expect, it, vi } from "vitest";
import {
  buildFirstValueChecklistHrefs,
  canManageFirstValueChecklist,
  deriveFirstValueChecklist,
} from "@/features/onboarding/domain/first-value-checklist";
import { dismissFirstValueChecklist } from "@/features/onboarding/server/dismiss-first-value-checklist";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

function baseInput(
  overrides: Partial<Parameters<typeof deriveFirstValueChecklist>[0]> = {},
) {
  return {
    organizationId: ORG_A,
    role: "owner",
    onboardingCompletedAt: "2026-07-20T10:00:00.000Z",
    firstRunChecklistDismissedAt: null,
    hasNonArchivedLead: false,
    hasNonArchivedTask: false,
    ...overrides,
  };
}

describe("canManageFirstValueChecklist", () => {
  it("allows owner and admin only", () => {
    expect(canManageFirstValueChecklist("owner")).toBe(true);
    expect(canManageFirstValueChecklist("admin")).toBe(true);
    expect(canManageFirstValueChecklist("staff")).toBe(false);
    expect(canManageFirstValueChecklist("viewer")).toBe(false);
  });
});

describe("deriveFirstValueChecklist", () => {
  it("is visible for owner when onboarding is complete, not dismissed, and items remain", () => {
    const state = deriveFirstValueChecklist(baseInput({ role: "owner" }));
    expect(state.visible).toBe(true);
    expect(state.completedCount).toBe(1);
    expect(state.companySetupComplete).toBe(true);
    expect(state.firstLeadComplete).toBe(false);
    expect(state.firstTaskComplete).toBe(false);
  });

  it("is visible for admin under the same incomplete conditions", () => {
    const state = deriveFirstValueChecklist(baseInput({ role: "admin" }));
    expect(state.visible).toBe(true);
  });

  it("is hidden for viewer and staff", () => {
    expect(deriveFirstValueChecklist(baseInput({ role: "viewer" })).visible).toBe(
      false,
    );
    expect(deriveFirstValueChecklist(baseInput({ role: "staff" })).visible).toBe(
      false,
    );
  });

  it("is hidden when onboarding is incomplete", () => {
    const state = deriveFirstValueChecklist(
      baseInput({ onboardingCompletedAt: null }),
    );
    expect(state.visible).toBe(false);
    expect(state.companySetupComplete).toBe(false);
    expect(state.completedCount).toBe(0);
  });

  it("is hidden when dismissed", () => {
    const state = deriveFirstValueChecklist(
      baseInput({
        firstRunChecklistDismissedAt: "2026-07-21T10:00:00.000Z",
      }),
    );
    expect(state.visible).toBe(false);
  });

  it("is hidden when all three required items are complete", () => {
    const state = deriveFirstValueChecklist(
      baseInput({
        hasNonArchivedLead: true,
        hasNonArchivedTask: true,
      }),
    );
    expect(state.visible).toBe(false);
    expect(state.completedCount).toBe(3);
  });

  it("marks first lead complete only for non-archived leads", () => {
    const withLead = deriveFirstValueChecklist(
      baseInput({ hasNonArchivedLead: true }),
    );
    const withoutLead = deriveFirstValueChecklist(
      baseInput({ hasNonArchivedLead: false }),
    );
    expect(withLead.firstLeadComplete).toBe(true);
    expect(withoutLead.firstLeadComplete).toBe(false);
  });

  it("marks first task complete only for non-archived tasks", () => {
    const withTask = deriveFirstValueChecklist(
      baseInput({ hasNonArchivedTask: true }),
    );
    const withoutTask = deriveFirstValueChecklist(
      baseInput({ hasNonArchivedTask: false }),
    );
    expect(withTask.firstTaskComplete).toBe(true);
    expect(withoutTask.firstTaskComplete).toBe(false);
  });

  it("does not use list filters in derivation — only provided org-scoped flags", () => {
    // Simulated filtered-empty page still receives true when org has a lead.
    const state = deriveFirstValueChecklist(
      baseInput({ hasNonArchivedLead: true, hasNonArchivedTask: false }),
    );
    expect(state.firstLeadComplete).toBe(true);
    expect(state.visible).toBe(true);
    expect(state.completedCount).toBe(2);
  });

  it("includes approved customer soft-link href without gating completion", () => {
    const state = deriveFirstValueChecklist(baseInput());
    const hrefs = buildFirstValueChecklistHrefs(ORG_A);
    expect(state.customerSoftLinkHref).toBe(hrefs.customerSoftLinkHref);
    expect(state.customerSoftLinkHref).toBe(`/customers?org=${ORG_A}`);
    expect(state.totalRequired).toBe(3);
    expect(state.completedCount).toBe(1);
  });
});

describe("dismissFirstValueChecklist", () => {
  function createDismissMock(options: {
    role: string;
    membershipOrgId?: string;
    existingDismissedAt?: string | null;
    updateReturns?: { first_run_checklist_dismissed_at: string } | null;
    updateError?: { message: string } | null;
  }) {
    const membershipOrgId = options.membershipOrgId ?? ORG_A;
    const existingDismissedAt =
      options.existingDismissedAt === undefined
        ? null
        : options.existingDismissedAt;

    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({
          data: { user: { id: "user-1" } },
          error: null,
        })),
      },
      from: vi.fn(),
      __updateCalls: [] as Array<Record<string, unknown>>,
    };

    supabase.from = vi.fn((table: string) => {
      if (table === "organization_members") {
        const builder: Record<string, unknown> = {};
        builder.select = vi.fn(() => builder);
        let eqCount = 0;
        builder.eq = vi.fn(() => {
          eqCount += 1;
          if (eqCount >= 2) {
            return Promise.resolve({
              data: [
                {
                  organization_id: membershipOrgId,
                  role: options.role,
                  status: "active",
                },
              ],
              error: null,
            });
          }
          return builder;
        });
        return builder;
      }

      if (table === "organizations") {
        const builder: Record<string, unknown> = {};
        builder.select = vi.fn(() => builder);
        builder.eq = vi.fn(() => builder);
        builder.is = vi.fn(() => builder);
        builder.update = vi.fn((payload: Record<string, unknown>) => {
          supabase.__updateCalls.push(payload);
          return builder;
        });
        builder.maybeSingle = vi.fn(async () => {
          if (supabase.__updateCalls.length > 0) {
            if (options.updateError) {
              return { data: null, error: options.updateError };
            }
            return {
              data: options.updateReturns ?? {
                first_run_checklist_dismissed_at:
                  "2026-07-22T12:00:00.000Z",
              },
              error: null,
            };
          }
          return {
            data: {
              first_run_checklist_dismissed_at: existingDismissedAt,
            },
            error: null,
          };
        });
        return builder;
      }

      throw new Error(`unexpected table ${table}`);
    });

    return supabase;
  }

  it("persists dismiss timestamp for owner", async () => {
    const supabase = createDismissMock({ role: "owner" });
    const result = await dismissFirstValueChecklist(
      supabase as never,
      ORG_A,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.dismissedAt).toBe("2026-07-22T12:00:00.000Z");
    }
    expect(supabase.__updateCalls).toHaveLength(1);
    expect(supabase.__updateCalls[0]).toEqual({
      first_run_checklist_dismissed_at: expect.any(String),
    });
  });

  it("is idempotent and preserves an existing dismiss timestamp", async () => {
    const existing = "2026-07-21T08:00:00.000Z";
    const supabase = createDismissMock({
      role: "admin",
      existingDismissedAt: existing,
    });
    const result = await dismissFirstValueChecklist(
      supabase as never,
      ORG_A,
    );
    expect(result).toEqual({ ok: true, dismissedAt: existing });
    expect(supabase.__updateCalls).toHaveLength(0);
  });

  it("rejects staff and viewer", async () => {
    for (const role of ["staff", "viewer"] as const) {
      const supabase = createDismissMock({ role });
      const result = await dismissFirstValueChecklist(
        supabase as never,
        ORG_A,
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.code).toBe("forbidden");
      }
      expect(supabase.__updateCalls).toHaveLength(0);
    }
  });

  it("rejects dismiss for a foreign organization", async () => {
    const supabase = createDismissMock({
      role: "owner",
      membershipOrgId: ORG_A,
    });
    const result = await dismissFirstValueChecklist(
      supabase as never,
      ORG_B,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("organization_not_found");
    }
    expect(supabase.__updateCalls).toHaveLength(0);
  });
});

describe("loadFirstValueChecklist", () => {
  function createLoaderMock(options: {
    role: string;
    organizationId?: string;
    onboardingCompletedAt?: string | null;
    dismissedAt?: string | null;
    leadCount?: number;
    taskCount?: number;
  }) {
    const organizationId = options.organizationId ?? ORG_A;
    const queriedTables: string[] = [];
    const organizationIdsSeen: string[] = [];

    const supabase = {
      from: vi.fn((table: string) => {
        queriedTables.push(table);
        const builder: Record<string, unknown> = {};
        builder.select = vi.fn(() => builder);
        builder.eq = vi.fn((column: string, value: unknown) => {
          if (column === "organization_id" || column === "id") {
            organizationIdsSeen.push(String(value));
          }
          return builder;
        });
        builder.is = vi.fn(() => builder);
        builder.maybeSingle = vi.fn(async () => ({
          data: {
            onboarding_completed_at:
              options.onboardingCompletedAt === undefined
                ? "2026-07-20T10:00:00.000Z"
                : options.onboardingCompletedAt,
            first_run_checklist_dismissed_at:
              options.dismissedAt === undefined ? null : options.dismissedAt,
          },
          error: null,
        }));
        // head count path resolves as thenable from final chain call
        builder.then = undefined;
        const count =
          table === "leads"
            ? (options.leadCount ?? 0)
            : table === "tasks"
              ? (options.taskCount ?? 0)
              : 0;
        // Make the builder awaitable for count queries
        Object.defineProperty(builder, "then", {
          value: (
            resolve: (value: { count: number; error: null }) => void,
          ) => {
            resolve({ count, error: null });
          },
          configurable: true,
        });
        return builder;
      }),
      __queriedTables: queriedTables,
      __organizationIdsSeen: organizationIdsSeen,
    };

    return supabase;
  }

  it("short-circuits staff and viewer before organization or count queries", async () => {
    const { loadFirstValueChecklist } = await import(
      "@/features/onboarding/server/load-first-value-checklist"
    );

    for (const role of ["staff", "viewer"] as const) {
      const supabase = createLoaderMock({ role });
      const result = await loadFirstValueChecklist({
        supabase: supabase as never,
        organizationId: ORG_A,
        role,
      });
      expect(result).toBeNull();
      expect(supabase.__queriedTables).toEqual([]);
    }
  });

  it("scopes eligible owner counts to the resolved organization id only", async () => {
    const { loadFirstValueChecklist } = await import(
      "@/features/onboarding/server/load-first-value-checklist"
    );
    const supabase = createLoaderMock({
      role: "owner",
      organizationId: ORG_A,
      leadCount: 1,
      taskCount: 0,
    });

    const result = await loadFirstValueChecklist({
      supabase: supabase as never,
      organizationId: ORG_A,
      role: "owner",
    });

    expect(result?.visible).toBe(true);
    expect(result?.firstLeadComplete).toBe(true);
    expect(result?.firstTaskComplete).toBe(false);
    expect(supabase.__queriedTables).toEqual(["organizations", "leads", "tasks"]);
    expect(supabase.__organizationIdsSeen.every((id) => id === ORG_A)).toBe(
      true,
    );
    expect(supabase.__organizationIdsSeen).not.toContain(ORG_B);
  });

  it("skips lead and task count queries when onboarding is incomplete", async () => {
    const { loadFirstValueChecklist } = await import(
      "@/features/onboarding/server/load-first-value-checklist"
    );
    const supabase = createLoaderMock({
      role: "admin",
      onboardingCompletedAt: null,
    });

    const result = await loadFirstValueChecklist({
      supabase: supabase as never,
      organizationId: ORG_A,
      role: "admin",
    });

    expect(result?.visible).toBe(false);
    expect(supabase.__queriedTables).toEqual(["organizations"]);
  });

  it("skips lead and task count queries when checklist is already dismissed", async () => {
    const { loadFirstValueChecklist } = await import(
      "@/features/onboarding/server/load-first-value-checklist"
    );
    const supabase = createLoaderMock({
      role: "owner",
      dismissedAt: "2026-07-21T10:00:00.000Z",
    });

    const result = await loadFirstValueChecklist({
      supabase: supabase as never,
      organizationId: ORG_A,
      role: "owner",
    });

    expect(result?.visible).toBe(false);
    expect(supabase.__queriedTables).toEqual(["organizations"]);
  });
});
