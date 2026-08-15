import { describe, expect, it } from "vitest";
import {
  SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS,
  SOCIAL_PUBLICATION_CLIENT_FORBIDDEN_KEYS,
  SOCIAL_PUBLICATION_STATUSES,
  SOCIAL_PUBLISHING_ENABLED_ENV,
  computePublicationBackoffSeconds,
  createEmptySocialPublishingAdapterRegistry,
  isRetryableFailureClass,
  isSocialPublicationStatus,
  isSocialPublishingExecutionEnabled,
  parseSocialPublishingEnabled,
  requiredCapabilityForContentFormat,
  resolvePublishingAdapterOrUnavailable,
} from "@/features/social-media/domain/publishing";
import { IMPLEMENTED_SOCIAL_PROVIDERS } from "@/features/social-media/domain/provider";

describe("SMM-B1.6 publishing domain contracts", () => {
  it("fails closed on publishing gate and keeps Instagram adapter unimplemented", () => {
    expect(SOCIAL_PUBLISHING_ENABLED_ENV).toBe("SOCIAL_PUBLISHING_ENABLED");
    expect(parseSocialPublishingEnabled(undefined)).toBe(false);
    expect(parseSocialPublishingEnabled("true")).toBe(true);
    expect(
      isSocialPublishingExecutionEnabled({ publishingEnabled: null }),
    ).toBe(false);
    expect(SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS).toBe(
      "implemented_b17_gated",
    );
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
  });

  it("maps formats to capabilities without provider hard-coding in core", () => {
    expect(requiredCapabilityForContentFormat("story")).toBe("publish_story");
    expect(requiredCapabilityForContentFormat("short_video")).toBe(
      "publish_short",
    );
    expect(requiredCapabilityForContentFormat("text")).toBeNull();
  });

  it("keeps empty production registry fail-closed", () => {
    const registry = createEmptySocialPublishingAdapterRegistry();
    expect(resolvePublishingAdapterOrUnavailable(registry, "instagram")).toEqual(
      { ok: false, readiness: "provider_adapter_unavailable" },
    );
  });

  it("defines lifecycle, retry taxonomy, and client-safe forbidden keys", () => {
    expect(isSocialPublicationStatus("unknown_external_outcome")).toBe(true);
    expect(isSocialPublicationStatus("published")).toBe(false);
    expect(SOCIAL_PUBLICATION_STATUSES).toContain("failed_retryable");
    expect(isRetryableFailureClass("timeout")).toBe(true);
    expect(isRetryableFailureClass("authorization")).toBe(false);
    expect(computePublicationBackoffSeconds(1)).toBe(30);
    expect(computePublicationBackoffSeconds(3)).toBe(120);
    expect(SOCIAL_PUBLICATION_CLIENT_FORBIDDEN_KEYS).toContain("accessToken");
    expect(SOCIAL_PUBLICATION_CLIENT_FORBIDDEN_KEYS).toContain(
      "rawProviderResponse",
    );
  });
});
