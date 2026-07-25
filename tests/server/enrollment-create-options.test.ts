import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  loadEligibleEnrollmentCustomers,
  loadEligibleEnrollmentMembers,
  loadEligibleEnrollmentPrograms,
  loadEnrollmentCreateOptions,
  MAX_ENROLLMENT_CREATE_OPTIONS,
} from "@/features/enrollments/server/load-enrollment-create-options";
import { ORG_ID } from "../helpers/enrollment-test-fixtures";

type QueryResult = { data?: unknown; error?: unknown };

function createChainableQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  for (const method of ["eq", "is", "in", "order", "limit"]) {
    builder[method] = vi.fn(() => builder);
  }
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  return builder;
}

type MockOptions = {
  customers?: QueryResult;
  programs?: QueryResult;
  members?: QueryResult;
  profiles?: QueryResult;
};

function createMockSupabase(options: MockOptions = {}) {
  const builders = {
    customers: createChainableQuery(options.customers ?? { data: [], error: null }),
    programs: createChainableQuery(options.programs ?? { data: [], error: null }),
    members: createChainableQuery(options.members ?? { data: [], error: null }),
    profiles: createChainableQuery(options.profiles ?? { data: [], error: null }),
  };

  const from = vi.fn((table: string) => {
    if (table === "customers") {
      return { select: vi.fn(() => builders.customers) };
    }
    if (table === "programs") {
      return { select: vi.fn(() => builders.programs) };
    }
    if (table === "organization_members") {
      return { select: vi.fn(() => builders.members) };
    }
    if (table === "profiles") {
      return { select: vi.fn(() => builders.profiles) };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    supabase: { from } as unknown as SupabaseClient<Database>,
    builders,
    from,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadEligibleEnrollmentCustomers", () => {
  it("filters to same-org, non-archived, onboarding/active customers ordered by name", async () => {
    const { supabase, builders } = createMockSupabase({
      customers: {
        data: [
          { id: "c1", display_name: "Acme Corp", status: "active" },
          { id: "c2", display_name: "Beta Inc", status: "onboarding" },
        ],
        error: null,
      },
    });

    const result = await loadEligibleEnrollmentCustomers(supabase, ORG_ID);

    expect(result.options).toHaveLength(2);
    expect(result.options[0]).toEqual({ value: "c1", label: "Acme Corp", status: "active" });
    expect(builders.customers.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(builders.customers.is).toHaveBeenCalledWith("archived_at", null);
    expect(builders.customers.in).toHaveBeenCalledWith("status", ["onboarding", "active"]);
    expect(builders.customers.order).toHaveBeenCalledWith("display_name", { ascending: true });
    expect(result.capped).toBe(false);
    expect(result.failed).toBe(false);
  });

  it("excludes ineligible customers by relying on the eligibility query (paused/completed/cancelled/churned never returned)", async () => {
    const { supabase } = createMockSupabase({
      customers: { data: [], error: null },
    });

    const result = await loadEligibleEnrollmentCustomers(supabase, ORG_ID);
    expect(result.options).toEqual([]);
  });

  it("returns empty options and marks failed without leaking SQL details on query error", async () => {
    const { supabase } = createMockSupabase({
      customers: { data: null, error: new Error("relation customers does not exist") },
    });

    const result = await loadEligibleEnrollmentCustomers(supabase, ORG_ID);
    expect(result.options).toEqual([]);
    expect(result.failed).toBe(true);
  });

  it("caps results at MAX_ENROLLMENT_CREATE_OPTIONS and flags capped", async () => {
    const rows = Array.from({ length: MAX_ENROLLMENT_CREATE_OPTIONS + 1 }, (_, i) => ({
      id: `c${i}`,
      display_name: `Customer ${i}`,
      status: "active",
    }));
    const { supabase } = createMockSupabase({ customers: { data: rows, error: null } });

    const result = await loadEligibleEnrollmentCustomers(supabase, ORG_ID);
    expect(result.options).toHaveLength(MAX_ENROLLMENT_CREATE_OPTIONS);
    expect(result.capped).toBe(true);
  });
});

describe("loadEligibleEnrollmentPrograms", () => {
  it("filters to same-org, non-archived, status exactly active programs ordered by name", async () => {
    const { supabase, builders } = createMockSupabase({
      programs: {
        data: [{ id: "p1", name: "Growth Lab" }],
        error: null,
      },
    });

    const result = await loadEligibleEnrollmentPrograms(supabase, ORG_ID);

    expect(result.options).toEqual([{ value: "p1", label: "Growth Lab" }]);
    expect(builders.programs.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(builders.programs.is).toHaveBeenCalledWith("archived_at", null);
    expect(builders.programs.eq).toHaveBeenCalledWith("status", "active");
    expect(builders.programs.order).toHaveBeenCalledWith("name", { ascending: true });
  });

  it("returns empty options and marks failed on query error", async () => {
    const { supabase } = createMockSupabase({
      programs: { data: null, error: new Error("boom") },
    });

    const result = await loadEligibleEnrollmentPrograms(supabase, ORG_ID);
    expect(result.options).toEqual([]);
    expect(result.failed).toBe(true);
  });
});

describe("loadEligibleEnrollmentMembers", () => {
  it("returns active organization members with resolved profile display names", async () => {
    const { supabase } = createMockSupabase({
      members: {
        data: [{ id: "m1", user_id: "u1" }],
        error: null,
      },
      profiles: {
        data: [{ id: "u1", display_name: "Jordan Lee" }],
        error: null,
      },
    });

    const result = await loadEligibleEnrollmentMembers(supabase, ORG_ID);
    expect(result.options).toEqual([{ value: "m1", label: "Jordan Lee" }]);
  });

  it("falls back to a safe label when a profile is missing", async () => {
    const { supabase } = createMockSupabase({
      members: { data: [{ id: "m1", user_id: "u1" }], error: null },
      profiles: { data: [], error: null },
    });

    const result = await loadEligibleEnrollmentMembers(supabase, ORG_ID);
    expect(result.options).toEqual([{ value: "m1", label: "Team member" }]);
  });

  it("returns no options when there are no active members", async () => {
    const { supabase } = createMockSupabase({ members: { data: [], error: null } });
    const result = await loadEligibleEnrollmentMembers(supabase, ORG_ID);
    expect(result.options).toEqual([]);
  });
});

describe("loadEnrollmentCreateOptions", () => {
  it("combines customers, programs and members with capped flags", async () => {
    const { supabase } = createMockSupabase({
      customers: { data: [{ id: "c1", display_name: "Acme", status: "active" }], error: null },
      programs: { data: [{ id: "p1", name: "Growth Lab" }], error: null },
      members: { data: [{ id: "m1", user_id: "u1" }], error: null },
      profiles: { data: [{ id: "u1", display_name: "Jordan Lee" }], error: null },
    });

    const result = await loadEnrollmentCreateOptions(supabase, ORG_ID);

    expect(result.customers).toHaveLength(1);
    expect(result.programs).toHaveLength(1);
    expect(result.members).toHaveLength(1);
    expect(result.capped).toEqual({ customers: false, programs: false, members: false });
    expect(result.error).toBeUndefined();
  });

  it("returns a safe error message and empty arrays when a query fails, without leaking internals", async () => {
    const { supabase } = createMockSupabase({
      customers: { data: null, error: new Error("relation customers does not exist") },
    });

    const result = await loadEnrollmentCreateOptions(supabase, ORG_ID);

    expect(result.customers).toEqual([]);
    expect(result.error).toBeTruthy();
    expect(result.error).not.toMatch(/relation|does not exist|SQL/i);
  });
});
