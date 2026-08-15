import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const SECRETISH = [
  /IGQV[A-Za-z0-9]+/,
  /EAA[A-Za-z0-9]{20,}/,
  /client_secret\s*[:=]\s*["'][^"']+["']/,
  /SOCIAL_CREDENTIAL_ENCRYPTION_KEY\s*=\s*["'][A-Za-z0-9+/=]{20,}["']/,
];

describe("SMM-B1.1-C client-safe and secret scan", () => {
  it("keeps OAuth callback and initiation free of hardcoded provider secrets", () => {
    const root = process.cwd();
    const files = [
      "src/features/social-media/server/instagram-oauth-config.ts",
      "src/features/social-media/server/instagram-provider-client.ts",
      "src/features/social-media/server/handle-instagram-oauth-callback.ts",
      "src/features/social-media/server/initiate-instagram-connection.ts",
      "src/features/social-media/actions/initiate-instagram-connection-action.ts",
      "src/app/api/social/instagram/callback/route.ts",
    ];
    for (const relative of files) {
      const absolute = join(root, relative);
      expect(existsSync(absolute)).toBe(true);
      const source = readFileSync(absolute, "utf8");
      for (const pattern of SECRETISH) {
        expect(source).not.toMatch(pattern);
      }
    }
  });

  it("ensures SocialConnectResult success path exposes only authorizationUrl", () => {
    const results = readFileSync(
      join(process.cwd(), "src/features/social-media/domain/results.ts"),
      "utf8",
    );
    expect(results).toContain("authorizationUrl");
    expect(results).not.toContain("accessToken");
    expect(results).not.toContain("refreshToken");
    expect(results).not.toContain("authorizationCode");
    expect(results).not.toContain("clientSecret");
  });

  it("documents no database migration for B1.1-C by absence of new SMM migration after B", async () => {
    const migrationsDir = join(process.cwd(), "supabase/migrations");
    const { readdirSync } = await import("node:fs");
    const names = readdirSync(migrationsDir).filter((name) =>
      name.includes("social"),
    );
    expect(names).toEqual([
      "20260815130220_add_social_connection_credential_foundation.sql",
    ]);
  });
});
