import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  B18_CONTROLLED_IMAGE_CAPTION,
  B18_INSTAGRAM_PUBLISH_ROUTE,
  buildB18InstagramPublishHref,
  isB18InstagramPublishPathname,
} from "@/features/social-media/domain/b18-publish-navigation";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";
import {
  isJpegMagic,
  isValidInstagramFeedImageDimensions,
} from "@/features/social-media/server/jpeg-dimensions";

describe("SMM-B1.8 controlled Instagram IMAGE publish surface", () => {
  it("exposes a closed B1.8 route and test caption", () => {
    expect(B18_INSTAGRAM_PUBLISH_ROUTE).toBe("/social/b18-instagram-publish");
    expect(isB18InstagramPublishPathname("/social/b18-instagram-publish")).toBe(
      true,
    );
    expect(
      isB18InstagramPublishPathname("/social/b18-instagram-publish-evil"),
    ).toBe(false);
    expect(
      buildB18InstagramPublishHref("11111111-1111-4111-8111-111111111111"),
    ).toBe(
      "/social/b18-instagram-publish?org=11111111-1111-4111-8111-111111111111",
    );
    expect(B18_CONTROLLED_IMAGE_CAPTION).toContain("B1.8");
    expect(
      resolveSafeReturnPath("/social/b18-instagram-publish?org=x"),
    ).toBe("/social/b18-instagram-publish?org=x");
    expect(isProtectedApplicationPath("/social/b18-instagram-publish")).toBe(
      true,
    );
  });

  it("keeps prepare/execute actions server-only and fail-closed for publishing", () => {
    const prepare = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/prepare-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const execute = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/execute-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const feature = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/social-publishing-feature.ts",
      ),
      "utf8",
    );

    expect(prepare).toContain('"use server"');
    expect(prepare).toContain("prepareB18ImagePublication");
    expect(prepare).not.toContain("SOCIAL_PUBLISHING_ENABLED=true");
    expect(prepare).not.toContain("service_role");
    expect(prepare).not.toContain("SERVICE_ROLE");

    expect(execute).toContain('"use server"');
    expect(execute).toContain("isSocialPublishingFeatureEnabled");
    expect(execute).toContain("executeB18ImagePublication");
    expect(execute).not.toContain("service_role");

    expect(feature).toContain("parseSocialPublishingEnabled");
    expect(isSocialPublishingFeatureEnabled({})).toBe(false);
    expect(isSocialPublishingFeatureEnabled({ SOCIAL_PUBLISHING_ENABLED: "true" })).toBe(
      true,
    );
    expect(
      isSocialPublishingFeatureEnabled({ SOCIAL_PUBLISHING_ENABLED: "TRUE" }),
    ).toBe(true);
    expect(
      isSocialPublishingFeatureEnabled({ SOCIAL_PUBLISHING_ENABLED: "1" }),
    ).toBe(false);
  });

  it("rejects non-JPEG bytes at the dimension helper boundary", () => {
    const pngish = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(isJpegMagic(pngish)).toBe(false);
    expect(isValidInstagramFeedImageDimensions(1080, 1080)).toBe(true);
    expect(isValidInstagramFeedImageDimensions(100, 100)).toBe(false);
    expect(isValidInstagramFeedImageDimensions(1080, 3000)).toBe(false);
  });
});
