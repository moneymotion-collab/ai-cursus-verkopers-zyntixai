import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const MEMBER_LABEL_UNASSIGNED = "Unassigned";
/** Known same-org membership whose profile display name is empty or not readable. */
export const MEMBER_LABEL_TEAM = "Team member";
/** Owner/member id not resolved within the organization membership set. */
export const MEMBER_LABEL_UNAVAILABLE = "Unavailable member";

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Resolve display labels for organization membership ids.
 *
 * Profiles are subject to `profiles_select_own` RLS, so co-member display names
 * are often unreadable to the current user. A found membership without a readable
 * non-empty display name must use {@link MEMBER_LABEL_TEAM}, not
 * {@link MEMBER_LABEL_UNAVAILABLE}, which is reserved for unresolved member ids.
 */
export async function resolveMemberLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  memberIds: Array<string | null | undefined>,
): Promise<Record<string, string>> {
  const ids = uniqueIds(memberIds);
  if (ids.length === 0) {
    return {};
  }

  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", organizationId)
    .in("id", ids);

  const memberRows = members ?? [];
  const userIds = uniqueIds(memberRows.map((row) => row.user_id));
  const profileNames: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      profileNames[profile.id] = normalizeLabel(profile.display_name, MEMBER_LABEL_TEAM);
    }
  }

  const labels: Record<string, string> = {};
  for (const member of memberRows) {
    labels[member.id] = profileNames[member.user_id] ?? MEMBER_LABEL_TEAM;
  }

  return labels;
}

export function resolveMemberLabel(
  memberId: string | null | undefined,
  labels: Record<string, string>,
): string {
  if (!memberId) {
    return MEMBER_LABEL_UNASSIGNED;
  }

  return labels[memberId] ?? MEMBER_LABEL_UNAVAILABLE;
}
