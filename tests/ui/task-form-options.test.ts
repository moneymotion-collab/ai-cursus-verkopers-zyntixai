import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  loadTaskFormOptions,
  MAX_TASK_FORM_OPTIONS,
} from "@/features/tasks/ui/load-task-form-options";

const ORG_ID = "11111111-1111-4111-8111-111111111111";

function createOptionsSupabase(responses: Record<string, { data: unknown[]; error: null }>) {
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

  return { from } as unknown as SupabaseClient<Database>;
}

describe("loadTaskFormOptions", () => {
  it("loads bounded member and linked-context options with explicit columns", async () => {
    const supabase = createOptionsSupabase({
      organization_members: {
        data: [{ id: "member-1", user_id: "user-1" }],
        error: null,
      },
      profiles: {
        data: [{ id: "user-1", display_name: "Alex Morgan" }],
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
    });

    const options = await loadTaskFormOptions(supabase, ORG_ID);
    expect(options.members[0]).toEqual({ value: "member-1", label: "Alex Morgan" });
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
});
