import { describe, expect, it, vi } from "vitest";
import {
  ATTENTION_ASSIGNEE_FALLBACK_LABEL,
  ensureCurrentAttentionAssigneeOption,
  loadAttentionAssigneeOptions,
} from "@/features/attention/server/load-attention-assignee-options";
import {
  MEMBER_ID,
  ORG_ID,
  USER_ID,
} from "../helpers/attention-test-fixtures";

const MEMBER_B = "66666666-6666-4666-8666-666666666666";
const USER_B = "77777777-7777-4777-8777-777777777777";
const OTHER_ORG = "99999999-9999-4999-8999-999999999999";

function createSupabase(handlers: {
  members?: { data: Array<{ id: string; user_id: string }> | null; error: unknown };
  profiles?: {
    data: Array<{ id: string; display_name: string | null }> | null;
    error?: unknown;
  };
}) {
  const from = vi.fn((table: string) => {
    if (table === "organization_members") {
      const chain: Record<string, unknown> = {};
      const self = () => chain;
      chain.select = vi.fn(self);
      chain.eq = vi.fn(self);
      chain.order = vi.fn(self);
      chain.limit = vi.fn(async () => handlers.members ?? { data: [], error: null });
      return chain;
    }

    if (table === "profiles") {
      const chain: Record<string, unknown> = {};
      const self = () => chain;
      chain.select = vi.fn(self);
      chain.in = vi.fn(async () => handlers.profiles ?? { data: [], error: null });
      return chain;
    }

    throw new Error(`unexpected table ${table}`);
  });

  return { from } as never;
}

describe("loadAttentionAssigneeOptions (B1.7.6-C)", () => {
  it("loads only active same-org members with safe display labels and stable sort", async () => {
    const supabase = createSupabase({
      members: {
        data: [
          { id: MEMBER_B, user_id: USER_B },
          { id: MEMBER_ID, user_id: USER_ID },
        ],
        error: null,
      },
      profiles: {
        data: [
          { id: USER_B, display_name: "Sam Staff" },
          { id: USER_ID, display_name: "Alex Owner" },
        ],
      },
    });

    const result = await loadAttentionAssigneeOptions(supabase, ORG_ID);

    expect(result.failed).toBe(false);
    expect(result.members).toEqual([
      { value: MEMBER_ID, label: "Alex Owner" },
      { value: MEMBER_B, label: "Sam Staff" },
    ]);

    const membersFrom = (supabase as { from: ReturnType<typeof vi.fn> }).from;
    expect(membersFrom).toHaveBeenCalledWith("organization_members");
    const membersChain = membersFrom.mock.results[0]?.value as {
      eq: ReturnType<typeof vi.fn>;
    };
    expect(membersChain.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(membersChain.eq).toHaveBeenCalledWith("status", "active");
    expect(membersChain.eq).not.toHaveBeenCalledWith("organization_id", OTHER_ORG);
  });

  it("returns empty without failure and uses fallback labels", async () => {
    const empty = await loadAttentionAssigneeOptions(
      createSupabase({ members: { data: [], error: null } }),
      ORG_ID,
    );
    expect(empty).toEqual({ members: [], capped: false, failed: false });

    const unlabeled = await loadAttentionAssigneeOptions(
      createSupabase({
        members: {
          data: [{ id: MEMBER_ID, user_id: USER_ID }],
          error: null,
        },
        profiles: { data: [{ id: USER_ID, display_name: "   " }] },
      }),
      ORG_ID,
    );
    expect(unlabeled.members).toEqual([
      { value: MEMBER_ID, label: ATTENTION_ASSIGNEE_FALLBACK_LABEL },
    ]);
  });

  it("marks failed loads without leaking members", async () => {
    const result = await loadAttentionAssigneeOptions(
      createSupabase({
        members: { data: null, error: { message: "rls boom" } },
      }),
      ORG_ID,
    );
    expect(result).toEqual({ members: [], capped: false, failed: true });
  });

  it("ensures current assignee remains visible without importing other inactive members", () => {
    const ensured = ensureCurrentAttentionAssigneeOption(
      [{ value: MEMBER_B, label: "Sam Staff" }],
      MEMBER_ID,
      "Alex Owner",
    );
    expect(ensured[0]).toEqual({ value: MEMBER_ID, label: "Alex Owner" });
    expect(ensured).toHaveLength(2);

    const alreadyPresent = ensureCurrentAttentionAssigneeOption(
      [{ value: MEMBER_ID, label: "Alex Owner" }],
      MEMBER_ID,
      "Ignored",
    );
    expect(alreadyPresent).toEqual([{ value: MEMBER_ID, label: "Alex Owner" }]);

    const unassigned = ensureCurrentAttentionAssigneeOption(
      [{ value: MEMBER_B, label: "Sam Staff" }],
      null,
      null,
    );
    expect(unassigned).toEqual([{ value: MEMBER_B, label: "Sam Staff" }]);
  });
});
