import { describe, expect, it, vi } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { handleInstagramOAuthCallback } from "@/features/social-media/server/handle-instagram-oauth-callback";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const orgId = "11111111-1111-4111-8111-111111111111";
const workspaceId = "22222222-2222-4222-8222-222222222222";
const connectionId = "55555555-5555-4555-8555-555555555555";
const otherConnectionId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const intentId = "66666666-6666-4666-8666-666666666666";
const otherIntentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const userId = "44444444-4444-4444-8444-444444444444";
const identityA = "17841400000000000";
const identityB = "17841499999999999";
const existingCredentialId = "88888888-8888-4888-8888-888888888888";

const encryptionKey = randomBytes(32).toString("base64");

const enabledEnv = {
  SOCIAL_CONNECTIONS_ENABLED: "true",
  SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED: "true",
  SOCIAL_INSTAGRAM_CLIENT_ID: "ig-client-id",
  SOCIAL_INSTAGRAM_CLIENT_SECRET: "ig-client-secret",
  SOCIAL_CREDENTIAL_ENCRYPTION_KEY: encryptionKey,
  NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
};

function fingerprint(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

function createSupabaseMock(options: {
  consumeCode?: string;
  consumeConnectionId?: string;
  consumeIntentKind?: string;
  expectedExternalAccountId?: string | null;
  loadCode?: string;
  loadedCredentialId?: string;
  loadedVersion?: number;
  upsertCode?: string;
  upsertVersion?: number;
  finalizeReauthCode?: string;
  finalizeConnectCode?: string;
}) {
  const rpc = vi.fn(async (fn: string, args?: Record<string, unknown>) => {
    if (fn === "consume_social_oauth_intent") {
      return {
        data: [
          {
            result_code: options.consumeCode ?? "success",
            connection_id: options.consumeConnectionId ?? connectionId,
            organization_id: orgId,
            workspace_id: workspaceId,
            provider: "instagram",
            return_path_id: "social_workspace",
            intent_kind: options.consumeIntentKind ?? "reauthorize",
            expected_external_account_id:
              options.expectedExternalAccountId ?? identityA,
          },
        ],
        error: null,
      };
    }
    if (fn === "load_social_provider_credential_envelope") {
      return {
        data: [
          {
            result_code: options.loadCode ?? "success",
            credential_id: options.loadedCredentialId ?? existingCredentialId,
            organization_id: orgId,
            connection_id: args?.p_connection_id ?? connectionId,
            provider: "instagram",
            encryption_version: 1,
            key_purpose: "zyntixai.smm.credential.aes-v1",
            key_version: 1,
            ciphertext: "ZW52ZWxvcGUtY2lwaGVydGV4dA==",
            iv: "AAAAAAAAAAAAAAAA",
            auth_tag: "BBBBBBBBBBBBBBBBBBBBBB==",
            credential_version: options.loadedVersion ?? 1,
          },
        ],
        error: null,
      };
    }
    if (fn === "upsert_social_provider_credential") {
      return {
        data: [
          {
            result_code: options.upsertCode ?? "success",
            credential_id: existingCredentialId,
            credential_version:
              options.upsertVersion ?? (options.loadedVersion ?? 1) + 1,
          },
        ],
        error: null,
      };
    }
    if (fn === "finalize_social_reauthorization") {
      return {
        data: [
          {
            result_code: options.finalizeReauthCode ?? "success",
            connection_id: connectionId,
          },
        ],
        error: null,
      };
    }
    if (fn === "finalize_social_connection") {
      return {
        data: [
          {
            result_code: options.finalizeConnectCode ?? "conflict",
            connection_id: connectionId,
          },
        ],
        error: null,
      };
    }
    return { data: null, error: { message: "unexpected" } };
  });

  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: userId } },
        error: null,
      })),
    },
    rpc,
  } as unknown as SupabaseClient<Database>;
}

