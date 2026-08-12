/**
 * Narrow invitation lookup for manage (resend/revoke) authorization.
 * Selects only safe columns — never invitation credential secrets.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { OrganizationInvitationTargetRole } from "@/features/invitations/domain/types";
import { isOrganizationInvitationTargetRole } from "@/features/invitations/domain/permissions";

const MANAGE_INVITATION_SAFE_COLUMNS =
  "id, role, status, expires_at" as const;

type ManageInvitationRow = {
  id: string;
  role: string;
  status: string;
  expires_at: string;
};

export type ManageableInvitationRecord = {
  invitationId: string;
  role: OrganizationInvitationTargetRole;
  status: string;
  expiresAt: string;
};

export type LoadInvitationForManageResult =
  | { ok: true; invitation: ManageableInvitationRecord }
  | { ok: false; kind: "not_found" | "query_failed" };

type InvitationSelectClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        eq: (
          column: string,
          value: string,
        ) => {
          maybeSingle: () => PromiseLike<{
            data: ManageInvitationRow | null;
            error: { message?: string } | null;
          }>;
        };
      };
    };
  };
};

/**
 * Resolve invitation belonging to the authoritative organization.
 * Foreign-tenant / missing ids fail closed as not_found.
 */
export async function loadInvitationForManage(
  supabase: SupabaseClient<Database>,
  params: { organizationId: string; invitationId: string },
): Promise<LoadInvitationForManageResult> {
  const client = supabase as unknown as InvitationSelectClient;

  try {
    const { data, error } = await client
      .from("organization_invitations")
      .select(MANAGE_INVITATION_SAFE_COLUMNS)
      .eq("organization_id", params.organizationId)
      .eq("id", params.invitationId)
      .maybeSingle();

    if (error) {
      return { ok: false, kind: "query_failed" };
    }

    if (!data || typeof data !== "object") {
      return { ok: false, kind: "not_found" };
    }

    if (
      typeof data.id !== "string" ||
      typeof data.role !== "string" ||
      typeof data.status !== "string" ||
      typeof data.expires_at !== "string" ||
      !isOrganizationInvitationTargetRole(data.role)
    ) {
      return { ok: false, kind: "not_found" };
    }

    return {
      ok: true,
      invitation: {
        invitationId: data.id,
        role: data.role,
        status: data.status,
        expiresAt: data.expires_at,
      },
    };
  } catch {
    return { ok: false, kind: "query_failed" };
  }
}
