import { describe, expect, it } from "vitest";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";
import {
  isSocialOAuthIntentConsumable,
  isSocialOAuthIntentExpired,
  isSocialOAuthReturnPathId,
  mapSocialOAuthReturnPathId,
  type SocialOAuthIntent,
} from "@/features/social-media/domain/oauth-intent";
import { validateSocialOAuthReturnPathId } from "@/features/social-media/validation/mutation-schemas";
import { resolveSocialOAuthSafeReturnPath } from "@/features/social-media/server/oauth-return-path";

const NOW = "2026-08-14T12:00:00.000Z";

function intent(
  overrides: Partial<SocialOAuthIntent> = {},
): SocialOAuthIntent {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    provider: "instagram",
    loginProduct: "instagram_login",
    organizationId: "11111111-1111-4111-8111-111111111111",
    workspaceId: "22222222-2222-4222-8222-222222222222",
    initiatingActorId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    returnPathId: "social_workspace",
    status: "pending",
    createdAt: "2026-08-14T11:00:00.000Z",
    expiresAt: "2026-08-14T13:00:00.000Z",
    consumedAt: null,
    ...overrides,
  };
}

describe("social OAuth intent", () => {
  it("is consumable only while pending and unexpired", () => {
    expect(isSocialOAuthIntentConsumable(intent(), NOW)).toBe(true);
    expect(
      isSocialOAuthIntentConsumable(intent({ status: "consumed" }), NOW),
    ).toBe(false);
    expect(
      isSocialOAuthIntentExpired(
        intent({ expiresAt: "2026-08-14T11:00:00.000Z" }),
        NOW,
      ),
    ).toBe(true);
    expect(
      isSocialOAuthIntentConsumable(
        intent({ expiresAt: "2026-08-14T11:00:00.000Z" }),
        NOW,
      ),
    ).toBe(false);
  });

  it("uses a closed return-path identifier, not an open URL", () => {
    expect(isSocialOAuthReturnPathId("social_workspace")).toBe(true);
    expect(isSocialOAuthReturnPathId("https://evil.example/phish")).toBe(false);
    expect(validateSocialOAuthReturnPathId("https://evil.example").success).toBe(
      false,
    );
    expect(mapSocialOAuthReturnPathId("social_workspace")).toBe("/");
  });

  it("reuses the trusted safe-return-path allowlist", () => {
    const mapped = resolveSocialOAuthSafeReturnPath("social_workspace");
    expect(mapped).toBe("/");
    expect(resolveSafeReturnPath(mapped)).toBe("/");
    expect(resolveSafeReturnPath("https://evil.example/phish")).toBe("/");
    expect(resolveSafeReturnPath("//evil.example")).toBe("/");
    expect(resolveSafeReturnPath("/api/social/instagram/callback")).toBe("/");
  });
});
