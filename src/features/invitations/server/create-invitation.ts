/**
 * Authenticated create-invitation RPC adapter (Slice 2).
 * Server-only: normal user session client; no service role; no generated types.
 * raw_token from RPC is discarded during mapping and never returned.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  CREATE_ORGANIZATION_INVITATION_RPC,
  mapCreateInvitationRpcRow,
  type CreateInvitationAdapterResult,
  type CreateInvitationRpcRow,
} from "@/features/invitations/server/create-invitation-result";

type CreateInvitationRpcArgs = {
  p_organization_id: string;
  p_email: string;
  p_target_role: string;
};

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: CreateInvitationRpcArgs,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

export type CreateOrganizationInvitationParams = {
  organizationId: string;
  email: string;
  targetRole: string;
};

/**
 * Call public.create_organization_invitation with the current session.
 * Cast is local: create RPC is intentionally absent from deferred generated types.
 */
export async function createOrganizationInvitation(
  supabase: SupabaseClient<Database>,
  params: CreateOrganizationInvitationParams,
): Promise<CreateInvitationAdapterResult> {
  const client = supabase as unknown as RpcCapableClient;

  try {
    const { data, error } = await client.rpc(CREATE_ORGANIZATION_INVITATION_RPC, {
      p_organization_id: params.organizationId,
      p_email: params.email,
      p_target_role: params.targetRole,
    });

    if (error) {
      return { kind: "transport_error" };
    }

    const row = extractCreateRpcRow(data);
    return mapCreateInvitationRpcRow(row);
  } catch {
    return { kind: "transport_error" };
  }
}

function extractCreateRpcRow(data: unknown): CreateInvitationRpcRow | null {
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
