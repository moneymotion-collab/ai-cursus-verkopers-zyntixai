import { describe, expect, it } from "vitest";
import {
  SOCIAL_CONTENT_FORBIDDEN_LIFECYCLE_STATES,
  SOCIAL_CONTENT_FORMATS,
  SOCIAL_CONTENT_LIFECYCLE_STATUSES,
  SOCIAL_CONTENT_ORIGIN_KINDS,
  SOCIAL_MEDIA_CATEGORIES,
  SOCIAL_MEDIA_PROCESSING_STATES,
  SOCIAL_MEDIA_STORAGE_DECISION,
  SOCIAL_VARIANT_PROVIDER_CONFIG_KEYS,
  assertVariantProviderIsPlanned,
  isSocialContentFormat,
  isSocialContentLifecycleStatus,
  isSocialContentOriginKind,
  isSocialMediaCategory,
  isSocialVariantProviderConfig,
} from "@/features/social-media/domain/content";
import {
  canManageSocialContent,
  canManageSocialConnections,
  canViewSocialContent,
  resolveSocialContentPermissions,
} from "@/features/social-media/domain/permissions";
import { EMPTY_SOCIAL_CONTENT_PERMISSIONS } from "@/features/social-media/domain/types";
import {
  IMPLEMENTED_SOCIAL_PROVIDERS,
  isImplementedSocialProvider,
} from "@/features/social-media/domain/provider";
import { isPlannedSocialProvider } from "@/features/social-media/domain/planned-providers";
import { SOCIAL_BRAND_TRUTH_SOURCE_KINDS } from "@/features/social-media/domain/brand-brain";
import type { MembershipStatus } from "@/features/tasks/domain/permissions";

describe("SMM-B1.4 master content domain contracts", () => {
  it("defines provider-neutral origin, lifecycle, and format taxonomies", () => {
    expect(SOCIAL_CONTENT_ORIGIN_KINDS).toEqual([
      "human_created",
      "ai_assisted",
      "ai_generated",
      "imported",
      "repurposed",
    ]);
    expect(isSocialContentOriginKind("ai_generated")).toBe(true);
    expect(isSocialContentLifecycleStatus("draft")).toBe(true);
    expect(isSocialContentLifecycleStatus("published")).toBe(false);
    expect(SOCIAL_CONTENT_LIFECYCLE_STATUSES).toEqual(["draft", "ready"]);
    expect(isSocialContentFormat("short_video")).toBe(true);
    expect(isSocialContentFormat("instagram_reel")).toBe(false);
    expect(SOCIAL_CONTENT_FORMATS).toContain("story");
    expect(SOCIAL_CONTENT_FORMATS).toContain("carousel");
    expect(SOCIAL_CONTENT_FORMATS).toContain("long_video");
    expect(SOCIAL_CONTENT_FORMATS).toContain("text");
  });

  it("keeps publication and approval states out of content lifecycle", () => {
    for (const forbidden of SOCIAL_CONTENT_FORBIDDEN_LIFECYCLE_STATES) {
      expect(isSocialContentLifecycleStatus(forbidden)).toBe(false);
    }
  });

  it("allows AI content origin without making it Brand Brain truth", () => {
    expect(isSocialContentOriginKind("ai_inferred" as string)).toBe(false);
    expect(SOCIAL_BRAND_TRUTH_SOURCE_KINDS).not.toContain("ai_generated");
    expect(SOCIAL_CONTENT_ORIGIN_KINDS).toContain("ai_generated");
  });

  it("validates planned providers for variants without enabling runtime", () => {
    expect(assertVariantProviderIsPlanned("tiktok")).toBe(true);
    expect(isPlannedSocialProvider("tiktok")).toBe(true);
    expect(isImplementedSocialProvider("tiktok")).toBe(false);
    expect(assertVariantProviderIsPlanned("myspace")).toBe(false);
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
  });

  it("bounds media categories, processing states, and provider_config keys", () => {
    expect(isSocialMediaCategory("video")).toBe(true);
    expect(isSocialMediaCategory("document")).toBe(false);
    expect(SOCIAL_MEDIA_CATEGORIES).toEqual([
      "image",
      "video",
      "audio",
      "thumbnail",
    ]);
    expect(SOCIAL_MEDIA_PROCESSING_STATES).toEqual([
      "pending",
      "ready",
      "failed",
    ]);
    expect(SOCIAL_VARIANT_PROVIDER_CONFIG_KEYS).toContain("aspect_ratio_hint");
    expect(isSocialVariantProviderConfig({ aspect_ratio_hint: "9:16" })).toBe(
      true,
    );
    expect(isSocialVariantProviderConfig({ raw_payload: "{}" })).toBe(false);
    expect(SOCIAL_MEDIA_STORAGE_DECISION).toBe(
      "social_owns_metadata_storage_object_key_no_bucket_b14",
    );
  });
});

describe("SMM-B1.4 content role matrix", () => {
  it("allows Owner/Admin/Staff to manage content while Viewer is read-only", () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      expect(canManageSocialContent(role, "active")).toBe(true);
      expect(resolveSocialContentPermissions(role, "active")).toEqual({
        canViewContent: true,
        canCreateContent: true,
        canUpdateContent: true,
        canArchiveContent: true,
        canManageVariants: true,
        canManageMedia: true,
      });
    }
    expect(canManageSocialContent("viewer", "active")).toBe(false);
    expect(canViewSocialContent("viewer", "active")).toBe(true);
    expect(resolveSocialContentPermissions("viewer", "active")).toEqual({
      canViewContent: true,
      canCreateContent: false,
      canUpdateContent: false,
      canArchiveContent: false,
      canManageVariants: false,
      canManageMedia: false,
    });
  });

  it("keeps Staff out of connection mutations while allowing content mutations", () => {
    expect(canManageSocialConnections("staff", "active")).toBe(false);
    expect(canManageSocialContent("staff", "active")).toBe(true);
  });

  it("denies invited, suspended, and removed members for content mutations", () => {
    const nonActive: MembershipStatus[] = ["invited", "suspended", "removed"];
    for (const status of nonActive) {
      for (const role of ["owner", "admin", "staff"] as const) {
        expect(canManageSocialContent(role, status)).toBe(false);
        expect(canViewSocialContent(role, status)).toBe(false);
        expect(resolveSocialContentPermissions(role, status)).toEqual(
          EMPTY_SOCIAL_CONTENT_PERMISSIONS,
        );
      }
    }
  });
});
