import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  LIST_ORGANIZATION_MEMBER_LABELS_RPC,
  listOrganizationMemberLabels,
} from "@/features/tasks/server/list-organization-member-labels";

const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const MEMBER_NAMED = "11111111-1111-4111-8111-111111111111";
const MEMBER_META = "22222222-2222-4222-8222-222222222222";
const MEMBER_OTHER = "33333333-3333-4333-8333-333333333333";
const MEMBER_INACTIVE = "44444444-4444-4444-8444-444444444444";

function createRpcClient(result: { data: unknown; error: { message?: string } | null }) {
  return {
    rpc: vi.fn().mockResolvedValue(result),
  } as unknown as SupabaseClient<Database>;
}

describe("listOrganizationMemberLabels", () => {
  it("maps RPC rows to membership values and distinguishable labels", async () => {
    const supabase = createRpcClient({
      data: [
        { membership_id: MEMBER_NAMED, display_label: "Jan Jansen" },
        { membership_id: MEMBER_META, display_label: "Lisa de Vries" },
      ],
      error: null,
    });

    const labels = await listOrganizationMemberLabels(supabase, ORG_A, [
      MEMBER_NAMED,
      MEMBER_META,
    ]);

    expect(labels).toEqual([
      { membershipId: MEMBER_NAMED, label: "Jan Jansen" },
      { membershipId: MEMBER_META, label: "Lisa de Vries" },
    ]);
    expect(new Set(labels.map((row) => row.membershipId)).size).toBe(2);
    expect(labels.map((row) => row.label)).not.toContain("Team member");
  });

  it("keeps membership id as the assignment identity", async () => {
    const supabase = createRpcClient({
      data: [{ membership_id: MEMBER_NAMED, display_label: "Jan Jansen" }],
      error: null,
    });

    const [option] = await listOrganizationMemberLabels(supabase, ORG_A, [
      MEMBER_NAMED,
    ]);
    expect(option?.membershipId).toBe(MEMBER_NAMED);
  });

  it("returns no labels for a foreign org when the RPC fail-closes", async () => {
    const supabase = createRpcClient({ data: [], error: null });

    const labels = await listOrganizationMemberLabels(supabase, ORG_B, [
      MEMBER_OTHER,
    ]);

    expect(labels).toEqual([]);
    expect(supabase.rpc).toHaveBeenCalledWith(LIST_ORGANIZATION_MEMBER_LABELS_RPC, {
      p_organization_id: ORG_B,
      p_membership_ids: [MEMBER_OTHER],
    });
  });

  it("can still label a requested inactive same-org member without listing them as a default option", async () => {
    const supabase = createRpcClient({
      data: [{ membership_id: MEMBER_INACTIVE, display_label: "Former Member" }],
      error: null,
    });

    const labels = await listOrganizationMemberLabels(supabase, ORG_A, [
      MEMBER_INACTIVE,
    ]);
    expect(labels).toEqual([
      { membershipId: MEMBER_INACTIVE, label: "Former Member" },
    ]);
  });
});
