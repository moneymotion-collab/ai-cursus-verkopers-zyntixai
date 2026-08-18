import { describe, expect, it, vi } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { handleInstagramOAuthCallback } from "@/features/social-media/server/handle-instagram-oauth-callback";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const orgId = "11111111-1111-4111-8111-111111111111";
const workspaceId = "22222222-2222-4222-8222-222222222222";
const connectionId = "55555555-5555-4555-8555-555555555555";
const intentId = "66666666-6666-4666-8666-666666666666";
const userId = "44444444-4444-4444-8444-444444444444";
const externalAccountId = "17841400000000000";

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
  upsertCode?: string;
  finalizeCode?: string;
}) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: userId } },
        error: null,
      })),
    },
    rpc: vi.fn(async (fn: string) => {
      if (fn === "consume_social_oauth_intent") {
        return {
          data: [
            {
              result_code: options.consumeCode ?? "success",
              connection_id: connectionId,
              organization_id: orgId,
              workspace_id: workspaceId,
              provider: "instagram",
              return_path_id: "social_workspace",
              intent_kind: "connect",
              expected_external_account_id: null,
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
              credential_id: "77777777-7777-4777-8777-777777777777",
              credential_version: 1,
            },
          ],
          error: null,
        };
      }
      if (fn === "finalize_social_connection") {
        return {
          data: [
            {
              result_code: options.finalizeCode ?? "success",
              connection_id: connectionId,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: "unexpected" } };
    }),
  } as unknown as SupabaseClient<Database>;
}

