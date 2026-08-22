import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  collectLabelReferencesFromListItems,
  resolveLinkedContextLabel,
  resolveMemberLabel,
  resolveTaskDisplayLabels,
} from "@/features/tasks/ui/resolve-task-display-labels";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const MEMBER_A = "22222222-2222-4222-8222-222222222222";
const MEMBER_B = "33333333-3333-4333-8333-333333333333";
const LEAD_ID = "44444444-4444-4444-8444-444444444444";
const CUSTOMER_ID = "55555555-5555-4555-8555-555555555555";
const PROGRAM_ID = "66666666-6666-4666-8666-666666666666";

function createLabelSupabase(
  responses: Record<string, QueryResult>,
  rpcRows: Array<{ membership_id: string; display_label: string }> = [],
) {
  const from = vi.fn((table: string) => {
    const response = responses[table];
    if (!response) {
      throw new Error(`Unexpected table ${table}`);
    }

    const chain: Record<string, unknown> = {};
    chain.eq = vi.fn(() => chain);
    chain.in = vi.fn().mockResolvedValue(response);
    chain.select = vi.fn(() => chain);
    return chain;
  });
  const rpc = vi.fn().mockResolvedValue({ data: rpcRows, error: null });

  return { from, rpc } as unknown as SupabaseClient<Database>;
}

type QueryResult = { data: unknown[]; error: null };

describe("resolveTaskDisplayLabels", () => {
  it("deduplicates member IDs across tasks", () => {
    const refs = collectLabelReferencesFromListItems([
      {
        id: "t1",
        organizationId: ORG_ID,
        title: "A",
        status: "open",
        taskType: "general",
        priority: "normal",
        source: "manual",
        dueAt: "2026-07-15T09:00:00.000Z",
        assigneeMemberId: MEMBER_A,
        linkedContext: { kind: "lead", leadId: LEAD_ID },
        archivedAt: null,
        createdAt: "2026-07-10T08:00:00.000Z",
        derived: {
          terminal: false,
          archived: false,
          overdue: false,
          dueToday: false,
          upcoming: true,
          dueState: "upcoming",
        },
      },
      {
        id: "t2",
        organizationId: ORG_ID,
        title: "B",
        status: "open",
        taskType: "general",
        priority: "normal",
        source: "manual",
        dueAt: "2026-07-16T09:00:00.000Z",
        assigneeMemberId: MEMBER_A,
        linkedContext: { kind: "customer", customerId: CUSTOMER_ID },
        archivedAt: null,
        createdAt: "2026-07-10T08:00:00.000Z",
        derived: {
          terminal: false,
          archived: false,
          overdue: false,
          dueToday: false,
          upcoming: true,
          dueState: "upcoming",
        },
      },
      {
        id: "t3",
        organizationId: ORG_ID,
        title: "C",
        status: "open",
        taskType: "general",
        priority: "normal",
        source: "manual",
        dueAt: "2026-07-17T09:00:00.000Z",
        assigneeMemberId: MEMBER_B,
        linkedContext: {
          kind: "enrollment",
          enrollmentId: "e1",
          customerId: CUSTOMER_ID,
          programId: PROGRAM_ID,
        },
        archivedAt: null,
        createdAt: "2026-07-10T08:00:00.000Z",
        derived: {
          terminal: false,
          archived: false,
          overdue: false,
          dueToday: false,
          upcoming: true,
          dueState: "upcoming",
        },
      },
    ]);

    expect(refs.memberIds).toEqual([MEMBER_A, MEMBER_B]);
    expect(refs.leadIds).toEqual([LEAD_ID]);
    expect(refs.customerIds).toEqual([CUSTOMER_ID]);
    expect(refs.programIds).toEqual([PROGRAM_ID]);
  });

  it("uses org-scoped member labels without reading colleague profiles directly", async () => {
    const supabase = createLabelSupabase(
      {
        leads: { data: [{ id: LEAD_ID, display_name: "Acme Lead" }], error: null },
        customers: { data: [{ id: CUSTOMER_ID, display_name: "Acme Customer" }], error: null },
        programs: { data: [{ id: PROGRAM_ID, name: "Sales Program" }], error: null },
      },
      [
        { membership_id: MEMBER_A, display_label: "Alex Morgan" },
        { membership_id: MEMBER_B, display_label: "Team member" },
      ],
    );

    const labels = await resolveTaskDisplayLabels(supabase, ORG_ID, {
      memberIds: [MEMBER_A, MEMBER_B],
      leadIds: [LEAD_ID],
      customerIds: [CUSTOMER_ID],
      programIds: [PROGRAM_ID],
    });

    expect(labels.members[MEMBER_A]).toBe("Alex Morgan");
    expect(labels.members[MEMBER_B]).toBe("Team member");
    expect(labels.leads[LEAD_ID]).toBe("Acme Lead");
    expect(labels.customers[CUSTOMER_ID]).toBe("Acme Customer");
    expect(labels.programs[PROGRAM_ID]).toBe("Sales Program");
    expect(supabase.from).toHaveBeenCalledTimes(3);
    expect(supabase.rpc).toHaveBeenCalled();
  });

  it("uses neutral fallbacks and never returns raw UUID labels", async () => {
    const labels = await resolveTaskDisplayLabels(
      createLabelSupabase({
        organization_members: { data: [], error: null },
        leads: { data: [], error: null },
      }),
      ORG_ID,
      {
        memberIds: ["00000000-0000-4000-8000-000000000099"],
        leadIds: ["00000000-0000-4000-8000-000000000088"],
        customerIds: [],
        programIds: [],
      },
    );

    expect(resolveMemberLabel("00000000-0000-4000-8000-000000000099", labels)).toBe("Team member");
    expect(resolveMemberLabel(null, labels)).toBe("Unassigned");
    expect(
      resolveLinkedContextLabel({ kind: "lead", leadId: "00000000-0000-4000-8000-000000000088" }, labels),
    ).toBe("Linked lead");
    expect(
      Object.values(labels.members)
        .concat(Object.values(labels.leads))
        .some((value) => /[0-9a-f-]{36}/i.test(value)),
    ).toBe(false);
  });

  it("builds enrollment labels from related records", async () => {
    const supabase = createLabelSupabase({
      customers: { data: [{ id: CUSTOMER_ID, display_name: "Acme Customer" }], error: null },
      programs: { data: [{ id: PROGRAM_ID, name: "Sales Program" }], error: null },
    });

    const labels = await resolveTaskDisplayLabels(supabase, ORG_ID, {
      memberIds: [],
      leadIds: [],
      customerIds: [CUSTOMER_ID],
      programIds: [PROGRAM_ID],
    });

    const enrollmentLabel = resolveLinkedContextLabel(
      {
        kind: "enrollment",
        enrollmentId: "en-1",
        customerId: CUSTOMER_ID,
        programId: PROGRAM_ID,
      },
      labels,
    );

    expect(enrollmentLabel).toBe("Acme Customer · Sales Program");
  });

  it("falls back safely when member-label RPC fails", async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error("query failed");
      }),
      rpc: vi.fn().mockRejectedValue(new Error("rpc failed")),
    } as unknown as SupabaseClient<Database>;

    const result = await resolveTaskDisplayLabels(supabase, ORG_ID, {
      memberIds: [MEMBER_A],
      leadIds: [],
      customerIds: [],
      programIds: [],
    });

    expect(resolveMemberLabel(MEMBER_A, result)).toBe("Team member");
  });
});
