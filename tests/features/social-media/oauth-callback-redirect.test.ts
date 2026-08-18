import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildDefaultSocialOAuthFailurePath,
  buildSocialOAuthContinuationPath,
  isSocialOAuthOutcomeCode,
  SOCIAL_OAUTH_OUTCOME_CODES,
} from "@/features/social-media/server/oauth-callback-redirect";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";

describe("SMM-B1.1-C OAuth continuation redirects", () => {
  it("uses controlled outcome codes only", () => {
    expect(SOCIAL_OAUTH_OUTCOME_CODES).toContain("connected");
    expect(SOCIAL_OAUTH_OUTCOME_CODES).toContain("authorization_denied");
    expect(isSocialOAuthOutcomeCode("connected")).toBe(true);
    expect(isSocialOAuthOutcomeCode("access_token")).toBe(false);
  });

  it("builds allowlisted token-free continuation paths", () => {
    const path = buildSocialOAuthContinuationPath(
      "social_workspace",
      "connected",
    );
    expect(path).toBe("/social/r1-instagram-connect?social_oauth=connected");
    expect(resolveSafeReturnPath(path)).toBe(path);
    expect(path).not.toContain("code=");
    expect(path).not.toContain("state=");
    expect(path).not.toContain("token");
  });

  it("attaches only allowlisted opaque failure stages", () => {
    const path = buildSocialOAuthContinuationPath(
      "social_workspace",
      "connection_failed",
      "authorization_code_exchange",
    );
    expect(path).toContain("social_oauth=connection_failed");
    expect(path).toContain(
      "social_oauth_stage=authorization_code_exchange",
    );
    expect(path).not.toContain("access_token");
    expect(path).not.toContain("client_secret");
    expect(resolveSafeReturnPath(path)).toBe(path);
  });

  it("does not create open redirects from outcome helpers", () => {
    const failure = buildDefaultSocialOAuthFailurePath("authorization_invalid");
    expect(failure.startsWith("/")).toBe(true);
    expect(failure).not.toContain("://");
    expect(resolveSafeReturnPath("//evil.example")).toBe("/");
  });

  it("keeps server OAuth modules marked server-only and free of NEXT_PUBLIC secrets", () => {
    const root = process.cwd();
    const files = [
      "src/features/social-media/server/instagram-oauth-config.ts",
      "src/features/social-media/server/instagram-provider-client.ts",
      "src/features/social-media/server/handle-instagram-oauth-callback.ts",
      "src/features/social-media/server/initiate-instagram-connection.ts",
      "src/features/social-media/server/oauth-state.ts",
      "src/app/api/social/instagram/callback/route.ts",
    ];
    for (const relative of files) {
      const source = readFileSync(join(root, relative), "utf8");
      if (!relative.includes("callback/route.ts")) {
        expect(source).toContain('import "server-only"');
      }
      expect(source).not.toContain("NEXT_PUBLIC_SOCIAL_INSTAGRAM_CLIENT_SECRET");
      expect(source).not.toMatch(/console\.(log|info|debug)\(/);
    }
  });

  it("does not re-export crypto or provider client from the domain barrel", () => {
    const barrel = readFileSync(
      join(process.cwd(), "src/features/social-media/domain/index.ts"),
      "utf8",
    );
    expect(barrel).not.toContain("credential-crypto");
    expect(barrel).not.toContain("instagram-provider-client");
    expect(barrel).not.toContain("oauth-state.ts");
    expect(barrel).not.toContain("handle-instagram-oauth-callback");
  });
});
