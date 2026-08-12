import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  isKnownOrganizationRole,
  type OrganizationRole,
} from "@/features/tasks/domain/permissions";
import type {
  MemberAdminMember,
  MemberAdministrationMembersResult,
} from "@/features/invitations/domain/member-administration-read-types";

const FALLBACK_DISPLAY_NAME = "Team member";

const ROLE_SORT_ORDER: Record<OrganizationRole, number> = {
  owner: 0,
  admin: 1,
  staff: 2,
  viewer: 3,
};

function normalizeDisplayName(
  value: string | null | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function compareMembers(a: MemberAdminMember, b: MemberAdminMember): number {
  const roleDelta = ROLE_SORT_ORDER[a.role] - ROLE_SORT_ORDER[b.role];
  if (roleDelta !== 0) {
    return roleDelta;
  }

  const nameDelta = a.displayName.localeCompare(b.displayName, "en", {
    sensitivity: "base",
  });
  if (nameDelta !== 0) {
    return nameDelta;
  }

  return a.membershipId.localeCompare(b.membershipId);
}

/**
 * Server read loader: active organization members for Member Administration.
 * Organization id must come from verified server context — never trust client org ids alone.
 */
export async function loadActiveOrganizationMembers(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<MemberAdministrationMembersResult> {
  const { data: members, error: membersError } = await supabase
    .from("organization_members")
    .select("id, user_id, role, status, joined_at")
    .eq("organization_id", organizationId)
    .eq("status", "active");

  if (membersError) {
    return {
      ok: false,
      error: {
        code: "query_failed",
        message: "Unable to load active members. Please try again.",
      },
    };
  }

  const memberRows = members ?? [];
  if (memberRows.length === 0) {
    return { ok: true, members: [] };
  }

  const userIds = [...new Set(memberRows.map((row) => row.user_id))];
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", userIds);

  if (profilesError) {
    return {
      ok: false,
      error: {
        code: "query_failed",
        message: "Unable to load member profiles. Please try again.",
      },
    };
  }

  const profileNames = Object.fromEntries(
    (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
  );

  const mapped: MemberAdminMember[] = [];
  for (const row of memberRows) {
    if (!isKnownOrganizationRole(row.role)) {
      continue;
    }

    mapped.push({
      membershipId: row.id,
      displayName: normalizeDisplayName(
        profileNames[row.user_id],
        FALLBACK_DISPLAY_NAME,
      ),
      role: row.role,
      status: "active",
      joinedAt: row.joined_at,
    });
  }

  mapped.sort(compareMembers);
  return { ok: true, members: mapped };
}
