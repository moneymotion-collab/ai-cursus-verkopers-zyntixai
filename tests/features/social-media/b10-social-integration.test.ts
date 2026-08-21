import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SOCIAL_NAV_LABEL,
  SOCIAL_NAV_VISIBLE,
  SOCIAL_ROUTE,
  buildSocialWorkspaceHref,
  isActiveQueuePublication,
  isHistoricalPendingConnectionShell,
  isSocialPathname,
  isSocialWorkspacePathname,
} from "@/features/social-media/domain/social-navigation";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";
import { mapSocialOAuthReturnPathId } from "@/features/social-media/domain/oauth-intent";

describe("SMM-B1.10 Social Beta 1 integration", () => {
  it("exposes canonical /social workspace and primary nav constants", () => {
    expect(SOCIAL_ROUTE).toBe("/social");
    expect(SOCIAL_NAV_LABEL).toBe("Social — Closed Beta");
    expect(SOCIAL_NAV_VISIBLE).toBe(true);
    expect(isSocialWorkspacePathname("/social")).toBe(true);
    expect(isSocialPathname("/social/lifecycle")).toBe(true);
    expect(
      buildSocialWorkspaceHref({
        organizationId: "11111111-1111-4111-8111-111111111111",
        section: "accounts",
      }),
    ).toBe(
      "/social?org=11111111-1111-4111-8111-111111111111&section=accounts",
    );
    expect(
      buildSocialWorkspaceHref({
        organizationId: "11111111-1111-4111-8111-111111111111",
        section: "calendar",
      }),
    ).toBe(
      "/social?org=11111111-1111-4111-8111-111111111111&section=calendar",
    );
  });

  it("allowlists /social for safe-return and protected paths", () => {
    expect(resolveSafeReturnPath("/social?social_oauth=connected")).toBe(
      "/social?social_oauth=connected",
    );
    expect(isProtectedApplicationPath("/social")).toBe(true);
    expect(mapSocialOAuthReturnPathId("social_workspace")).toBe("/social");
  });

  it("keeps historical leftovers out of active queue semantics", () => {
    expect(isHistoricalPendingConnectionShell("authorization_pending")).toBe(
      true,
    );
    expect(isHistoricalPendingConnectionShell("connected")).toBe(false);
    expect(
      isActiveQueuePublication({ status: "queued", attemptCount: 0 }),
    ).toBe(false);
    expect(
      isActiveQueuePublication({ status: "queued", attemptCount: 1 }),
    ).toBe(true);
  });

  it("wires AppShell Social nav and demotes phase pages to redirects", () => {
    const appShell = readFileSync(
      join(process.cwd(), "src/components/app-shell.tsx"),
      "utf8",
    );
    expect(appShell).toContain("SocialPrimaryNavLink");
    expect(appShell).toContain("socialNavVisible");
    expect(appShell).toContain('activeNav === "social"');

    for (const relative of [
      "src/app/(authenticated)/social/r1-instagram-connect/page.tsx",
      "src/app/(authenticated)/social/b18-instagram-publish/page.tsx",
      "src/app/(authenticated)/social/lifecycle/page.tsx",
    ]) {
      const page = readFileSync(join(process.cwd(), relative), "utf8");
      expect(page).toContain("redirect(");
      expect(page).toContain("buildSocialWorkspaceHref");
    }

    const workspace = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/social/page.tsx"),
      "utf8",
    );
    expect(workspace).toContain("SocialWorkspacePanel");
    expect(workspace).not.toContain("SMM B1.");
  });
});
