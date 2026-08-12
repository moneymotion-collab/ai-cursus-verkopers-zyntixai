/**
 * Authenticated resend-invitation RPC adapter (Slice 3).
 * Server-only: session client; no service role.
 * raw_token from RPC is discarded during mapping and never returned.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  RESEND_ORGANIZATION_INVITATION_RPC,
  mapResendInvitationRpcRow,
  type ResendInvitationAdapterResult,
  type ResendInvitationRpcRow,
} from "@/features/invitations/server/resend-invitation-result";

type ResendInvitationRpcArgs = {
  p_organization_id: string;
  p_invitation_id: string;
};

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: ResendInvitationRpcArgs,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

export type ResendOrganizationInvitationParams = {
  organizationId: string;
  invitationId: string;
};

/**
 * Call public.resend_organization_invitation with the current session.
 * Cast is local: manage RPCs are intentionally absent from deferred generated types.
 */
export async function resendOrganizationInvitation(
  supabase: SupabaseClient<Database>,
  params: ResendOrganizationInvitationParams,
): Promise<ResendInvitationAdapterResult> {
  const client = supabase as unknown as RpcCapableClient;

  try {
    const { data, error } = await client.rpc(RESEND_ORGANIZATION_INVITATION_RPC, {
      p_organization_id: params.organizationId,
      p_invitation_id: params.invitationId,
    });

    if (error) {
      return { kind: "transport_error" };
    }

    const row = extractResendRpcRow(data);
    return mapResendInvitationRpcRow(row);
  } catch {
    return { kind: "transport_error" };
  }
}

function extractResendRpcRow(data: unknown): ResendInvitationRpcRow | null {
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
