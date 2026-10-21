import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  isSocialClosedBetaOperatorEmailAllowlisted,
  parseSocialClosedBetaOperatorEmailAllowlist,
  parseSocialClosedBetaOperatorUiEnabled,
  resolveSocialClosedBetaPlatformOperatorAccess,
} from "@/features/social-media/domain/platform-operator-identity";
import {
  buildSocialClosedBetaOperatorDetailHref,
  isSocialClosedBetaOperatorPathname,
  SOCIAL_CLOSED_BETA_OPERATOR_ROUTE,
} from "@/features/social-media/domain/platform-operator-navigation";
import { buildSocialClosedBetaCustomerReadModel } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";

describe("SMM-R1-B platform operator identity and routes", () => {
  it("fails closed unless UI enabled and email allowlisted", () => {
    expect(parseSocialClosedBetaOperatorUiEnabled(undefined)).toBe(false);
    expect(parseSocialClosedBetaOperatorUiEnabled("true")).toBe(true);
    expect(parseSocialClosedBetaOperatorEmailAllowlist("")).toEqual([]);
    expect(
      parseSocialClosedBetaOperatorEmailAllowlist("Ops@Example.com, other@x.com"),
    ).toEqual(["ops@example.com", "other@x.com"]);

    expect(
      resolveSocialClosedBetaPlatformOperatorAccess({
        email: "ops@example.com",
        env: {},
      }),
    ).toEqual({ ok: false, reason: "ui_disabled" });

    expect(
      resolveSocialClosedBetaPlatformOperatorAccess({
        email: "ops@example.com",
        env: {
          SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED: "true",
          SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST: "",
        },
      }),
    ).toEqual({ ok: false, reason: "allowlist_empty" });

    expect(
      resolveSocialClosedBetaPlatformOperatorAccess({
        email: "owner@tenant.com",
        env: {
          SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED: "true",
          SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST: "ops@zyntix.ai",
        },
      }),
    ).toEqual({ ok: false, reason: "email_not_allowlisted" });

    expect(
      resolveSocialClosedBetaPlatformOperatorAccess({
        email: "Ops@Zyntix.ai",
        env: {
          SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED: "true",
          SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST: "ops@zyntix.ai",
        },
      }),
    ).toEqual({ ok: true, email: "ops@zyntix.ai" });

    expect(
      isSocialClosedBetaOperatorEmailAllowlisted("owner@tenant.com", [
        "ops@zyntix.ai",
      ]),
    ).toBe(false);
  });

  it("registers operator route as protected/allowlisted", () => {
    expect(SOCIAL_CLOSED_BETA_OPERATOR_ROUTE).toBe("/operator/social-beta");
    expect(isSocialClosedBetaOperatorPathname("/operator/social-beta")).toBe(
      true,
    );
    expect(
      isSocialClosedBetaOperatorPathname("/operator/social-beta/abc"),
    ).toBe(true);
    expect(isProtectedApplicationPath("/operator/social-beta")).toBe(true);
    expect(
      resolveSafeReturnPath("/operator/social-beta?status=approved"),
    ).toBe("/operator/social-beta?status=approved");
    expect(
      buildSocialClosedBetaOperatorDetailHref(
        "11111111-1111-4111-8111-111111111111",
      ),
    ).toBe("/operator/social-beta/11111111-1111-4111-8111-111111111111");
  });

  it("builds customer informational read model without granting execute", () => {
    const approved = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "approved",
      socialPublishingEnabled: undefined,
    });
    expect(approved.prepareAllowed).toBe(true);
    expect(approved.publishingEntitlementAllowed).toBe(false);
    expect(approved.globalPublishingEnabled).toBe(false);
    expect(approved.executeBlockedReason).toMatch(/not been enabled|unavailable/i);

    const publishing = buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus: "publishing_allowed",
      socialPublishingEnabled: undefined,
    });
    expect(publishing.diagnosticSummary).toMatch(/unavailable|Publishing allowed/i);
  });

  it("keeps operator mutation action server-only and free of client service_role", () => {
    const action = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/mutate-social-closed-beta-enrollment-action.ts",
      ),
      "utf8",
    );
    const page = readFileSync(
      join(
        process.cwd(),
        "src/app/(authenticated)/operator/social-beta/page.tsx",
      ),
      "utf8",
    );
    expect(action).toContain('"use server"');
    expect(action).toContain("resolvePlatformClosedBetaOperatorSession");
    expect(action).toContain("mutateOperatorClosedBetaEnrollment");
    expect(action).not.toMatch(/NEXT_PUBLIC_.*SERVICE_ROLE/);
    expect(page).toContain("resolvePlatformClosedBetaOperatorSession");
    expect(page).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
