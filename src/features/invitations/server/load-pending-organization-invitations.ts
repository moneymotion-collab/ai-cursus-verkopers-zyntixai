import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  isOrganizationInvitationCredentialValid,
  isOrganizationInvitationEffectivelyExpired,
} from "@/features/invitations/domain/expiry";
import { isOrganizationInvitationTargetRole } from "@/features/invitations/domain/permissions";
import type {
  MemberAdministrationPendingInvitationsResult,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";

/**
 * Exact safe columns for pending invitation operator reads.
 * token_hash must never be selected or returned.
 */
export const PENDING_INVITATION_SAFE_COLUMNS =
  "id, organization_id, email_normalized, role, status, invited_by_member_id, expires_at, created_at" as const;

const FALLBACK_INVITER_LABEL = "Team member";

type SafeInvitationRow = {
  id: string;
  organization_id: string;
  email_normalized: string;
  role: string;
  status: string;
  invited_by_member_id: string;
  expires_at: string;
  created_at: string;
};

/**
 * Narrow table access for organization_invitations.
 * Table is not present in database.generated.ts; do not regenerate types in Slice 1.
 * Cast is isolated here — callers only receive PendingInvitationListItem.
 */
function fromOrganizationInvitations(supabase: SupabaseClient<Database>) {
  return (
    supabase as unknown as {
      from: (relation: "organization_invitations") => {
        select: (columns: typeof PENDING_INVITATION_SAFE_COLUMNS) => {
          eq: (
            column: "organization_id" | "status",
            value: string,
          ) => {
            eq: (
              column: "organization_id" | "status",
              value: string,
            ) => {
              order: (
                column: "created_at",
                options: { ascending: boolean },
              ) => PromiseLike<{
                data: SafeInvitationRow[] | null;
                error: { message: string } | null;
              }>;
            };
          };
        };
      };
    }
  ).from("organization_invitations");
}

function normalizeLabel(
  value: string | null | undefined,
  fallback: string,
): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

/**
 * Server read loader: pending invitations for Member Administration.
 * Caller must already verify Owner/Admin active context (defense in depth).
 * Returns only credential-valid pending invitations as actionable pending.
 * Effectively expired pending rows are excluded from the actionable list (not mutated).
 */
export async function loadPendingOrganizationInvitations(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  options?: { now?: Date },
): Promise<MemberAdministrationPendingInvitationsResult> {
  const now = options?.now ?? new Date();

  const { data, error } = await fromOrganizationInvitations(supabase)
    .select(PENDING_INVITATION_SAFE_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return {
      ok: false,
      error: {
        code: "query_failed",
        message: "Unable to load pending invitations. Please try again.",
      },
    };
  }

  const rows = data ?? [];
  const inviterMemberIds = [
    ...new Set(rows.map((row) => row.invited_by_member_id).filter(Boolean)),
  ];

  const inviterLabelsByMemberId: Record<string, string> = {};

  if (inviterMemberIds.length > 0) {
    const { data: inviterMembers, error: inviterError } = await supabase
      .from("organization_members")
      .select("id, user_id")
      .eq("organization_id", organizationId)
      .in("id", inviterMemberIds);

    if (inviterError) {
      return {
        ok: false,
        error: {
          code: "query_failed",
          message: "Unable to load invitation inviters. Please try again.",
        },
      };
    }

    const memberRows = inviterMembers ?? [];
    const userIds = [...new Set(memberRows.map((row) => row.user_id))];
    const { data: profiles, error: profilesError } =
      userIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds)
        : { data: [], error: null };

    if (profilesError) {
      return {
        ok: false,
        error: {
          code: "query_failed",
          message: "Unable to load invitation inviters. Please try again.",
        },
      };
    }

    const profileNames = Object.fromEntries(
      (profiles ?? []).map((profile) => [profile.id, profile.display_name]),
    );

    for (const member of memberRows) {
      inviterLabelsByMemberId[member.id] = normalizeLabel(
        profileNames[member.user_id],
        FALLBACK_INVITER_LABEL,
      );
    }
  }

  const invitations: PendingInvitationListItem[] = [];

  for (const row of rows) {
    if (row.status !== "pending") {
      continue;
    }
    if (!isOrganizationInvitationTargetRole(row.role)) {
      continue;
    }

    const credentialInput = {
      status: "pending" as const,
      expiresAt: row.expires_at,
      now,
    };

    const isCredentialValid =
      isOrganizationInvitationCredentialValid(credentialInput);
    const isEffectivelyExpired =
      isOrganizationInvitationEffectivelyExpired(credentialInput);

    // Actionable pending only — exclude clock-expired pending bearers.
    if (!isCredentialValid || isEffectivelyExpired) {
      continue;
    }

    invitations.push({
      invitationId: row.id,
      emailNormalized: row.email_normalized,
      role: row.role,
      status: "pending",
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      invitedByMemberId: row.invited_by_member_id,
      inviterDisplayName: normalizeLabel(
        inviterLabelsByMemberId[row.invited_by_member_id],
        FALLBACK_INVITER_LABEL,
      ),
      isCredentialValid: true,
      isEffectivelyExpired: false,
    });
  }

  return { ok: true, invitations };
}
