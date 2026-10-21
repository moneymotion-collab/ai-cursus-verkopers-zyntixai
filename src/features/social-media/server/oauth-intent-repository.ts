/**
 * Session-client adapters for Social OAuth intent RPCs (SMM-B1.1-C).
 * No service-role client. Maps result_code only — never logs secrets.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { InstagramProfessionalAccountType } from "@/features/social-media/domain/account-type";
import type { SocialOAuthReturnPathId } from "@/features/social-media/domain/oauth-intent";
import type { ImplementedSocialProvider } from "@/features/social-media/domain/provider";

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

export type CreateSocialConnectionIntentSuccess = {
  ok: true;
  connectionId: string;
  intentId: string;
};

export type CreateSocialConnectionIntentFailure = {
  ok: false;
  reason:
    | "invalid_input"
    | "provider_unsupported"
    | "forbidden"
    | "workspace_not_found"
    | "rate_limited"
    | "transport_error"
    | "unexpected";
};

export async function createSocialConnectionIntent(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    workspaceId: string;
    provider: ImplementedSocialProvider;
    returnPathId: SocialOAuthReturnPathId;
    stateFingerprint: string;
    expiresAt: string;
  },
): Promise<CreateSocialConnectionIntentSuccess | CreateSocialConnectionIntentFailure> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc("create_social_connection_intent", {
      p_organization_id: input.organizationId,
      p_workspace_id: input.workspaceId,
      p_provider: input.provider,
      p_return_path_id: input.returnPathId,
      p_state_fingerprint: input.stateFingerprint,
      p_expires_at: input.expiresAt,
    });
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      const connectionId = asString(row?.connection_id);
      const intentId = asString(row?.intent_id);
      if (!connectionId || !intentId) {
        return { ok: false, reason: "unexpected" };
      }
      return { ok: true, connectionId, intentId };
    }
    if (
      resultCode === "invalid_input" ||
      resultCode === "provider_unsupported" ||
      resultCode === "forbidden" ||
      resultCode === "workspace_not_found" ||
      resultCode === "rate_limited"
    ) {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type CreateSocialReauthorizationIntentSuccess = {
  ok: true;
  connectionId: string;
  intentId: string;
  expectedExternalAccountId: string;
};

export type CreateSocialReauthorizationIntentFailure = {
  ok: false;
  reason:
    | "invalid_input"
    | "not_found"
    | "forbidden"
    | "conflict"
    | "rate_limited"
    | "transport_error"
    | "unexpected";
};

export async function createSocialReauthorizationIntent(
  supabase: SupabaseClient<Database>,
  input: {
    connectionId: string;
    returnPathId: SocialOAuthReturnPathId;
    stateFingerprint: string;
    expiresAt: string;
  },
): Promise<
  | CreateSocialReauthorizationIntentSuccess
  | CreateSocialReauthorizationIntentFailure
> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc(
      "create_social_reauthorization_intent",
      {
        p_connection_id: input.connectionId,
        p_return_path_id: input.returnPathId,
        p_state_fingerprint: input.stateFingerprint,
        p_expires_at: input.expiresAt,
      },
    );
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      const connectionId = asString(row?.connection_id);
      const intentId = asString(row?.intent_id);
      const expectedExternalAccountId = asString(
        row?.expected_external_account_id,
      );
      if (!connectionId || !intentId || !expectedExternalAccountId) {
        return { ok: false, reason: "unexpected" };
      }
      return {
        ok: true,
        connectionId,
        intentId,
        expectedExternalAccountId,
      };
    }
    if (
      resultCode === "invalid_input" ||
      resultCode === "not_found" ||
      resultCode === "forbidden" ||
      resultCode === "conflict" ||
      resultCode === "rate_limited"
    ) {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type ConsumeSocialOAuthIntentSuccess = {
  ok: true;
  connectionId: string;
  organizationId: string;
  workspaceId: string;
  provider: ImplementedSocialProvider;
  returnPathId: SocialOAuthReturnPathId;
  intentKind: "connect" | "reauthorize";
  expectedExternalAccountId: string | null;
};

export type ConsumeSocialOAuthIntentFailure = {
  ok: false;
  reason:
    | "invalid_state"
    | "wrong_actor"
    | "replayed_state"
    | "expired_state"
    | "rate_limited"
    | "transport_error"
    | "unexpected";
};

export async function consumeSocialOAuthIntent(
  supabase: SupabaseClient<Database>,
  input: {
    intentId: string;
    stateFingerprint: string;
  },
): Promise<ConsumeSocialOAuthIntentSuccess | ConsumeSocialOAuthIntentFailure> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc("consume_social_oauth_intent", {
      p_intent_id: input.intentId,
      p_state_fingerprint: input.stateFingerprint,
    });
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      const connectionId = asString(row?.connection_id);
      const organizationId = asString(row?.organization_id);
      const workspaceId = asString(row?.workspace_id);
      const provider = asString(row?.provider);
      const returnPathId = asString(row?.return_path_id);
      const intentKind = asString(row?.intent_kind);
      const expectedExternalAccountId = asString(
        row?.expected_external_account_id,
      );
      if (
        !connectionId ||
        !organizationId ||
        !workspaceId ||
        provider !== "instagram" ||
        returnPathId !== "social_workspace" ||
        (intentKind !== "connect" && intentKind !== "reauthorize")
      ) {
        return { ok: false, reason: "unexpected" };
      }
      return {
        ok: true,
        connectionId,
        organizationId,
        workspaceId,
        provider: "instagram",
        returnPathId: "social_workspace",
        intentKind,
        expectedExternalAccountId,
      };
    }
    if (
      resultCode === "invalid_state" ||
      resultCode === "wrong_actor" ||
      resultCode === "replayed_state" ||
      resultCode === "expired_state" ||
      resultCode === "rate_limited"
    ) {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type FinalizeSocialConnectionSuccess = {
  ok: true;
  connectionId: string;
};

export type FinalizeSocialConnectionFailure = {
  ok: false;
  reason:
    | "invalid_input"
    | "unsupported_account"
    | "not_found"
    | "forbidden"
    | "conflict"
    | "identity_mismatch"
    | "duplicate_connection"
    | "transport_error"
    | "unexpected";
};

export async function finalizeSocialConnection(
  supabase: SupabaseClient<Database>,
  input: {
    connectionId: string;
    externalAccountId: string;
    displayName: string | null;
    professionalAccountType: InstagramProfessionalAccountType;
    capabilities: readonly string[];
  },
): Promise<FinalizeSocialConnectionSuccess | FinalizeSocialConnectionFailure> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc("finalize_social_connection", {
      p_connection_id: input.connectionId,
      p_external_account_id: input.externalAccountId,
      p_display_name: input.displayName,
      p_professional_account_type: input.professionalAccountType,
      p_capabilities: input.capabilities,
    });
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      const connectionId = asString(row?.connection_id);
      if (!connectionId) {
        return { ok: false, reason: "unexpected" };
      }
      return { ok: true, connectionId };
    }
    if (
      resultCode === "invalid_input" ||
      resultCode === "unsupported_account" ||
      resultCode === "not_found" ||
      resultCode === "forbidden" ||
      resultCode === "conflict" ||
      resultCode === "identity_mismatch" ||
      resultCode === "duplicate_connection"
    ) {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export async function finalizeSocialReauthorization(
  supabase: SupabaseClient<Database>,
  input: {
    intentId: string;
    externalAccountId: string;
    displayName: string | null;
    professionalAccountType: InstagramProfessionalAccountType;
    capabilities: readonly string[];
  },
): Promise<FinalizeSocialConnectionSuccess | FinalizeSocialConnectionFailure> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc(
      "finalize_social_reauthorization",
      {
        p_intent_id: input.intentId,
        p_external_account_id: input.externalAccountId,
        p_display_name: input.displayName,
        p_professional_account_type: input.professionalAccountType,
        p_capabilities: input.capabilities,
      },
    );
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      const connectionId = asString(row?.connection_id);
      if (!connectionId) {
        return { ok: false, reason: "unexpected" };
      }
      return { ok: true, connectionId };
    }
    if (
      resultCode === "invalid_input" ||
      resultCode === "unsupported_account" ||
      resultCode === "not_found" ||
      resultCode === "forbidden" ||
      resultCode === "conflict" ||
      resultCode === "identity_mismatch" ||
      resultCode === "duplicate_connection"
    ) {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}
