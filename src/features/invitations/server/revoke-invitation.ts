/**
 * Authenticated revoke-invitation RPC adapter (Slice 3).
 * Server-only: session client; no service role; no direct SQL mutation.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  REVOKE_ORGANIZATION_INVITATION_RPC,
  mapRevokeInvitationRpcRow,
  type RevokeInvitationAdapterResult,
  type RevokeInvitationRpcRow,
} from "@/features/invitations/server/revoke-invitation-result";

type RevokeInvitationRpcArgs = {
  p_organization_id: string;
  p_invitation_id: string;
};

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: RevokeInvitationRpcArgs,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

export type RevokeOrganizationInvitationParams = {
  organizationId: string;
  invitationId: string;
};

/**
 * Call public.revoke_organization_invitation with the current session.
 */
export async function revokeOrganizationInvitation(
  supabase: SupabaseClient<Database>,
  params: RevokeOrganizationInvitationParams,
): Promise<RevokeInvitationAdapterResult> {
  const client = supabase as unknown as RpcCapableClient;

  try {
    const { data, error } = await client.rpc(REVOKE_ORGANIZATION_INVITATION_RPC, {
      p_organization_id: params.organizationId,
      p_invitation_id: params.invitationId,
    });

    if (error) {
      return { kind: "transport_error" };
    }

    const row = extractRevokeRpcRow(data);
    return mapRevokeInvitationRpcRow(row);
  } catch {
    return { kind: "transport_error" };
  }
}

function extractRevokeRpcRow(data: unknown): RevokeInvitationRpcRow | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const record = candidate as Record<string, unknown>;
  if (typeof record.result_code !== "string") {
    return null;
  }

  return {
    result_code: record.result_code,
    invitation_id:
      typeof record.invitation_id === "string" ? record.invitation_id : null,
    expires_at:
      typeof record.expires_at === "string" ? record.expires_at : null,
    raw_token: typeof record.raw_token === "string" ? record.raw_token : null,
  };
}
