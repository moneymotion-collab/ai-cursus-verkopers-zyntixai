import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  loadTaskFormOptions,
  MAX_TASK_FORM_OPTIONS,
} from "@/features/tasks/ui/load-task-form-options";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

function createOptionsSupabase(
  responses: Record<string, { data: unknown[]; error: null }>,
  rpcRows: Array<{ membership_id: string; display_label: string }> = [],
) {
  const from = vi.fn((table: string) => {
    const response = responses[table];
    if (!response) {
      throw new Error(`Unexpected table ${table}`);
    }
    const chain: Record<string, unknown> = {};
    chain.select = vi.fn(() => chain);
    chain.eq = vi.fn(() => chain);
    chain.is = vi.fn(() => chain);
    chain.order = vi.fn(() => chain);
    chain.limit = vi.fn(() => chain);
    chain.in = vi.fn().mockResolvedValue(response);
    chain.then = undefined;
    if (table === "organization_members" || table === "leads" || table === "customers" || table === "enrollments") {
      chain.limit = vi.fn().mockResolvedValue(response);
    }
    return chain;
  });
  const rpc = vi.fn().mockResolvedValue({ data: rpcRows, error: null });

  return { from, rpc } as unknown as SupabaseClient<Database>;
}

describe("loadTaskFormOptions", () => {
  it("loads bounded member and linked-context options with explicit columns", async () => {
    const supabase = createOptionsSupabase({
      organization_members: {
        data: [{ id: "member-1", user_id: "user-1" }],
        error: null,
      },
      leads: {
        data: [{ id: "lead-1", display_name: "Acme Lead" }],
        error: null,
      },
      customers: {
        data: [{ id: "customer-1", display_name: "Acme Customer" }],
        error: null,
      },
      enrollments: {
        data: [{ id: "enrollment-1", customer_id: "customer-1", program_id: "program-1" }],
        error: null,
      },
      programs: {
        data: [{ id: "program-1", name: "Sales Program" }],
        error: null,
      },
    }, [{ membership_id: "member-1", display_label: "Alex Morgan" }]);

    const options = await loadTaskFormOptions(supabase, ORG_ID);
    expect(options.members[0]).toEqual({ value: "member-1", label: "Alex Morgan" });
    expect(options.members[0]?.value).toBe("member-1");
    expect(options.leads[0].label).toBe("Acme Lead");
    expect(options.customers[0].label).toBe("Acme Customer");
    expect(options.enrollments[0]).toMatchObject({
      value: "enrollment-1",
      customerId: "customer-1",
      programId: "program-1",
      label: "Acme Customer · Sales Program",
    });
    expect(supabase.from).toHaveBeenCalled();
  });

  it("reports capped collections at the safe limit", async () => {
    const rows = Array.from({ length: MAX_TASK_FORM_OPTIONS + 1 }, (_, index) => ({
      id: `lead-${index}`,
      display_name: `Lead ${index}`,
    }));
    const supabase = createOptionsSupabase({
      organization_members: { data: [], error: null },
      leads: { data: rows, error: null },
      customers: { data: [], error: null },
      enrollments: { data: [], error: null },
    });

    const options = await loadTaskFormOptions(supabase, ORG_ID);
    expect(options.leads).toHaveLength(MAX_TASK_FORM_OPTIONS);
    expect(options.capped.leads).toBe(true);
  });

  it("keeps membership ids as values and distinguishes members without profile names", async () => {
    const named = "member-named";
    const metaA = "member-meta-a";
    const metaB = "member-meta-b";
    const supabase = createOptionsSupabase(
      {
        organization_members: {
          data: [
            { id: named, user_id: "user-named" },
            { id: metaA, user_id: "user-meta-a" },
            { id: metaB, user_id: "user-meta-b" },
          ],
          error: null,
        },
        leads: { data: [], error: null },
        customers: { data: [], error: null },
        enrollments: { data: [], error: null },
      },
      [
        { membership_id: named, display_label: "Jan Jansen" },
        { membership_id: metaA, display_label: "Lisa de Vries" },
        { membership_id: metaB, display_label: "Alpha Tester" },
        { membership_id: "foreign-or-inactive", display_label: "Should not appear" },
      ],
    );

    const options = await loadTaskFormOptions(supabase, ORG_ID);

    expect(options.members.map((row) => row.value)).toEqual([named, metaA, metaB]);
    expect(options.members.map((row) => row.label)).toEqual([
      "Jan Jansen",
      "Lisa de Vries",
      "Alpha Tester",
    ]);
    expect(new Set(options.members.map((row) => row.label)).size).toBe(3);
    expect(options.members.some((row) => row.value === "foreign-or-inactive")).toBe(false);
    expect(options.members.some((row) => row.label === "Team member")).toBe(false);
    expect(supabase.rpc).toHaveBeenCalled();
  });
});
