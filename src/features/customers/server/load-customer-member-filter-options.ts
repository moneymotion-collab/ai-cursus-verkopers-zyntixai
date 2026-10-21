import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const MAX_CUSTOMER_MEMBER_OPTIONS = 100;

export type CustomerMemberOption = {
  value: string;
  label: string;
};

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export async function loadCustomerMemberFilterOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<CustomerMemberOption[]> {
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(MAX_CUSTOMER_MEMBER_OPTIONS + 1);

  const memberRows = members ?? [];
  if (memberRows.length === 0) {
    return [];
  }

  const userIds = [...new Set(memberRows.map((row) => row.user_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  const profileNames = Object.fromEntries(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );

  return memberRows.slice(0, MAX_CUSTOMER_MEMBER_OPTIONS).map((member) => ({
    value: member.id,
    label: normalizeLabel(profileNames[member.user_id], "Team member"),
  }));
}
