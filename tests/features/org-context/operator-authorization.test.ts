import { describe, expect, it } from "vitest";
import { isInvitationEmailRecipientAllowlisted } from "@/features/invitations/server/delivery/config";
import {
  ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV,
  ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV,
  resolveOrgContextPlatformOperatorAccess,
} from "@/features/org-context/domain/operator-identity";
import { resolveOrgContextPlatformOperator } from "@/features/org-context/server/platform-operator-authorization";
import { SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST_ENV } from "@/features/social-media/domain/platform-operator-identity";

const OPERATOR_ENV = {
  [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "true",
  [ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV]: "ops@zyntix.test",
};

function authClient(user: { id: string; email?: string } | null) {
  return {
    auth: {
      async getUser() {
        return { data: { user } };
      },
    },
  };
}

describe("ORG-CONTEXT platform-operator authorization", () => {
  it("allows an approved dedicated platform operator email", () => {
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: OPERATOR_ENV,
      }),
    ).toMatchObject({ ok: true, email: "ops@zyntix.test" });
  });

  it("denies when the ORG-CONTEXT operator flag is missing, false, or invalid", () => {
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: {
          [ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV]: "ops@zyntix.test",
        },
      }),
    ).toMatchObject({ ok: false, reason: "operator_disabled" });
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: {
          ...OPERATOR_ENV,
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "false",
        },
      }),
    ).toMatchObject({ ok: false, reason: "operator_disabled" });
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: {
          ...OPERATOR_ENV,
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "yes",
        },
      }),
    ).toMatchObject({ ok: false, reason: "operator_disabled" });
  });

  it("does not treat the operator flag alone as actor authorization", () => {
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "anyone@tenant.test",
        env: {
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "true",
          [ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV]: "ops@zyntix.test",
        },
      }),
    ).toMatchObject({ ok: false, reason: "email_not_allowlisted" });
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: {
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "true",
        },
      }),
    ).toMatchObject({ ok: false, reason: "allowlist_empty" });
  });

  it("does not treat Organization owner, admin, staff, or viewer as a platform operator", () => {
    for (const email of [
      "owner@tenant.test",
      "admin@tenant.test",
      "staff@tenant.test",
      "viewer@tenant.test",
    ]) {
      expect(
        resolveOrgContextPlatformOperatorAccess({
          email,
          env: OPERATOR_ENV,
        }),
      ).toMatchObject({ ok: false, reason: "email_not_allowlisted" });
    }
  });

  it("denies unauthenticated callers", async () => {
    const result = await resolveOrgContextPlatformOperator(authClient(null), OPERATOR_ENV);
    expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("does not accept a privileged database factory as actor authorization", async () => {
    const result = await resolveOrgContextPlatformOperator(
      authClient({ id: "db-role-only" }),
      OPERATOR_ENV,
    );
    expect(result).toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
  });

  it("still requires explicit Organization targeting after operator approval", async () => {
    const result = await resolveOrgContextPlatformOperator(
      authClient({ id: "user-operator", email: "ops@zyntix.test" }),
      OPERATOR_ENV,
    );
    expect(result).toMatchObject({
      ok: true,
      value: { actorUserId: "user-operator", email: "ops@zyntix.test" },
    });
  });
});

describe("Closed Beta admission is not ORG-CONTEXT platform-operator authorization", () => {
  it("denies a synthetic Closed Beta admission recipient who is not a dedicated operator", () => {
    const admittedEmail = "admitted-tester@beta.test";
    const admissionAllowlist = [admittedEmail];
    expect(isInvitationEmailRecipientAllowlisted(admittedEmail, admissionAllowlist)).toBe(
      true,
    );
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: admittedEmail,
        env: {
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "true",
          INVITATION_EMAIL_RECIPIENT_ALLOWLIST: admittedEmail,
          [ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV]: "ops@zyntix.test",
        },
      }),
    ).toMatchObject({ ok: false, reason: "email_not_allowlisted" });
  });

  it("denies a Social closed-beta operator who is not on the dedicated ORG-CONTEXT allowlist", () => {
    const socialOperatorEmail = "social-ops@zyntix.test";
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: socialOperatorEmail,
        env: {
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "true",
          SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED: "true",
          [SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST_ENV]: socialOperatorEmail,
          [ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV]: "ops@zyntix.test",
        },
      }),
    ).toMatchObject({ ok: false, reason: "email_not_allowlisted" });
  });

  it("does not read the Social operator allowlist as ORG-CONTEXT authority", () => {
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: {
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "true",
          [SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST_ENV]: "ops@zyntix.test",
        },
      }),
    ).toMatchObject({ ok: false, reason: "allowlist_empty" });
  });
});
