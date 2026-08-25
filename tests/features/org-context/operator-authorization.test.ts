import { describe, expect, it } from "vitest";
import {
  ORG_CONTEXT_PLATFORM_OPERATOR_EMAIL_ALLOWLIST_ENV,
  ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV,
  resolveOrgContextPlatformOperatorAccess,
} from "@/features/org-context/domain/operator-identity";
import { resolveOrgContextPlatformOperator } from "@/features/org-context/server/platform-operator-authorization";

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
  it("allows an approved platform operator email", () => {
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: OPERATOR_ENV,
      }),
    ).toMatchObject({ ok: true, email: "ops@zyntix.test" });
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

  it("denies when the ORG-CONTEXT operator gate is not exactly true", () => {
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: {
          ...OPERATOR_ENV,
          [ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED_ENV]: "TRUE ",
        },
      }),
    ).toMatchObject({ ok: true });
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

  it("does not require Social operator UI enablement", () => {
    expect(
      resolveOrgContextPlatformOperatorAccess({
        email: "ops@zyntix.test",
        env: {
          ...OPERATOR_ENV,
          SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED: "false",
        },
      }),
    ).toMatchObject({ ok: true });
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