function mockProviderFetch(returnedIdentity = identityA): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("api.instagram.com/oauth/access_token")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              access_token: "short-lived-token",
              user_id: returnedIdentity,
              permissions:
                "instagram_business_basic,instagram_business_content_publish",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("grant_type=ig_exchange_token")) {
      return new Response(
        JSON.stringify({
          access_token: "long-lived-token",
          token_type: "bearer",
          expires_in: 5184000,
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    if (url.includes("/me")) {
      return new Response(
        JSON.stringify({
          id: returnedIdentity,
          user_id: returnedIdentity,
          username: "zyntix_demo",
          account_type: "BUSINESS",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

function upsertArgs(supabase: SupabaseClient<Database>) {
  return (supabase.rpc as ReturnType<typeof vi.fn>).mock.calls.find(
    (call) => call[0] === "upsert_social_provider_credential",
  )?.[1] as Record<string, unknown> | undefined;
}

describe("SMM-B1.1-R A2-FIX Instagram reauthorization callback", () => {
  it("refreshes an existing credential v1 on a connected reauthorize", async () => {
    const rawState = "ab".repeat(32);
    const supabase = createSupabaseMock({ loadedVersion: 1, upsertVersion: 2 });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: rawState },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch(identityA) },
    );

    expect(result.outcome).toBe("connected");
    expect(result.redirectPath).toContain("social_oauth=connected");
    expect(result.redirectPath).not.toContain("long-lived-token");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "load_social_provider_credential_envelope",
      expect.objectContaining({ p_connection_id: connectionId }),
    );
    expect(upsertArgs(supabase)).toEqual(
      expect.objectContaining({
        p_connection_id: connectionId,
        p_credential_id: existingCredentialId,
        p_expected_credential_version: 1,
      }),
    );
    expect(String(upsertArgs(supabase)?.p_ciphertext)).not.toContain(
      "long-lived-token",
    );
    expect(supabase.rpc).toHaveBeenCalledWith(
      "finalize_social_reauthorization",
      expect.objectContaining({
        p_intent_id: intentId,
        p_external_account_id: identityA,
      }),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "finalize_social_connection",
      expect.anything(),
    );
  });

  it("uses the loaded credential version rather than assuming 0 or 1", async () => {
    const supabase = createSupabaseMock({ loadedVersion: 7, upsertVersion: 8 });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "cd".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch(identityA) },
    );
    expect(result.outcome).toBe("connected");
    expect(upsertArgs(supabase)?.p_expected_credential_version).toBe(7);
    expect(upsertArgs(supabase)?.p_credential_id).toBe(existingCredentialId);
  });

  it("fail-closes a stale credential version without finalizing", async () => {
    const supabase = createSupabaseMock({
      loadedVersion: 1,
      upsertCode: "stale_version",
    });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "ef".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch(identityA) },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("credential_encrypt_or_upsert");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "upsert_social_provider_credential",
      expect.objectContaining({ p_expected_credential_version: 1 }),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "finalize_social_reauthorization",
      expect.anything(),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "finalize_social_connection",
      expect.anything(),
    );
  });

  it("does not load or mutate credentials when Meta returns a different identity", async () => {
    const supabase = createSupabaseMock({
      expectedExternalAccountId: identityA,
    });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "aa".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch(identityB) },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("professional_identity_fetch");
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "load_social_provider_credential_envelope",
      expect.anything(),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "upsert_social_provider_credential",
      expect.anything(),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "finalize_social_reauthorization",
      expect.anything(),
    );
  });

  it("does not use ordinary connect finalize for reauthorization", async () => {
    const supabase = createSupabaseMock({});
    await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "11".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch(identityA) },
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "finalize_social_connection",
      expect.anything(),
    );
    const finalizeArgs = (supabase.rpc as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === "finalize_social_reauthorization",
    )?.[1] as Record<string, unknown>;
    expect(finalizeArgs.p_intent_id).toBe(intentId);
    expect(finalizeArgs.p_intent_id).not.toBe(otherIntentId);
    expect(finalizeArgs).not.toHaveProperty("p_connection_id");
  });

  it("denies replayed reauthorization consume before credential work", async () => {
    const supabase = createSupabaseMock({ consumeCode: "replayed_state" });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "22".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch(identityA) },
    );
    expect(result.outcome).toBe("authorization_replayed");
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "load_social_provider_credential_envelope",
      expect.anything(),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "upsert_social_provider_credential",
      expect.anything(),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "finalize_social_reauthorization",
      expect.anything(),
    );
  });

  it("keeps first-time connect on version 0 without loading an envelope", async () => {
    const supabase = createSupabaseMock({
      consumeIntentKind: "connect",
      expectedExternalAccountId: null,
      finalizeConnectCode: "success",
    });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: fingerprint("connect-state").slice(0, 64) },
        intentIdFromCookie: intentId,
      },
      {
        env: enabledEnv,
        fetchImpl: mockProviderFetch(identityA),
      },
    );
    expect(result.outcome).toBe("connected");
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "load_social_provider_credential_envelope",
      expect.anything(),
    );
    expect(upsertArgs(supabase)?.p_expected_credential_version).toBe(0);
    expect(supabase.rpc).toHaveBeenCalledWith(
      "finalize_social_connection",
      expect.objectContaining({ p_connection_id: connectionId }),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "finalize_social_reauthorization",
      expect.anything(),
    );
  });

  it("does not retarget a foreign connection UUID from the client", async () => {
    const supabase = createSupabaseMock({
      consumeConnectionId: connectionId,
    });
    await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "33".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch(identityA) },
    );
    expect(supabase.rpc).toHaveBeenCalledWith(
      "load_social_provider_credential_envelope",
      expect.objectContaining({ p_connection_id: connectionId }),
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "load_social_provider_credential_envelope",
      expect.objectContaining({ p_connection_id: otherConnectionId }),
    );
  });
});
