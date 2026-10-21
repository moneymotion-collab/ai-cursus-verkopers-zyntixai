import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getProgressFactById,
  listProgressFacts,
} from "@/features/progress/server/progress-read-queries";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import {
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  PROGRESS_FACT_ID,
  USER_ID,
  sampleProgressFactDetailRow,
  sampleProgressFactListRow,
} from "../helpers/progress-test-fixtures";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);

function createListSupabase(options: {
  rows?: unknown[];
  count?: number;
  error?: unknown;
}) {
  const range = vi.fn().mockResolvedValue({
    data: options.rows ?? [sampleProgressFactListRow],
    error: options.error ?? null,
    count: options.count ?? 1,
  });
  const orderId = vi.fn().mockReturnValue({ range });
  const orderField = vi.fn().mockReturnValue({ order: orderId });
  const ilike = vi.fn().mockReturnValue({ order: orderField });
  const is = vi.fn().mockReturnValue({
    order: orderField,
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    ilike,
  });
  const eq = vi.fn().mockReturnValue({
    is,
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: orderField,
    ilike,
  });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn((table: string) => {
    if (table === "customers" || table === "programs") {
      const inFn = vi.fn().mockResolvedValue({
        data:
          table === "customers"
            ? [{ id: CUSTOMER_ID, display_name: "Acme", status: "active", archived_at: null }]
            : [{ id: PROGRAM_ID, name: "Growth", status: "active", archived_at: null }],
        error: null,
      });
      const eqOrg = vi.fn().mockReturnValue({ in: inFn });
      return {
        select: vi.fn().mockReturnValue({ eq: eqOrg }),
      };
    }
    return { select };
  });

  return { supabase: { from } as unknown as SupabaseClient<Database>, eq, is, from };
}

function createDetailSupabase(options: {
  fact?: unknown | null;
  factError?: unknown;
  enrollment?: unknown | null;
}) {
  const maybeSingleFact = vi.fn().mockResolvedValue({
    data: options.fact === undefined ? sampleProgressFactDetailRow : options.fact,
    error: options.factError ?? null,
  });
  const eqId = vi.fn().mockReturnValue({ maybeSingle: maybeSingleFact });
  const eqOrg = vi.fn().mockReturnValue({ eq: eqId });

  const from = vi.fn((table: string) => {
    if (table === "enrollment_progress_facts") {
      return {
        select: vi.fn().mockReturnValue({ eq: eqOrg }),
      };
    }
    if (table === "enrollments") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data:
                  options.enrollment === undefined
                    ? {
                        id: ENROLLMENT_ID,
                        status: "active",
                        archived_at: null,
                        customer_id: CUSTOMER_ID,
                        program_id: PROGRAM_ID,
                      }
                    : options.enrollment,
                error: null,
              }),
            }),
          }),
        }),
      };
    }
    return {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    };
  });

  return { supabase: { from } as unknown as SupabaseClient<Database>, eqOrg };
}

beforeEach(() => {
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role: "owner",
      userId: USER_ID,
    },
  });
});

describe("progress read queries", () => {
  it("scopes list queries to organization and defaults to non-voided facts", async () => {
    const { supabase, eq, is } = createListSupabase({});
    const result = await listProgressFacts({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(true);
    expect(eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(is).toHaveBeenCalledWith("voided_at", null);
    if (result.ok) {
      expect(result.data.items[0]?.id).toBe(PROGRESS_FACT_ID);
      expect(result.data.items[0]?.customerDisplayName).toBe("Acme");
    }
  });

  it("fails closed when organization context cannot be resolved", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const { supabase } = createListSupabase({});
    const result = await listProgressFacts({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
    }
  });

  it("hides voided facts from staff via unavailable normalization", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: true,
      context: {
        organizationId: ORG_ID,
        membershipId: MEMBER_ID,
        role: "staff",
        userId: USER_ID,
      },
    });

    const { supabase } = createDetailSupabase({
      fact: {
        ...sampleProgressFactDetailRow,
        voided_at: "2026-07-21T00:00:00.000Z",
        voided_by_member_id: MEMBER_ID,
        void_reason: "Mistake",
      },
    });

    const result = await getProgressFactById({
      supabase,
      organizationId: ORG_ID,
      progressFactId: PROGRESS_FACT_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PROGRESS_FACT_UNAVAILABLE");
      expect(result.error.message).not.toContain(PROGRESS_FACT_ID);
    }
  });

  it("returns not-found for missing facts without leaking ids", async () => {
    const { supabase } = createDetailSupabase({ fact: null });
    const result = await getProgressFactById({
      supabase,
      organizationId: ORG_ID,
      progressFactId: PROGRESS_FACT_ID,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("PROGRESS_FACT_UNAVAILABLE");
    }
  });
});