function mockProviderFetch(): typeof fetch {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("api.instagram.com/oauth/access_token")) {
      return new Response(
        JSON.stringify({
          data: [
            {
              access_token: "short-lived-token",
              user_id: externalAccountId,
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
          id: externalAccountId,
          user_id: externalAccountId,
          username: "zyntix_demo",
          account_type: "BUSINESS",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }
    return new Response("not found", { status: 404 });
  }) as unknown as typeof fetch;
}

describe("SMM-B1.1-C Instagram OAuth callback orchestration", () => {
  it("completes a valid mocked callback path to connected", async () => {
    const rawState = "ab".repeat(32);
    const supabase = createSupabaseMock({});
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: rawState },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch() },
    );
    expect(result.outcome).toBe("connected");
    expect(result.redirectPath).toContain("social_oauth=connected");
    expect(result.redirectPath).not.toContain("auth-code");
    expect(result.redirectPath).not.toContain(rawState);
    expect(result.redirectPath).not.toContain("long-lived-token");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "consume_social_oauth_intent",
      expect.objectContaining({
        p_intent_id: intentId,
        p_state_fingerprint: fingerprint(rawState),
      }),
    );
    expect(supabase.rpc).toHaveBeenCalledWith(
      "upsert_social_provider_credential",
      expect.objectContaining({
        p_connection_id: connectionId,
        p_expected_credential_version: 0,
        p_key_purpose: "zyntixai.smm.credential.aes-v1",
      }),
    );
    const upsertArgs = (supabase.rpc as ReturnType<typeof vi.fn>).mock.calls.find(
      (call) => call[0] === "upsert_social_provider_credential",
    )?.[1] as Record<string, string>;
    expect(upsertArgs.p_ciphertext).toBeTruthy();
    expect(upsertArgs.p_ciphertext).not.toContain("long-lived-token");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "finalize_social_connection",
      expect.objectContaining({
        p_connection_id: connectionId,
        p_capabilities: expect.arrayContaining([
          "publish_image",
          "publish_carousel",
          "publish_story",
          "publish_short",
          "publish_video",
        ]),
      }),
    );
  });

  it("handles provider denial, missing code/state, and missing cookie", async () => {
    const supabase = createSupabaseMock({});
    const denied = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { error: "access_denied", error_reason: "user_denied" },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv },
    );
    expect(denied.outcome).toBe("authorization_denied");

    const missingState = await handleInstagramOAuthCallback(
      supabase,
      { query: { code: "x" }, intentIdFromCookie: intentId },
      { env: enabledEnv },
    );
    expect(missingState.outcome).toBe("authorization_invalid");

    const missingCookie = await handleInstagramOAuthCallback(
      supabase,
      { query: { code: "x", state: "ab".repeat(32) }, intentIdFromCookie: null },
      { env: enabledEnv },
    );
    expect(missingCookie.outcome).toBe("authorization_invalid");
  });

  it("maps expired, replayed, and wrong-actor consume failures", async () => {
    for (const [consumeCode, outcome] of [
      ["expired_state", "authorization_expired"],
      ["replayed_state", "authorization_replayed"],
      ["wrong_actor", "wrong_actor"],
      ["rate_limited", "rate_limited"],
    ] as const) {
      const supabase = createSupabaseMock({ consumeCode });
      const result = await handleInstagramOAuthCallback(
        supabase,
        {
          query: { code: "auth-code", state: "cd".repeat(32) },
          intentIdFromCookie: intentId,
        },
        { env: enabledEnv },
      );
      expect(result.outcome).toBe(outcome);
    }
  });

  it("fail-closes when encryption key is missing before provider exchange", async () => {
    const supabase = createSupabaseMock({});
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "ef".repeat(32) },
        intentIdFromCookie: intentId,
      },
      {
        env: {
          ...enabledEnv,
          SOCIAL_CREDENTIAL_ENCRYPTION_KEY: undefined,
        },
        fetchImpl: mockProviderFetch(),
      },
    );
    expect(result.outcome).toBe("configuration_error");
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "consume_social_oauth_intent",
      expect.anything(),
    );
  });

  it("rejects unsupported professional account types from provider identity", async () => {
    const supabase = createSupabaseMock({});
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.instagram.com/oauth/access_token")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                access_token: "short-lived-token",
                user_id: externalAccountId,
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
            expires_in: 1000,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          user_id: externalAccountId,
          username: "personal",
          account_type: "PERSONAL",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "11".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl },
    );
    expect(result.outcome).toBe("unsupported_account");
  });

  it("maps duplicate connection finalize failures", async () => {
    const supabase = createSupabaseMock({ finalizeCode: "duplicate_connection" });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "22".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch() },
    );
    expect(result.outcome).toBe("duplicate_connection");
  });

  it("denies when feature gate is OFF", async () => {
    const supabase = createSupabaseMock({});
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "33".repeat(32) },
        intentIdFromCookie: intentId,
      },
      {
        env: { ...enabledEnv, SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED: "false" },
      },
    );
    expect(result.outcome).toBe("feature_disabled");
  });

  it("attaches opaque stage authorization_code_exchange on short-lived failures", async () => {
    const supabase = createSupabaseMock({});
    const fetchImpl = vi.fn(async () =>
      new Response(JSON.stringify({ error_type: "OAuthException" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "44".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("authorization_code_exchange");
    expect(result.redirectPath).toContain(
      "social_oauth_stage=authorization_code_exchange",
    );
    expect(result.redirectPath).not.toContain("auth-code");
    expect(result.redirectPath).not.toContain("OAuthException");
  });

  it("attaches opaque stage long_lived_token_exchange on long-lived failures", async () => {
    const supabase = createSupabaseMock({});
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.instagram.com/oauth/access_token")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                access_token: "short-lived-token",
                user_id: externalAccountId,
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "55".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("long_lived_token_exchange");
    expect(result.redirectPath).toContain(
      "social_oauth_stage=long_lived_token_exchange",
    );
    expect(result.redirectPath).not.toContain("short-lived-token");
  });

  it("attaches opaque stage professional_identity_fetch on identity failures", async () => {
    const supabase = createSupabaseMock({});
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.instagram.com/oauth/access_token")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                access_token: "short-lived-token",
                user_id: externalAccountId,
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
            expires_in: 1000,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ username: "x" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as unknown as typeof fetch;
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "66".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("professional_identity_fetch");
    expect(result.redirectPath).toContain(
      "social_oauth_stage=professional_identity_fetch",
    );
    expect(result.redirectPath).not.toContain("long-lived-token");
  });

  it("attaches opaque stage credential_encrypt_or_upsert on credential upsert failures", async () => {
    const supabase = createSupabaseMock({ upsertCode: "forbidden" });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "77".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch() },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("credential_encrypt_or_upsert");
    expect(result.redirectPath).toContain(
      "social_oauth_stage=credential_encrypt_or_upsert",
    );
  });

  it("attaches opaque stage connection_finalize on finalize failures", async () => {
    const supabase = createSupabaseMock({ finalizeCode: "unexpected" });
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "88".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl: mockProviderFetch() },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("connection_finalize");
    expect(result.redirectPath).toContain(
      "social_oauth_stage=connection_finalize",
    );
  });

  it("accepts distinct app-scoped token user_id and professional IG user_id", async () => {
    const appScopedId = "10200000000000099";
    const professionalId = "17841400000000999";
    const supabase = createSupabaseMock({});
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.instagram.com/oauth/access_token")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                access_token: "short-lived-token",
                user_id: appScopedId,
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
            id: appScopedId,
            user_id: professionalId,
            username: "zyntix_demo",
            account_type: "Media_Creator",
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response("not found", { status: 404 });
    }) as unknown as typeof fetch;

    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "aa".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl },
    );
    expect(result.outcome).toBe("connected");
    expect(result.redirectPath).not.toContain("social_oauth_stage=");
    expect(supabase.rpc).toHaveBeenCalledWith(
      "finalize_social_connection",
      expect.objectContaining({
        p_connection_id: connectionId,
        p_external_account_id: professionalId,
      }),
    );
  });

  it("still fail-closes when app-scoped ids disagree", async () => {
    const supabase = createSupabaseMock({});
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("api.instagram.com/oauth/access_token")) {
        return new Response(
          JSON.stringify({
            data: [
              {
                access_token: "short-lived-token",
                user_id: "10200000000000001",
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
            expires_in: 1000,
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({
          id: "10200000000000002",
          user_id: "17841400000000000",
          username: "zyntix_demo",
          account_type: "BUSINESS",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "bb".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl },
    );
    expect(result.outcome).toBe("connection_failed");
    expect(result.failureStage).toBe("professional_identity_fetch");
  });

  it("marks provider_unavailable with the same opaque stage on non_2xx", async () => {
    const supabase = createSupabaseMock({});
    const fetchImpl = vi.fn(async () =>
      new Response("denied", { status: 400 }),
    ) as unknown as typeof fetch;
    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: { code: "auth-code", state: "99".repeat(32) },
        intentIdFromCookie: intentId,
      },
      { env: enabledEnv, fetchImpl },
    );
    expect(result.outcome).toBe("provider_unavailable");
    expect(result.failureStage).toBe("authorization_code_exchange");
    expect(result.redirectPath).toContain(
      "social_oauth_stage=authorization_code_exchange",
    );
  });
});
