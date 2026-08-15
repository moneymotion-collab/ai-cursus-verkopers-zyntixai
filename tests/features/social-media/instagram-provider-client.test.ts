import { describe, expect, it, vi } from "vitest";
import {
  exchangeInstagramAuthorizationCode,
  exchangeInstagramLongLivedToken,
  fetchInstagramProfessionalIdentity,
  normalizeInstagramAuthorizationCode,
} from "@/features/social-media/server/instagram-provider-client";
import type { InstagramOAuthConfig } from "@/features/social-media/server/instagram-oauth-config";

const config: InstagramOAuthConfig = {
  clientId: "client-id",
  clientSecret: "client-secret-value",
  redirectUri: "https://zyntix.example/api/social/instagram/callback",
  scopes: ["instagram_business_basic"],
  authorizeEndpoint: "https://www.instagram.com/oauth/authorize",
  tokenEndpoint: "https://api.instagram.com/oauth/access_token",
  graphBaseUrl: "https://graph.instagram.com",
  graphApiVersion: "v22.0",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("SMM-B1.1-C Instagram provider adapter", () => {
  it("strips Meta #_ suffix from authorization codes", () => {
    expect(normalizeInstagramAuthorizationCode("abc#_")).toBe("abc");
    expect(normalizeInstagramAuthorizationCode("")).toBeNull();
  });

  it("exchanges authorization code for a short-lived token", async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse({
        data: [
          {
            access_token: "short-token",
            user_id: "17841400000000000",
            permissions: "instagram_business_basic",
          },
        ],
      }),
    );
    const result = await exchangeInstagramAuthorizationCode(
      config,
      "auth-code",
      { fetchImpl },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.value.accessToken).toBe("short-token");
    expect(result.value.userId).toBe("17841400000000000");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [, requestInit] = fetchImpl.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(requestInit.method).toBe("POST");
    expect(String(requestInit.body)).toContain("grant_type=authorization_code");
    expect(String(requestInit.body)).toContain(
      "client_secret=client-secret-value",
    );
  });

  it("rejects empty tokens and non-2xx responses without leaking secrets in reason", async () => {
    const empty = await exchangeInstagramAuthorizationCode(config, "code", {
      fetchImpl: async () =>
        jsonResponse({
          data: [{ access_token: "", user_id: "1" }],
        }),
    });
    expect(empty).toEqual({ ok: false, reason: "empty_token" });
    expect(JSON.stringify(empty)).not.toContain("client-secret");

    const non2xx = await exchangeInstagramAuthorizationCode(config, "code", {
      fetchImpl: async () =>
        jsonResponse({ error_message: "Matching code was not found" }, 400),
    });
    expect(non2xx).toEqual({ ok: false, reason: "non_2xx" });
  });

  it("exchanges long-lived tokens and reads professional identity", async () => {
    const longLived = await exchangeInstagramLongLivedToken(
      config,
      "short-token",
      {
        fetchImpl: async () =>
          jsonResponse({
            access_token: "long-token",
            token_type: "bearer",
            expires_in: 5184000,
          }),
      },
    );
    expect(longLived.ok).toBe(true);
    if (!longLived.ok) {
      return;
    }
    expect(longLived.value.accessToken).toBe("long-token");

    const identity = await fetchInstagramProfessionalIdentity(
      config,
      "long-token",
      {
        fetchImpl: async () =>
          jsonResponse({
            user_id: "17841400000000000",
            username: "zyntix_demo",
            account_type: "BUSINESS",
          }),
      },
    );
    expect(identity.ok).toBe(true);
    if (!identity.ok) {
      return;
    }
    expect(identity.value.accountType).toBe("business");
    expect(identity.value.externalAccountId).toBe("17841400000000000");
  });

  it("rejects personal / unsupported account types", async () => {
    const identity = await fetchInstagramProfessionalIdentity(
      config,
      "long-token",
      {
        fetchImpl: async () =>
          jsonResponse({
            user_id: "1",
            username: "personal_user",
            account_type: "PERSONAL",
          }),
      },
    );
    expect(identity).toEqual({ ok: false, reason: "unsupported_account" });
  });

  it("maps invalid JSON and timeout failures safely", async () => {
    const invalidJson = await exchangeInstagramAuthorizationCode(
      config,
      "code",
      {
        fetchImpl: async () =>
          new Response("not-json", {
            status: 200,
            headers: { "content-type": "application/json" },
          }),
      },
    );
    expect(invalidJson).toEqual({ ok: false, reason: "invalid_json" });

    const timeout = await exchangeInstagramLongLivedToken(config, "token", {
      timeoutMs: 5,
      fetchImpl: async (_url, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const error = new Error("aborted");
            error.name = "AbortError";
            reject(error);
          });
        }),
    });
    expect(timeout).toEqual({ ok: false, reason: "timeout" });
  });
});
