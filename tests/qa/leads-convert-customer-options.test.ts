import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadLeadConvertCustomerOptions } from "@/features/leads/ui/load-lead-workflow-page";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

function createCustomerOptionsSupabase(rows: Array<{ id: string; display_name: string | null }>) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    is: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue({ data: rows, error: null }),
  };
  const from = vi.fn(() => chain);
  return { from, chain } as unknown as SupabaseClient<Database> & {
    from: typeof from;
    chain: typeof chain;
  };
}

describe("loadLeadConvertCustomerOptions", () => {
  it("returns active organization customers with labels", async () => {
    const supabase = createCustomerOptionsSupabase([
      { id: "33333333-3333-4333-8333-333333333333", display_name: "Alpha Customer" },
    ]);

    const options = await loadLeadConvertCustomerOptions(supabase, ORG_ID);
    expect(options.customers).toEqual([
      { value: "33333333-3333-4333-8333-333333333333", label: "Alpha Customer" },
    ]);
    expect(options.capped).toBe(false);
    expect(supabase.from).toHaveBeenCalledWith("customers");
    expect(supabase.chain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(supabase.chain.is).toHaveBeenCalledWith("archived_at", null);
  });

  it("caps options at 100 and reports capped state above the limit", async () => {
    const rows = Array.from({ length: 101 }, (_, index) => ({
      id: `55555555-5555-4555-8555-${String(index).padStart(12, "0")}`,
      display_name: `Customer ${index}`,
    }));
    const supabase = createCustomerOptionsSupabase(rows);

    const options = await loadLeadConvertCustomerOptions(supabase, ORG_ID);
    expect(options.customers).toHaveLength(100);
    expect(options.capped).toBe(true);
  });
});
