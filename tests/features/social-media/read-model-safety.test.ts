import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { SocialConnectionClientReadModel } from "@/features/social-media/domain/connection";
import type { SocialConnectResult } from "@/features/social-media/domain/results";
import type { ImplementedSocialProvider } from "@/features/social-media/domain/provider";

type AssertTrue<T extends true> = T;

type ClientReadModelForbiddenOverlap = Extract<
  keyof SocialConnectionClientReadModel,
  | "accessToken"
  | "refreshToken"
  | "authorizationCode"
  | "clientSecret"
  | "ciphertext"
  | "oauthStateHash"
>;

type _NoSecretKeysOnReadModel = AssertTrue<
  [ClientReadModelForbiddenOverlap] extends [never] ? true : false
>;

type UnsupportedProvider = "facebook" | "tiktok";
type ImplementedFromUnsupported = Extract<
  UnsupportedProvider,
  ImplementedSocialProvider
>;

type _UnsupportedProvidersAreNotImplemented = AssertTrue<
  [ImplementedFromUnsupported] extends [never] ? true : false
>;

describe("type-level secret and provider boundaries", () => {
  it("keeps compile-time secret overlap empty", () => {
    const proof: _NoSecretKeysOnReadModel = true;
    const providerProof: _UnsupportedProvidersAreNotImplemented = true;
    expect(proof).toBe(true);
    expect(providerProof).toBe(true);
  });

  it("keeps connect results free of token fields", () => {
    const result: SocialConnectResult = {
      ok: false,
      code: "provider_unsupported",
    };
    expect("accessToken" in result).toBe(false);
    expect("refreshToken" in result).toBe(false);
  });

  it("keeps OAuth callback route free of secret material and client-secret env leakage", () => {
    const root = process.cwd();
    const callbackPath = join(
      root,
      "src/app/api/social/instagram/callback/route.ts",
    );
    expect(existsSync(callbackPath)).toBe(true);
    const source = readFileSync(callbackPath, "utf8");
    expect(source).not.toContain("SOCIAL_INSTAGRAM_CLIENT_SECRET");
    expect(source).not.toContain("SOCIAL_CREDENTIAL_ENCRYPTION_KEY");
    expect(source).not.toContain("access_token");
    expect(source).not.toContain("console.log");
    expect(source).toContain("no-store");
  });

  it("keeps domain contracts free of crypto and provider HTTP", () => {
    const root = process.cwd();
    const domainDir = join(root, "src/features/social-media");
    const scanned = [
      "domain/connection.ts",
      "domain/credentials.ts",
      "domain/oauth-intent.ts",
      "server/credential-secrets.ts",
    ].map((relative) =>
      readFileSync(join(domainDir, relative), "utf8"),
    );
    for (const source of scanned) {
      expect(source).not.toContain("createCipheriv");
      expect(source).not.toContain("fetch(");
    }
  });
});
