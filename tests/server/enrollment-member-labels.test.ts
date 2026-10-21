import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  MEMBER_LABEL_TEAM,
  MEMBER_LABEL_UNASSIGNED,
  MEMBER_LABEL_UNAVAILABLE,
  resolveMemberLabel,
  resolveMemberLabels,
} from "@/features/enrollments/server/resolve-enrollment-labels";
import { ORG_ID } from "../helpers/enrollment-test-fixtures";

const MEMBER_WITH_NAME = "11111111-1111-4111-8111-111111111111";
const MEMBER_EMPTY_NAME = "22222222-2222-4222-8222-222222222222";
const MEMBER_NO_PROFILE = "33333333-3333-4333-8333-333333333333";
const MEMBER_MISSING = "44444444-4444-4444-8444-444444444444";
const USER_WITH_NAME = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const USER_EMPTY_NAME = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const USER_NO_PROFILE = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

type QueryResult = { data?: unknown; error?: unknown };

function createChainableQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  for (const method of ["eq", "in"]) {
    builder[method] = vi.fn(() => builder);
  }
  const promise = Promise.resolve(result);
  builder.then = promise.then.bind(promise);
  builder.catch = promise.catch.bind(promise);
  builder.finally = promise.finally.bind(promise);
  return builder;
}

function createMockSupabase(options: {
  members?: QueryResult;
  profiles?: QueryResult;
}) {
  const builders = {
    members: createChainableQuery(options.members ?? { data: [], error: null }),
    profiles: createChainableQuery(options.profiles ?? { data: [], error: null }),
  };

  const from = vi.fn((table: string) => {
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

describe("resolveMemberLabels / resolveMemberLabel — B1-STAB.1", () => {
  it("returns the display name for a valid same-org owner with a readable profile name", async () => {
    const { supabase, builders } = createMockSupabase({
      members: {
        data: [{ id: MEMBER_WITH_NAME, user_id: USER_WITH_NAME }],
        error: null,
      },
      profiles: {
        data: [{ id: USER_WITH_NAME, display_name: "QA Staff" }],
        error: null,
      },
    });

    const labels = await resolveMemberLabels(supabase, ORG_ID, [MEMBER_WITH_NAME]);

    expect(builders.members.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(builders.members.in).toHaveBeenCalledWith("id", [MEMBER_WITH_NAME]);
    expect(labels[MEMBER_WITH_NAME]).toBe("QA Staff");
    expect(resolveMemberLabel(MEMBER_WITH_NAME, labels)).toBe("QA Staff");
  });

  it("uses Team member when the membership exists but display_name is empty", async () => {
    const { supabase } = createMockSupabase({
      members: {
        data: [{ id: MEMBER_EMPTY_NAME, user_id: USER_EMPTY_NAME }],
        error: null,
      },
      profiles: {
        data: [{ id: USER_EMPTY_NAME, display_name: "   " }],
        error: null,
      },
    });

    const labels = await resolveMemberLabels(supabase, ORG_ID, [MEMBER_EMPTY_NAME]);

    expect(labels[MEMBER_EMPTY_NAME]).toBe(MEMBER_LABEL_TEAM);
    expect(resolveMemberLabel(MEMBER_EMPTY_NAME, labels)).toBe(MEMBER_LABEL_TEAM);
  });

  it("models profiles_select_own RLS: membership found, profile rows omitted → Team member (not Unavailable member)", async () => {
    const { supabase } = createMockSupabase({
      members: {
        data: [{ id: MEMBER_NO_PROFILE, user_id: USER_NO_PROFILE }],
        error: null,
      },
      // Authenticated callers can only select their own profile; co-member profiles
      // return empty under profiles_select_own — the B1.5 production shape.
      profiles: { data: [], error: null },
    });

    const labels = await resolveMemberLabels(supabase, ORG_ID, [MEMBER_NO_PROFILE]);

    expect(labels[MEMBER_NO_PROFILE]).toBe(MEMBER_LABEL_TEAM);
    expect(resolveMemberLabel(MEMBER_NO_PROFILE, labels)).toBe(MEMBER_LABEL_TEAM);
    expect(resolveMemberLabel(MEMBER_NO_PROFILE, labels)).not.toBe(MEMBER_LABEL_UNAVAILABLE);
  });

  it("keeps Unavailable member only when the membership id is not resolved in-org", async () => {
    const { supabase, builders } = createMockSupabase({
      members: { data: [], error: null },
      profiles: { data: [], error: null },
    });

    const labels = await resolveMemberLabels(supabase, ORG_ID, [MEMBER_MISSING]);

    expect(builders.members.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(labels[MEMBER_MISSING]).toBeUndefined();
    expect(resolveMemberLabel(MEMBER_MISSING, labels)).toBe(MEMBER_LABEL_UNAVAILABLE);
  });

  it("scopes membership lookup to the provided organization and does not leak foreign labels", async () => {
    const foreignMemberId = "55555555-5555-4555-8555-555555555555";
    const { supabase, builders } = createMockSupabase({
      members: {
        data: [{ id: MEMBER_WITH_NAME, user_id: USER_WITH_NAME }],
        error: null,
      },
      profiles: {
        data: [{ id: USER_WITH_NAME, display_name: "Org A Owner" }],
        error: null,
      },
    });

    const labels = await resolveMemberLabels(supabase, ORG_ID, [
      MEMBER_WITH_NAME,
      foreignMemberId,
    ]);

    expect(builders.members.eq).toHaveBeenCalledWith("organization_id", ORG_ID);
    expect(labels[MEMBER_WITH_NAME]).toBe("Org A Owner");
    expect(labels[foreignMemberId]).toBeUndefined();
    expect(resolveMemberLabel(foreignMemberId, labels)).toBe(MEMBER_LABEL_UNAVAILABLE);
  });

  it("returns Unassigned for a null owner without claiming Unavailable member", () => {
    expect(resolveMemberLabel(null, {})).toBe(MEMBER_LABEL_UNASSIGNED);
    expect(resolveMemberLabel(undefined, {})).toBe(MEMBER_LABEL_UNASSIGNED);
  });

  it("never returns raw membership UUIDs as labels", async () => {
    const { supabase } = createMockSupabase({
      members: {
        data: [
          { id: MEMBER_WITH_NAME, user_id: USER_WITH_NAME },
          { id: MEMBER_NO_PROFILE, user_id: USER_NO_PROFILE },
        ],
        error: null,
      },
      profiles: {
        data: [{ id: USER_WITH_NAME, display_name: "Jordan Lee" }],
        error: null,
      },
    });

    const labels = await resolveMemberLabels(supabase, ORG_ID, [
      MEMBER_WITH_NAME,
      MEMBER_NO_PROFILE,
      MEMBER_MISSING,
    ]);

    const rendered = [
      resolveMemberLabel(MEMBER_WITH_NAME, labels),
      resolveMemberLabel(MEMBER_NO_PROFILE, labels),
      resolveMemberLabel(MEMBER_MISSING, labels),
      resolveMemberLabel(null, labels),
    ];

    expect(rendered).toEqual([
      "Jordan Lee",
      MEMBER_LABEL_TEAM,
      MEMBER_LABEL_UNAVAILABLE,
      MEMBER_LABEL_UNASSIGNED,
    ]);
    expect(rendered.some((value) => /[0-9a-f-]{36}/i.test(value))).toBe(false);
  });
});
