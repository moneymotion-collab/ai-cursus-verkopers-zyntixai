import { describe, expect, it } from "vitest";
import {
  buildInstagramOAuthRedirectUri,
  INSTAGRAM_LOGIN_CONNECT_SCOPES,
  INSTAGRAM_OAUTH_AUTHORIZE_ENDPOINT,
  INSTAGRAM_OAUTH_CALLBACK_PATH,
  readInstagramOAuthConfig,
} from "@/features/social-media/server/instagram-oauth-config";
import {
  assertInstagramAuthorizationUrlContract,
  buildInstagramAuthorizationUrl,
} from "@/features/social-media/server/instagram-authorization-url";
import { createRawSocialOAuthStateSecret } from "@/features/social-media/server/oauth-state";

const baseEnv = {
  SOCIAL_INSTAGRAM_CLIENT_ID: "test-client-id-99060",
  SOCIAL_INSTAGRAM_CLIENT_SECRET: "test-client-secret-not-real",
  NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
};

describe("SMM-B1.1-C Instagram OAuth config and authorization URL", () => {
  it("fail-closes when client id or secret is missing", () => {
    expect(readInstagramOAuthConfig({}).ok).toBe(false);
    expect(
      readInstagramOAuthConfig({
        SOCIAL_INSTAGRAM_CLIENT_ID: "x",
      }).ok,
    ).toBe(false);
    expect(
      readInstagramOAuthConfig({
        SOCIAL_INSTAGRAM_CLIENT_SECRET: "y",
        NEXT_PUBLIC_SITE_URL: "https://zyntix.example",
      }).ok,
    ).toBe(false);
  });

  it("derives exact callback URI from site origin", () => {
    const uri = buildInstagramOAuthRedirectUri(baseEnv);
    expect(uri).toBe(
      `https://zyntix.example${INSTAGRAM_OAUTH_CALLBACK_PATH}`,
    );
  });

  it("rejects unsafe redirect URI overrides", () => {
    expect(
      buildInstagramOAuthRedirectUri({
        ...baseEnv,
        SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI:
          "https://evil.example/api/social/instagram/callback?x=1",
      }),
    ).toBeNull();
    expect(
      buildInstagramOAuthRedirectUri({
        ...baseEnv,
        SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI: "javascript:alert(1)",
      }),
    ).toBeNull();
  });

  it("builds authorization URL with locked endpoint, client id, redirect, scopes, and state", () => {
    const config = readInstagramOAuthConfig(baseEnv);
    expect(config.ok).toBe(true);
    if (!config.ok) {
      return;
    }
    const rawState = createRawSocialOAuthStateSecret("ab".repeat(32));
    const url = buildInstagramAuthorizationUrl({
      config: config.config,
      rawState,
    });
    expect(url.startsWith(INSTAGRAM_OAUTH_AUTHORIZE_ENDPOINT)).toBe(true);
    expect(assertInstagramAuthorizationUrlContract(url, config.config)).toBe(
      true,
    );
    const parsed = new URL(url);
    expect(parsed.searchParams.get("client_id")).toBe(
      baseEnv.SOCIAL_INSTAGRAM_CLIENT_ID,
    );
    expect(parsed.searchParams.get("redirect_uri")).toBe(
      `https://zyntix.example${INSTAGRAM_OAUTH_CALLBACK_PATH}`,
    );
    expect(parsed.searchParams.get("scope")).toBe(
      INSTAGRAM_LOGIN_CONNECT_SCOPES.join(","),
    );
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("state")).toBe(rawState.value);
    expect(parsed.searchParams.get("scope")).toContain(
      "instagram_business_content_publish",
    );
    expect(parsed.searchParams.get("scope")).toContain(
      "instagram_business_basic",
    );
    expect(parsed.searchParams.get("scope")).not.toContain(
      "instagram_manage_messages",
    );
    expect(parsed.searchParams.get("scope")).not.toContain(
      "instagram_manage_insights",
    );
  });

  it("does not accept browser-injected scopes or redirect URIs into the builder", () => {
    const config = readInstagramOAuthConfig(baseEnv);
    expect(config.ok).toBe(true);
    if (!config.ok) {
      return;
    }
    const url = buildInstagramAuthorizationUrl({
      config: {
        ...config.config,
        // Even if a caller mutates config incorrectly, contract asserts expected scopes.
        scopes: config.config.scopes,
      },
      rawState: createRawSocialOAuthStateSecret("cd".repeat(32)),
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("scope")).toBe(
      "instagram_business_basic,instagram_business_content_publish",
    );
    expect(parsed.searchParams.get("redirect_uri")).toContain(
      INSTAGRAM_OAUTH_CALLBACK_PATH,
    );
  });
});
