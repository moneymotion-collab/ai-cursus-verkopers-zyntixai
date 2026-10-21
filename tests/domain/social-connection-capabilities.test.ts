import { describe, expect, it } from "vitest";
import {
  createEmptySocialCapabilitySnapshot,
  DEFERRED_SOCIAL_CAPABILITIES,
  isDeferredSocialCapability,
  isSocialBeta1Capability,
  snapshotIncludesCapability,
  SOCIAL_BETA1_CAPABILITIES,
} from "@/features/social-media/domain/capabilities";
import {
  isAccountInAuthorizedInventory,
  selectAuthorizedAccount,
} from "@/features/social-media/domain/identity";
import {
  createSafeSocialProviderError,
  isSocialProviderErrorKind,
  SOCIAL_PROVIDER_ERROR_KINDS,
  socialPublicErrorHasForbiddenKey,
} from "@/features/social-media/domain/errors";
import {
  actorSourceForSocialConnectionEvent,
  isSocialConnectionEventType,
  SOCIAL_CONNECTION_EVENT_TYPES,
} from "@/features/social-media/domain/events";

describe("Beta 1 capability contract", () => {
  it("locks the Beta 1 capability identifiers", () => {
    expect(SOCIAL_BETA1_CAPABILITIES).toEqual([
      "publish_image",
      "publish_video",
      "publish_carousel",
      "publish_story",
      "publish_short",
      "schedule_via_provider",
      "fetch_metrics",
      "account_insights",
    ]);
    expect(isSocialBeta1Capability("publish_story")).toBe(true);
    expect(isSocialBeta1Capability("comments")).toBe(false);
  });

  it("keeps comments, DMs, ads, and provider-side edit/delete deferred", () => {
    expect(DEFERRED_SOCIAL_CAPABILITIES).toEqual([
      "comments",
      "delete_publication",
      "edit_publication",
      "direct_messages",
      "paid_ads",
    ]);
    expect(isDeferredSocialCapability("comments")).toBe(true);
    expect(isDeferredSocialCapability("publish_image")).toBe(false);
  });

  it("does not assume Instagram connections have every capability", () => {
    const snapshot = createEmptySocialCapabilitySnapshot({
      provider: "instagram",
      externalAccountId: "17841405309211844",
      observedAt: "2026-08-14T00:00:00.000Z",
    });
    expect(snapshot.capabilities).toEqual([]);
    expect(snapshotIncludesCapability(snapshot, "publish_story")).toBe(false);
  });
});

describe("authorized account inventory", () => {
  it("rejects a browser-supplied external account that is not in inventory", () => {
    const inventory = {
      provider: "instagram" as const,
      accounts: [
        {
          provider: "instagram" as const,
          externalAccountId: "17841405309211844",
          displayName: "Brand",
          username: "brand",
          professionalAccountType: "business" as const,
        },
      ],
    };
    expect(
      isAccountInAuthorizedInventory(inventory, "17841405309211844"),
    ).toBe(true);
    expect(isAccountInAuthorizedInventory(inventory, "999")).toBe(false);
    expect(selectAuthorizedAccount(inventory, "999")).toBeNull();
  });
});

describe("normalized provider errors", () => {
  it("exposes the locked taxonomy without credential fields", () => {
    expect(SOCIAL_PROVIDER_ERROR_KINDS).toEqual([
      "authorization_failed",
      "credential_expired",
      "permission_missing",
      "provider_rate_limited",
      "provider_unavailable",
      "validation_failed",
      "unsupported_account",
      "unsupported_capability",
      "external_not_found",
      "internal_error",
    ]);
    const error = createSafeSocialProviderError(
      "authorization_failed",
      "Authorization failed.",
    );
    expect(isSocialProviderErrorKind(error.kind)).toBe(true);
    expect(error).toEqual({
      kind: "authorization_failed",
      message: "Authorization failed.",
    });
    expect(socialPublicErrorHasForbiddenKey(error)).toBe(false);
    expect(
      socialPublicErrorHasForbiddenKey({
        kind: "internal_error",
        message: "failed",
        accessToken: "secret",
      }),
    ).toBe(true);
  });
});

describe("social connection audit events", () => {
  it("names connection lifecycle events without credential payloads", () => {
    expect(SOCIAL_CONNECTION_EVENT_TYPES).toEqual([
      "social_connection_initiated",
      "social_connection_established",
      "social_connection_reauthorization_required",
      "social_connection_reauthorized",
      "social_connection_permission_missing",
      "social_connection_revoked",
      "social_connection_disconnected",
      "social_connection_health_changed",
    ]);
    expect(isSocialConnectionEventType("social_connection_established")).toBe(
      true,
    );
    expect(actorSourceForSocialConnectionEvent("social_connection_established")).toBe(
      "member",
    );
    expect(
      actorSourceForSocialConnectionEvent("social_connection_health_changed"),
    ).toBe("system");
  });
});
