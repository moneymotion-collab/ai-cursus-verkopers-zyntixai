import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  sealInvitationContinuation,
} from "@/features/invitations/server/continuation";
import { sealInvitationRegistrationOrigin } from "@/features/invitations/server/registration-origin";
import { resolveInvitationAuthState } from "@/features/invitations/server/resolve-invitation-auth-state";
import { tryProvisionAndLand } from "@/features/auth/server/resolve-registration-destination";
import { resolvePostLoginDestination } from "@/features/auth/server/resolve-authenticated-landing";

const TEST_SECRET = "e".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH);
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const VALID_TOKEN = "cd".repeat(32);

const listMembershipsMock = vi.hoisted(() => vi.fn());
const completeOwnerMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

vi.mock("@/features/auth/server/complete-owner-provisioning", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/auth/server/complete-owner-provisioning")
  >("@/features/auth/server/complete-owner-provisioning");
  return {
    ...actual,
    completeOwnerProvisioning: completeOwnerMock,
    isEmailVerified: (user: { email_confirmed_at?: string | null }) =>
      Boolean(user.email_confirmed_at),
  };
});

describe("Slice B owner-provisioning gate", () => {
  const previousFlag = process.env.PUBLIC_REGISTRATION_ENABLED;
  const previousSecret = process.env.INVITE_CONTINUATION_SECRET;
  const previousGate = process.env.INVITATIONS_ENABLED;

  beforeEach(() => {
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
    process.env.INVITATIONS_ENABLED = "true";
    listMembershipsMock.mockReset();
    completeOwnerMock.mockReset();
    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });
  });

  afterEach(() => {
    if (previousFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = previousFlag;
    }
    if (previousSecret === undefined) {
      delete process.env.INVITE_CONTINUATION_SECRET;
    } else {
      process.env.INVITE_CONTINUATION_SECRET = previousSecret;
    }
    if (previousGate === undefined) {
      delete process.env.INVITATIONS_ENABLED;
    } else {
      process.env.INVITATIONS_ENABLED = previousGate;
    }
  });

  it("tryProvisionAndLand refuses owner creation when public registration is disabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    const result = await tryProvisionAndLand({} as never, {
      id: USER_A,
      email_confirmed_at: "2026-01-01T00:00:00Z",
    } as never);
    expect(result.ok).toBe(false);
    expect(completeOwnerMock).not.toHaveBeenCalled();
  });

  it("tryProvisionAndLand provisions only when flag=true and zero memberships", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    completeOwnerMock.mockResolvedValue({
      ok: true,
      organizationId: "11111111-1111-4111-8111-111111111111",
    });
    const result = await tryProvisionAndLand({} as never, {
      id: USER_A,
      email_confirmed_at: "2026-01-01T00:00:00Z",
    } as never);
    expect(result.ok).toBe(true);
    expect(completeOwnerMock).toHaveBeenCalledOnce();
  });

  it("login destination honors trusted invite over /register/complete", async () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    const path = await resolvePostLoginDestination({} as never, "/invite/accept", {
      invitationCookies: { continuation: sealed.cookieValue },
      authenticatedUserId: USER_A,
    });
    expect(path).toBe("/invite/accept");
    expect(completeOwnerMock).not.toHaveBeenCalled();
  });

  it("zero memberships without invite routes to /register/complete without provisioning", async () => {
    const path = await resolvePostLoginDestination({} as never, "/leads", {
      invitationCookies: {},
      authenticatedUserId: USER_A,
    });
    expect(path).toBe("/register/complete");
    expect(completeOwnerMock).not.toHaveBeenCalled();
  });

  it("delayed verification: bound origin without raw continuation stays invite recovery", () => {
    const origin = sealInvitationRegistrationOrigin(USER_A, {
      secret: TEST_SECRET,
    });
    expect(origin.ok).toBe(true);
    if (!origin.ok) {
      return;
    }
    expect(
      resolveInvitationAuthState({
        cookies: { registrationOrigin: origin.cookieValue },
        authenticatedUserId: USER_A,
      }).kind,
    ).toBe("bound_registration_origin");
  });
});

describe("Slice B source architecture locks", () => {
  it("callback GET no longer calls tryProvisionAndLand", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/auth/callback/route.ts"),
      "utf8",
    );
    expect(source).not.toContain("tryProvisionAndLand");
    expect(source).toContain("resolvePostAuthDestination");
    expect(source).not.toMatch(/accept_organization_invitation/);
  });

  it("register complete GET no longer calls tryProvisionAndLand", () => {
    const source = readFileSync(
      join(process.cwd(), "src/app/register/complete/page.tsx"),
      "utf8",
    );
    expect(source).not.toContain("tryProvisionAndLand");
    expect(source).toContain("resolvePostAuthDestination");
    expect(source).toContain("OwnerOnboardingUnavailablePanel");
  });

  it("completeRegistrationAction enforces public registration flag and invite priority", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/auth/actions/auth-actions.ts"),
      "utf8",
    );
    expect(source).toContain("OWNER_ONBOARDING_UNAVAILABLE_MESSAGE");
    expect(source).toContain("sealInvitationRegistrationOrigin");
    expect(source).toContain("isRealNewAuthIdentity");
    expect(source).toContain("abandonInvitationRegistrationAction");
    expect(source).not.toMatch(/accept_organization_invitation/);
  });

  it("middleware does not final-gate /register on public flag alone", () => {
    const source = readFileSync(
      join(process.cwd(), "src/lib/supabase/middleware.ts"),
      "utf8",
    );
    expect(source).not.toContain("isPublicRegistrationEnabled");
    expect(source).not.toContain("registration=disabled");
  });
});
