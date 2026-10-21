/**
 * Authenticated Acceptance RPC adapter (Slice C).
 * Server-only: normal user session client only; no privileged admin client;
 * no generated-type dependency.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  ACCEPT_ORGANIZATION_INVITATION_RPC,
  mapAcceptInvitationRpcRow,
  type AcceptInvitationAdapterResult,
  type AcceptInvitationRpcRow,
} from "@/features/invitations/server/accept-invitation-result";

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: { p_raw_token: string },
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

/**
 * Call public.accept_organization_invitation with the current session.
 * Cast is local: Acceptance RPC is intentionally absent from deferred generated types.
 */
export async function acceptOrganizationInvitation(
  supabase: SupabaseClient<Database>,
  rawToken: string,
): Promise<AcceptInvitationAdapterResult> {
  const client = supabase as unknown as RpcCapableClient;

  try {
    const { data, error } = await client.rpc(ACCEPT_ORGANIZATION_INVITATION_RPC, {
      p_raw_token: rawToken,
    });

    if (error) {
      return { kind: "transport_error" };
    }

    const row = extractAcceptRpcRow(data);
    return mapAcceptInvitationRpcRow(row);
  } catch {
    return { kind: "transport_error" };
  }
}

function extractAcceptRpcRow(data: unknown): AcceptInvitationRpcRow | null {
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
    organization_id:
      typeof record.organization_id === "string" ? record.organization_id : null,
    membership_id:
      typeof record.membership_id === "string" ? record.membership_id : null,
  };
}
