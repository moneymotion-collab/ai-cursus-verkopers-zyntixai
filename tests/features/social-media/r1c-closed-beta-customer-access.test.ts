import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  buildSocialClosedBetaCustomerReadModel,
  canConnectWithClosedBetaEnrollment,
  isSocialNavVisibleForClosedBetaEnrollment,
  resolveSocialClosedBetaCustomerActionMatrix,
  resolveSocialNavVisible,
} from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import type { SocialClosedBetaEffectiveStatus } from "@/features/social-media/domain/closed-beta-enrollment";
import { SOCIAL_NAV_LABEL } from "@/features/social-media/domain/social-navigation";

const STATUSES: SocialClosedBetaEffectiveStatus[] = [
  "not_enrolled",
  "approved",
  "publishing_allowed",
  "paused",
  "revoked",
];

describe("SMM-R1-C closed-beta customer access UX", () => {
  it("defines navigation visibility per enrollment state", () => {
    expect(isSocialNavVisibleForClosedBetaEnrollment("not_enrolled")).toBe(
      false,
    );
    expect(isSocialNavVisibleForClosedBetaEnrollment("approved")).toBe(true);
    expect(
      isSocialNavVisibleForClosedBetaEnrollment("publishing_allowed"),
    ).toBe(true);
    expect(isSocialNavVisibleForClosedBetaEnrollment("paused")).toBe(true);
    expect(isSocialNavVisibleForClosedBetaEnrollment("revoked")).toBe(true);
    expect(resolveSocialNavVisible({ enrollmentStatus: "not_enrolled" })).toBe(
      false,
    );
    expect(
      resolveSocialNavVisible({
        explicitVisibility: true,
        enrollmentStatus: "not_enrolled",
      }),
    ).toBe(true);
    expect(
      resolveSocialNavVisible({
        explicitVisibility: false,
        enrollmentStatus: "approved",
      }),
    ).toBe(false);
  });

  it("implements the customer action matrix", () => {
    const expected: Record<
      SocialClosedBetaEffectiveStatus,
      { connect: boolean; prepare: boolean; executeEntitlement: boolean }
    > = {
      not_enrolled: { connect: false, prepare: false, executeEntitlement: false },
      approved: { connect: true, prepare: true, executeEntitlement: false },
      publishing_allowed: {
        connect: true,
        prepare: true,
        executeEntitlement: true,
      },
      paused: { connect: false, prepare: false, executeEntitlement: false },
      revoked: { connect: false, prepare: false, executeEntitlement: false },
    };

    for (const status of STATUSES) {
      const matrix = resolveSocialClosedBetaCustomerActionMatrix(status);
      expect(matrix.connectAllowed).toBe(expected[status].connect);
      expect(matrix.prepareAllowed).toBe(expected[status].prepare);
      expect(matrix.publishingEntitlementAllowed).toBe(
        expected[status].executeEntitlement,
      );
      expect(canConnectWithClosedBetaEnrollment(status)).toBe(
        expected[status].connect,
      );
    }
  });

  it("maps customer-safe read model copy without internal terminology", () => {
    const notEnrolled = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "not_enrolled",
    });
    expect(notEnrolled.isEnrolled).toBe(false);
    expect(notEnrolled.socialNavVisible).toBe(false);
    expect(notEnrolled.customerHeadline).toMatch(/closed beta/i);
    expect(notEnrolled.customerBody).not.toMatch(/GUC|SOCIAL_PUBLISHING|service_role|RPC/i);

    const approved = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "approved",
    });
    expect(approved.prepareAllowed).toBe(true);
    expect(approved.publishingEntitlementAllowed).toBe(false);
    expect(approved.executeBlockedReason).toMatch(/not been enabled/i);

    const publishingOff = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "publishing_allowed",
    });
    expect(publishingOff.publishingEntitlementAllowed).toBe(true);
    expect(publishingOff.globalPublishingEnabled).toBe(false);
    expect(publishingOff.executeBlockedReason).toBe(
      "Publishing is temporarily unavailable.",
    );
    expect(publishingOff.customerHeadline).toMatch(/temporarily unavailable/i);
    expect(publishingOff.diagnosticSummary).not.toMatch(/kill switch|GUC/i);

    const publishingOn = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "publishing_allowed",
      socialPublishingEnabled: "true",
    });
    expect(publishingOn.executeBlockedReason).toBeNull();

    const paused = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "paused",
    });
    expect(paused.prepareAllowed).toBe(false);
    expect(paused.connectAllowed).toBe(false);
    expect(paused.customerBody).toMatch(/remains available/i);

    const revoked = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "revoked",
    });
    expect(revoked.connectAllowed).toBe(false);
    expect(revoked.customerBody).toMatch(/no longer active|revoked/i);
    expect(revoked.betaBadgeLabel).toBe(SOCIAL_NAV_LABEL);
  });

  it("wires /social loader and AppShell enrollment-aware nav", () => {
    const loader = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/load-social-workspace-page.ts",
      ),
      "utf8",
    );
    const page = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/social/page.tsx"),
      "utf8",
    );
    const connectAction = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/start-r1-instagram-connect-action.ts",
      ),
      "utf8",
    );
    const navLink = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/social-primary-nav-link.tsx",
      ),
      "utf8",
    );
    const navAction = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/get-social-closed-beta-nav-visible-action.ts",
      ),
      "utf8",
    );

    expect(loader).toContain("closed_beta_not_enrolled");
    expect(loader).toContain("buildSocialClosedBetaCustomerReadModel");
    expect(loader).toContain("loadSocialClosedBetaEnrollmentStatus");
    expect(page).toContain("ClosedBetaNotEnrolledPanel");
    expect(page).toContain("socialNavVisible");
    expect(page).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(connectAction).toContain("assertClosedBetaConnectAllowed");
    const genericInitiate = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/initiate-instagram-connection.ts",
      ),
      "utf8",
    );
    expect(genericInitiate).toContain("assertClosedBetaConnectAllowed");
    expect(genericInitiate).toContain("already_connected");
    const genericAction = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/initiate-instagram-connection-action.ts",
      ),
      "utf8",
    );
    expect(genericAction).toContain("initiateInstagramConnection");
    expect(navLink).toContain("getSocialClosedBetaNavVisibleAction");
    expect(navLink).toContain('"use client"');
    expect(navAction).toContain("loadSocialClosedBetaEnrollmentStatus");
  });

  it("keeps operator and phase routes outside customer onboarding", () => {
    const page = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/social/page.tsx"),
      "utf8",
    );
    expect(page).not.toContain("/operator/social-beta");
    expect(page).not.toContain("Enroll / Approve");
    expect(page).not.toContain("self-enroll");

    for (const relative of [
      "src/app/(authenticated)/social/r1-instagram-connect/page.tsx",
      "src/app/(authenticated)/social/b18-instagram-publish/page.tsx",
      "src/app/(authenticated)/social/lifecycle/page.tsx",
    ]) {
      const legacy = readFileSync(join(process.cwd(), relative), "utf8");
      expect(legacy).toContain("redirect(");
      expect(legacy).toContain("buildSocialWorkspaceHref");
    }
  });

  it("avoids leaking operator allowlist or secrets in customer surfaces", () => {
    const panel = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/social-workspace-panel.tsx",
      ),
      "utf8",
    );
    const page = readFileSync(
      join(process.cwd(), "src/app/(authenticated)/social/page.tsx"),
      "utf8",
    );
    for (const source of [panel, page]) {
      expect(source).not.toContain("SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST");
      expect(source).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
      expect(source).not.toContain("zyntix.social_closed_beta_operator");
      expect(source).not.toContain("graph.facebook.com");
    }
  });
});
