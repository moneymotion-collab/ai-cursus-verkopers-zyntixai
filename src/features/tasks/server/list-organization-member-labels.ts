import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { MEMBER_DISPLAY_FALLBACK_LABEL } from "@/features/tasks/domain/member-display-label";

export const LIST_ORGANIZATION_MEMBER_LABELS_RPC =
  "list_organization_member_labels" as const;

export type OrganizationMemberLabel = {
  membershipId: string;
  label: string;
};

type ListOrganizationMemberLabelsArgs = {
  p_organization_id: string;
  p_membership_ids?: string[] | null;
};

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: ListOrganizationMemberLabelsArgs,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function mapLabelRows(data: unknown): OrganizationMemberLabel[] {
  const rows = Array.isArray(data) ? data : [];
  const labels: OrganizationMemberLabel[] = [];

  for (const row of rows) {
    const record = asRecord(row);
    const membershipId =
      typeof record?.membership_id === "string" ? record.membership_id : "";
    const label =
      typeof record?.display_label === "string"
        ? record.display_label.trim()
        : "";
    if (!membershipId) {
      continue;
    }
    labels.push({
      membershipId,
      label: label.length > 0 ? label : MEMBER_DISPLAY_FALLBACK_LABEL,
    });
  }

  return labels;
}

/**
 * Org-scoped member labels via SECURITY DEFINER RPC.
 * Returns only membership id + display label. No emails or auth user ids.
 */
export async function listOrganizationMemberLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  membershipIds?: readonly string[],
): Promise<OrganizationMemberLabel[]> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc(LIST_ORGANIZATION_MEMBER_LABELS_RPC, {
      p_organization_id: organizationId,
      p_membership_ids:
        membershipIds && membershipIds.length > 0 ? [...membershipIds] : null,
    });

    if (error) {
      return [];
    }

    return mapLabelRows(data);
  } catch {
    return [];
  }
}

export function memberLabelMap(
  labels: readonly OrganizationMemberLabel[],
): Record<string, string> {
  return Object.fromEntries(
    labels.map((entry) => [entry.membershipId, entry.label]),
  );
}
