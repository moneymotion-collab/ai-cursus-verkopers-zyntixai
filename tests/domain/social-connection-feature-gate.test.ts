import { describe, expect, it } from "vitest";
import {
  areSocialInstagramConnectionsEnabled,
  parseSocialConnectionsEnabled,
  parseSocialInstagramConnectionsEnabled,
  SOCIAL_CONNECTIONS_ENABLED_ENV,
  SOCIAL_CREDENTIAL_ENCRYPTION_KEY_ENV,
  SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED_ENV,
} from "@/features/social-media/domain/feature-gate";
import {
  isSocialConnectionsFeatureEnabled,
  isSocialInstagramConnectionsFeatureEnabled,
} from "@/features/social-media/server/social-connections-feature";

describe("social connection feature gates", () => {
  it("fail-closes missing and malformed values", () => {
    expect(parseSocialConnectionsEnabled(undefined)).toBe(false);
    expect(parseSocialConnectionsEnabled("")).toBe(false);
    expect(parseSocialConnectionsEnabled("false")).toBe(false);
    expect(parseSocialConnectionsEnabled("0")).toBe(false);
    expect(parseSocialConnectionsEnabled("1")).toBe(false);
    expect(parseSocialConnectionsEnabled("yes")).toBe(false);
    expect(parseSocialConnectionsEnabled("true")).toBe(true);
    expect(parseSocialConnectionsEnabled("TRUE")).toBe(true);
    expect(parseSocialConnectionsEnabled(" true ")).toBe(true);
    expect(parseSocialInstagramConnectionsEnabled("true")).toBe(true);
    expect(parseSocialInstagramConnectionsEnabled("TRUE ")).toBe(true);
    expect(parseSocialInstagramConnectionsEnabled("on")).toBe(false);
  });

  it("requires both gates for Instagram connections", () => {
    expect(
      areSocialInstagramConnectionsEnabled({
        connectionsEnabled: "true",
        instagramEnabled: undefined,
      }),
    ).toBe(false);
    expect(
      areSocialInstagramConnectionsEnabled({
        connectionsEnabled: "true",
        instagramEnabled: "true",
      }),
    ).toBe(true);
  });

  it("reads env without NEXT_PUBLIC names and without creating secrets", () => {
    expect(SOCIAL_CONNECTIONS_ENABLED_ENV).toBe("SOCIAL_CONNECTIONS_ENABLED");
    expect(SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED_ENV).toBe(
      "SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED",
    );
    expect(SOCIAL_CREDENTIAL_ENCRYPTION_KEY_ENV).toBe(
      "SOCIAL_CREDENTIAL_ENCRYPTION_KEY",
    );
    expect(isSocialConnectionsFeatureEnabled({})).toBe(false);
    expect(
      isSocialConnectionsFeatureEnabled({ SOCIAL_CONNECTIONS_ENABLED: "true" }),
    ).toBe(true);
    expect(
      isSocialInstagramConnectionsFeatureEnabled({
        SOCIAL_CONNECTIONS_ENABLED: "true",
      }),
    ).toBe(false);
    expect(
      isSocialInstagramConnectionsFeatureEnabled({
        SOCIAL_CONNECTIONS_ENABLED: "true",
        SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED: "true",
      }),
    ).toBe(true);
  });
});
