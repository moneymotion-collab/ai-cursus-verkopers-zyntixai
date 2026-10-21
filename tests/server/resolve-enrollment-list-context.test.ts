import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveEnrollmentListContext } from "@/features/enrollments/server/resolve-enrollment-list-context";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const CUSTOMER_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const PROGRAM_ID = "22222222-2222-4222-8222-222222222222";

function createContextSupabase(options: {
  customer?: { data: { display_name: string } | null; error?: unknown };
  program?: { data: { name: string } | null; error?: unknown };
}): SupabaseClient<Database> {
  function buildTable(result: { data: unknown; error?: unknown } | undefined) {
    const maybeSingle = vi
      .fn()
      .mockResolvedValue(result ?? { data: null, error: null });
    const eq2 = vi.fn().mockReturnValue({ maybeSingle });
    const eq1 = vi.fn().mockReturnValue({ eq: eq2 });
    return { select: vi.fn().mockReturnValue({ eq: eq1 }) };
  }

  const from = vi.fn((table: string) => {
    if (table === "customers") {
      return buildTable(options.customer);
    }
    if (table === "programs") {
      return buildTable(options.program);
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return { from } as unknown as SupabaseClient<Database>;
}

describe("resolveEnrollmentListContext", () => {
  it("returns ok with no labels and issues no queries when no ids are provided", async () => {
    const supabase = createContextSupabase({});
    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {});

    expect(result).toEqual({ kind: "ok" });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("resolves a customer label when the customer exists in the organization", async () => {
    const supabase = createContextSupabase({
      customer: { data: { display_name: "Acme Corp" }, error: null },
    });

    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {
      customerId: CUSTOMER_ID,
    });

    expect(result).toEqual({ kind: "ok", customerLabel: "Acme Corp", programLabel: undefined });
  });

  it("resolves a program label when the program exists in the organization", async () => {
    const supabase = createContextSupabase({
      program: { data: { name: "Growth Lab" }, error: null },
    });

    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {
      programId: PROGRAM_ID,
    });

    expect(result).toEqual({ kind: "ok", customerLabel: undefined, programLabel: "Growth Lab" });
  });

  it("resolves both labels when both ids exist in the organization", async () => {
    const supabase = createContextSupabase({
      customer: { data: { display_name: "Acme Corp" }, error: null },
      program: { data: { name: "Growth Lab" }, error: null },
    });

    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });

    expect(result).toEqual({ kind: "ok", customerLabel: "Acme Corp", programLabel: "Growth Lab" });
  });

  it("returns unavailable when the customer id does not resolve (missing or foreign org)", async () => {
    const supabase = createContextSupabase({
      customer: { data: null, error: null },
    });

    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {
      customerId: CUSTOMER_ID,
    });

    expect(result).toEqual({ kind: "unavailable" });
  });

  it("returns unavailable when the program id does not resolve (missing or foreign org)", async () => {
    const supabase = createContextSupabase({
      program: { data: null, error: null },
    });

    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {
      programId: PROGRAM_ID,
    });

    expect(result).toEqual({ kind: "unavailable" });
  });

  it("returns unavailable when one of two provided ids does not resolve", async () => {
    const supabase = createContextSupabase({
      customer: { data: { display_name: "Acme Corp" }, error: null },
      program: { data: null, error: null },
    });

    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {
      customerId: CUSTOMER_ID,
      programId: PROGRAM_ID,
    });

    expect(result).toEqual({ kind: "unavailable" });
  });

  it("treats a database error as unavailable rather than leaking details", async () => {
    const supabase = createContextSupabase({
      customer: { data: null, error: { message: "db down" } },
    });

    const result = await resolveEnrollmentListContext(supabase, ORG_ID, {
      customerId: CUSTOMER_ID,
    });

    expect(result).toEqual({ kind: "unavailable" });
  });
});
