/**
 * Owner/Admin Instagram disconnect (SMM-B1.1-R A0).
 * Calls existing disconnect_social_connection RPC. Never calls Meta.
 * Never returns tokens, ciphertext, or encryption material.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import type { SocialDisconnectResult } from "@/features/social-media/domain/results";
import { validateSocialDisconnectRequest } from "@/features/social-media/validation/mutation-schemas";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";
import { listSocialAccountConnections } from "@/features/social-media/server/list-social-connections";

export type DisconnectSocialConnectionInput = {
  organizationId: string;
  connectionId: string;
};

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

function firstRow(data: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  return candidate as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function disconnectSocialConnection(
  supabase: SupabaseClient<Database>,
  input: DisconnectSocialConnectionInput,
  options?: {
    env?: Record<string, string | undefined>;
  },
): Promise<SocialDisconnectResult> {
  const env = options?.env ?? process.env;
  if (!isSocialInstagramConnectionsFeatureEnabled(env)) {
    return { ok: false, code: "feature_disabled" };
  }

  const parsed = validateSocialDisconnectRequest({
    connectionId: input.connectionId,
  });
  if (!parsed.success) {
    return { ok: false, code: "not_found" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, code: "unauthorized" };
  }

  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId: input.organizationId,
  });
  if (!orgContext.ok) {
    if (orgContext.error.code === "AUTH_REQUIRED") {
      return { ok: false, code: "unauthorized" };
    }
    return { ok: false, code: "forbidden" };
  }

  if (!canManageSocialConnections(orgContext.context.role, "active")) {
    return { ok: false, code: "forbidden" };
  }

  const listed = await listSocialAccountConnections(
    supabase,
    orgContext.context.organizationId,
  );
  if (!listed.ok) {
    return { ok: false, code: "internal_error" };
  }

  const belonging = listed.connections.find(
    (connection) => connection.id === parsed.data.connectionId,
  );
  if (!belonging) {
    return { ok: false, code: "not_found" };
  }
  if (belonging.status === "disconnected") {
    return { ok: true, code: "already_disconnected" };
  }

  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc("disconnect_social_connection", {
      p_connection_id: parsed.data.connectionId,
    });
    if (error) {
      return { ok: false, code: "internal_error" };
    }
    const resultCode = asString(firstRow(data)?.result_code);
    if (resultCode === "disconnected") {
      return { ok: true, code: "disconnected" };
    }
    if (resultCode === "already_disconnected") {
      return { ok: true, code: "already_disconnected" };
    }
    if (resultCode === "not_found") {
      return { ok: false, code: "not_found" };
    }
    if (resultCode === "forbidden") {
      return { ok: false, code: "forbidden" };
    }
    if (resultCode === "rate_limited") {
      return { ok: false, code: "rate_limited" };
    }
    if (resultCode === "invalid_input") {
      return { ok: false, code: "not_found" };
    }
    return { ok: false, code: "internal_error" };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}
