import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  getAttentionItemById,
  listAttentionEventsForItem,
  listAttentionItems,
} from "@/features/attention/server/attention-read-queries";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import {
  ATTENTION_ITEM_ID,
  CUSTOMER_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  USER_ID,
  sampleAttentionEventRow,
  sampleAttentionItemDetailRow,
  sampleAttentionItemListRow,
  sampleAttentionSignalRow,
} from "../helpers/attention-test-fixtures";

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
    data: options.rows ?? [sampleAttentionItemListRow],
    error: options.error ?? null,
    count: options.count ?? 1,
  });
  const orderId = vi.fn().mockReturnValue({ range });
  const orderField = vi.fn().mockReturnValue({ order: orderId });
  const is = vi.fn().mockReturnValue({
    order: orderField,
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
  });
  const eq = vi.fn().mockReturnValue({
    is,
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    not: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: orderField,
  });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn((table: string) => {
    if (table === "customers" || table === "programs") {
      const inFn = vi.fn().mockResolvedValue({
        data:
          table === "customers"
            ? [
                {
                  id: CUSTOMER_ID,
                  display_name: "Acme",
                  status: "active",
                  archived_at: null,
                },
              ]
            : [
                {
                  id: PROGRAM_ID,
                  name: "Growth",
                  status: "active",
                  archived_at: null,
                },
              ],
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
  item?: unknown | null;
  itemError?: unknown;
  events?: unknown[];
}) {
  const maybeSingleItem = vi.fn().mockResolvedValue({
    data:
      options.item === undefined ? sampleAttentionItemDetailRow : options.item,
    error: options.itemError ?? null,
  });
  const eqId = vi.fn().mockReturnValue({ maybeSingle: maybeSingleItem });
  const eqOrg = vi.fn().mockReturnValue({ eq: eqId });

  const from = vi.fn((table: string) => {
    if (table === "attention_items") {
      return {
        select: vi.fn().mockReturnValue({ eq: eqOrg }),
      };
    }
    if (table === "attention_signals") {
      const orderId = vi.fn().mockResolvedValue({
        data: [sampleAttentionSignalRow],
        error: null,
      });
      const orderDetected = vi.fn().mockReturnValue({ order: orderId });
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: orderDetected,
            }),
          }),
        }),
      };
    }
    if (table === "attention_item_events") {
      const orderId = vi.fn().mockResolvedValue({
        data: options.events ?? [sampleAttentionEventRow],
        error: null,
      });
      const orderCreated = vi.fn().mockReturnValue({ order: orderId });
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: orderCreated,
            }),
          }),
        }),
      };
    }
    if (table === "enrollments") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  id: ENROLLMENT_ID,
                  status: "active",
                  archived_at: null,
                  customer_id: CUSTOMER_ID,
                  program_id: PROGRAM_ID,
                },
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

describe("attention read queries", () => {
  it("scopes list queries to organization and defaults to non-archived items", async () => {
    const { supabase, eq, is } = createListSupabase({});
    const result = await listAttentionItems({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(true);
    expect(eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(is).toHaveBeenCalledWith("archived_at", null);
    if (result.ok) {
      expect(result.data.items[0]?.id).toBe(ATTENTION_ITEM_ID);
      expect(result.data.items[0]?.customerDisplayName).toBe("Acme");
      expect(result.data.items[0]?.programName).toBe("Growth");
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
    const result = await listAttentionItems({
      supabase,
      organizationId: ORG_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
    }
  });

  it("returns unavailable for missing detail and hides archived from staff", async () => {
    const missing = createDetailSupabase({ item: null });
    const missingResult = await getAttentionItemById({
      supabase: missing.supabase,
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
    });
    expect(missingResult.ok).toBe(false);
    if (!missingResult.ok) {
      expect(missingResult.error.code).toBe("ATTENTION_ITEM_UNAVAILABLE");
    }

    resolveOrganizationContext.mockResolvedValue({
      ok: true,
      context: {
        organizationId: ORG_ID,
        membershipId: MEMBER_ID,
        role: "staff",
        userId: USER_ID,
      },
    });

    const archived = createDetailSupabase({
      item: {
        ...sampleAttentionItemDetailRow,
        status: "resolved",
        archived_at: "2026-08-04T10:00:00.000Z",
      },
    });
    const archivedResult = await getAttentionItemById({
      supabase: archived.supabase,
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
    });
    expect(archivedResult.ok).toBe(false);
    if (!archivedResult.ok) {
      expect(archivedResult.error.code).toBe("ATTENTION_ITEM_UNAVAILABLE");
    }
  });

  it("loads detail with related context and chronological events", async () => {
    const { supabase } = createDetailSupabase({});
    const result = await getAttentionItemById({
      supabase,
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe(ATTENTION_ITEM_ID);
      expect(result.data.enrollment?.id).toBe(ENROLLMENT_ID);
      expect(result.data.signals).toHaveLength(1);
      expect(result.data.events[0]?.eventType).toBe("created");
    }

    const events = await listAttentionEventsForItem({
      supabase,
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
    });
    expect(events.ok).toBe(true);
    if (events.ok) {
      expect(events.data).toHaveLength(1);
    }
  });

  it("maps database errors without returning empty success", async () => {
    const { supabase } = createListSupabase({
      error: { message: "connection refused", code: "57014" },
      rows: [],
      count: 0,
    });
    const result = await listAttentionItems({
      supabase,
      organizationId: ORG_ID,
    });
    expect(result.ok).toBe(false);
  });
});
