import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Same-org active membership options for Attention assignment.
 * Mirrors proven Tasks/Enrollments member-option reads:
 * organization_members filtered by organization_id + status=active,
 * labels from profiles.display_name with Team member fallback.
 */
export const MAX_ATTENTION_ASSIGNEE_OPTIONS = 100;
export const ATTENTION_ASSIGNEE_FALLBACK_LABEL = "Team member" as const;

export type AttentionAssigneeOption = {
  value: string;
  label: string;
};

export type AttentionAssigneeOptionsResult = {
  members: AttentionAssigneeOption[];
  capped: boolean;
  failed: boolean;
};

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

/**
 * Ensure the current assignee remains selectable for display even when no longer
 * active-eligible. Does not add other inactive/cross-tenant members.
 */
export function ensureCurrentAttentionAssigneeOption(
  options: AttentionAssigneeOption[],
  currentAssigneeMemberId: string | null | undefined,
  currentAssigneeLabel: string | null | undefined,
): AttentionAssigneeOption[] {
  if (!currentAssigneeMemberId) {
    return options;
  }
  if (options.some((option) => option.value === currentAssigneeMemberId)) {
    return options;
  }
  return [
    {
      value: currentAssigneeMemberId,
      label: normalizeLabel(currentAssigneeLabel, ATTENTION_ASSIGNEE_FALLBACK_LABEL),
    },
    ...options,
  ];
}

export async function loadAttentionAssigneeOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<AttentionAssigneeOptionsResult> {
  const { data: members, error } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(MAX_ATTENTION_ASSIGNEE_OPTIONS + 1);

  if (error) {
    return { members: [], capped: false, failed: true };
  }

  const memberRows = members ?? [];
  if (memberRows.length === 0) {
    return { members: [], capped: false, failed: false };
  }

  const slice = memberRows.slice(0, MAX_ATTENTION_ASSIGNEE_OPTIONS);
  const userIds = uniqueIds(slice.map((row) => row.user_id));
  const profileNames: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      profileNames[profile.id] = normalizeLabel(
        profile.display_name,
        ATTENTION_ASSIGNEE_FALLBACK_LABEL,
      );
    }
  }

  const options = slice
    .map((row) => ({
      value: row.id,
      label: profileNames[row.user_id] ?? ATTENTION_ASSIGNEE_FALLBACK_LABEL,
    }))
    .sort((left, right) => {
      const byLabel = left.label.localeCompare(right.label, undefined, {
        sensitivity: "base",
      });
      if (byLabel !== 0) {
        return byLabel;
      }
      return left.value.localeCompare(right.value);
    });

  return {
    members: options,
    capped: memberRows.length > MAX_ATTENTION_ASSIGNEE_OPTIONS,
    failed: false,
  };
}
