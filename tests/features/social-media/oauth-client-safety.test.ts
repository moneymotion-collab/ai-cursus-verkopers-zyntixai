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

  it("keeps B1.1-B connection migration and documents B1.2 workspace foundation only as later social SQL", async () => {
    const migrationsDir = join(process.cwd(), "supabase/migrations");
    const { readdirSync } = await import("node:fs");
    const names = readdirSync(migrationsDir)
      .filter((name) => name.includes("social"))
      .sort();
    expect(names).toEqual([
      "20260815130220_add_social_connection_credential_foundation.sql",
      "20260815161759_add_social_workspace_foundation.sql",
      "20260815162306_add_social_workspace_foundation.sql",
      "20260815182703_add_social_brand_brain_campaign_foundation.sql",
      "20260815184059_add_social_master_content_variants_media_foundation.sql",
      "20260815185612_add_social_versioning_review_approval_calendar_foundation.sql",
      "20260815202145_add_social_publishing_infrastructure_foundation.sql",
      "20260815212000_add_social_private_media_bucket_r1.sql",
      "20260818190346_add_social_closed_beta_enrollment_foundation.sql",
      "20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql",
    ]);
    expect(names.some((name) => name.includes("oauth") && name.includes("instagram"))).toBe(
      false,
    );
  });
});
