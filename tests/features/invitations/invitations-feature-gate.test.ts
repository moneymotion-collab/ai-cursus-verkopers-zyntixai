import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import {
  INVITE_CONTINUATION_COOKIE_NAME,
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  sealInvitationContinuation,
} from "@/features/invitations/server/continuation";
import {
  isInvitationsFeatureEnabled,
  parseInvitationsFeatureEnabled,
} from "@/features/invitations/server/invitations-feature";
import { sealInvitationRegistrationOrigin } from "@/features/invitations/server/registration-origin";
import { resolveInvitationAuthState } from "@/features/invitations/server/resolve-invitation-auth-state";
import { resolvePostLoginDestination } from "@/features/auth/server/resolve-authenticated-landing";
import { resolvePostAuthDestination } from "@/features/auth/server/resolve-registration-destination";
import { ACCEPT_INVITATION_MESSAGES } from "@/features/invitations/server/accept-invitation-result";

const TEST_SECRET = "f".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH);
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_A = "11111111-1111-4111-8111-111111111111";
const VALID_TOKEN = "ab".repeat(32);

const headersGetMock = vi.hoisted(() => vi.fn());
const cookiesGetMock = vi.hoisted(() => vi.fn());
const cookiesSetMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const signUpMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const listMembershipsMock = vi.hoisted(() => vi.fn());
const acceptRpcMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  headers: async () => ({ get: headersGetMock }),
  cookies: async () => ({
    get: cookiesGetMock,
    set: cookiesSetMock,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

vi.mock("@/features/invitations/server/accept-invitation", () => ({
  acceptOrganizationInvitation: acceptRpcMock,
}));

import { acceptInvitationAction } from "@/features/invitations/actions/accept-invitation-action";
import { registerAction } from "@/features/auth/actions/auth-actions";

describe("invitations feature helper", () => {
  it("parses fail-closed like public registration", () => {
    expect(parseInvitationsFeatureEnabled(undefined)).toBe(false);
    expect(parseInvitationsFeatureEnabled("")).toBe(false);
    expect(parseInvitationsFeatureEnabled("false")).toBe(false);
    expect(parseInvitationsFeatureEnabled("0")).toBe(false);
    expect(parseInvitationsFeatureEnabled("1")).toBe(false);
    expect(parseInvitationsFeatureEnabled("yes")).toBe(false);
    expect(parseInvitationsFeatureEnabled("true")).toBe(true);
    expect(parseInvitationsFeatureEnabled("TRUE")).toBe(true);
    expect(parseInvitationsFeatureEnabled(" true ")).toBe(true);
  });

  it("reads INVITATIONS_ENABLED from env without requiring secret", () => {
    expect(isInvitationsFeatureEnabled({})).toBe(false);
    expect(isInvitationsFeatureEnabled({ INVITATIONS_ENABLED: "true" })).toBe(
      true,
    );
    expect(
      isInvitationsFeatureEnabled({
        INVITATIONS_ENABLED: "true",
        INVITE_CONTINUATION_SECRET: undefined,
      }),
    ).toBe(true);
  });
});

describe("invitations feature gate OFF", () => {
  const previousSecret = process.env.INVITE_CONTINUATION_SECRET;
  const previousGate = process.env.INVITATIONS_ENABLED;
  const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
  const previousPublic = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
    process.env.INVITATIONS_ENABLED = "false";
    process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3000";
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    headersGetMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesSetMock.mockReset();
    getUserMock.mockReset();
    signUpMock.mockReset();
    createServerClientMock.mockReset();
    listMembershipsMock.mockReset();
    acceptRpcMock.mockReset();
    redirectMock.mockReset();
    headersGetMock.mockImplementation((name: string) =>
      name.toLowerCase() === "origin" ? "http://127.0.0.1:3000" : null,
    );
    cookiesGetMock.mockReturnValue(undefined);
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock, signUp: signUpMock },
    });
  });

  afterEach(() => {
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
    if (previousSite === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousSite;
    }
    if (previousPublic === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = previousPublic;
    }
  });

  it("exchange OFF does not seal continuation for valid or malformed tokens", async () => {
    const GET = (await import("@/app/invite/accept/exchange/route")).GET;

    for (const url of [
      `http://localhost:3000/invite/accept/exchange?token=${VALID_TOKEN}`,
      "http://localhost:3000/invite/accept/exchange?token=not-a-token",
    ]) {
      const response = await GET(new NextRequest(url));
      expect(response.status).toBe(303);
      const location = response.headers.get("location") ?? "";
      expect(location.endsWith("/invite/accept")).toBe(true);
      expect(location).not.toContain("token=");
      expect(location).not.toContain(VALID_TOKEN);
      expect(response.headers.get("referrer-policy")).toBe("no-referrer");
      expect(response.headers.get("cache-control")).toBe("no-store, private");
      expect(response.cookies.get(INVITE_CONTINUATION_COOKIE_NAME)).toBeUndefined();
    }
  });

  it("accept action OFF denies before RPC and does not clear cookies", async () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    cookiesGetMock.mockImplementation((name: string) =>
      name === INVITE_CONTINUATION_COOKIE_NAME
        ? { value: sealed.cookieValue }
        : undefined,
    );
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });

    const result = await acceptInvitationAction();
    expect(result.ok).toBe(false);
    expect(result.code).toBe("feature_disabled");
    expect(result.message).toBe(ACCEPT_INVITATION_MESSAGES.feature_disabled);
    expect(acceptRpcMock).not.toHaveBeenCalled();
    expect(cookiesSetMock).not.toHaveBeenCalled();
  });

  it("registerAction OFF denies invite signup even with valid continuation", async () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    cookiesGetMock.mockImplementation((name: string) =>
      name === INVITE_CONTINUATION_COOKIE_NAME
        ? { value: sealed.cookieValue }
        : undefined,
    );

    const result = await registerAction({
      name: "Invitee",
      email: "invitee@example.com",
      password: "correct-horse",
      registrationMode: "invite",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("registration_disabled");
    }
    expect(signUpMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("registerAction OFF + public registration ON still allows normal owner signup", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    // Retained invite cookie must not force invite mode while gate OFF.
    cookiesGetMock.mockImplementation((name: string) =>
      name === INVITE_CONTINUATION_COOKIE_NAME
        ? { value: sealed.cookieValue }
        : undefined,
    );
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    signUpMock.mockResolvedValue({
      data: { user: { id: USER_A } },
      error: null,
    });

    const result = await registerAction({
      name: "Owner",
      email: "owner@example.com",
      password: "correct-horse",
      companyName: "Acme",
    });

    expect(result.ok).toBe(true);
    expect(signUpMock).toHaveBeenCalledTimes(1);
  });

  it("resolver OFF returns none without clearing cookies conceptually", () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    const origin = sealInvitationRegistrationOrigin(USER_A, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok && origin.ok).toBe(true);
    if (!sealed.ok || !origin.ok) {
      return;
    }

    const state = resolveInvitationAuthState({
      cookies: {
        continuation: sealed.cookieValue,
        registrationOrigin: origin.cookieValue,
      },
      authenticatedUserId: USER_A,
      env: {
        INVITATIONS_ENABLED: "false",
        INVITE_CONTINUATION_SECRET: TEST_SECRET,
      },
    });
    expect(state.kind).toBe("none");
  });

  it("login/home destination OFF ignores invite cookies and does not loop", async () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });

    const path = await resolvePostLoginDestination({} as never, "/invite/accept", {
      invitationCookies: { continuation: sealed.cookieValue },
      authenticatedUserId: USER_A,
    });
    expect(path).toBe("/register/complete");
    expect(path).not.toBe("/invite/accept");
  });

  it("post-auth destination OFF ignores invite for zero membership + flag false", async () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";

    const destination = await resolvePostAuthDestination(
      {} as never,
      { id: USER_A, email_confirmed_at: "2026-01-01" } as never,
      { invitationCookies: { continuation: sealed.cookieValue } },
    );
    expect(destination.kind).toBe("complete_registration");
    expect(destination.path).toBe("/register/complete");
  });

  it("zero membership OFF + public registration ON allows explicit complete route only", async () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }
    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";

    const destination = await resolvePostAuthDestination(
      {} as never,
      { id: USER_A, email_confirmed_at: "2026-01-01" } as never,
      { invitationCookies: { continuation: sealed.cookieValue } },
    );
    expect(destination.kind).toBe("complete_registration");
    expect(destination.path).toBe("/register/complete");
    expect(destination.path).not.toBe("/invite/accept");
  });

  it("active member landing remains product when feature OFF", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "staff" }],
    });
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    const supabase = {
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: { onboarding_completed_at: "2026-01-01T00:00:00.000Z" },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    };

    const path = await resolvePostLoginDestination(supabase as never, "/", {
      invitationCookies: { continuation: sealed.cookieValue },
      authenticatedUserId: USER_A,
    });
    expect(path).toBe(`/home?org=${ORG_A}`);
  });

  it("feature re-enable before expiry resumes invitation routing", () => {
    const sealed = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(sealed.ok).toBe(true);
    if (!sealed.ok) {
      return;
    }

    expect(
      resolveInvitationAuthState({
        cookies: { continuation: sealed.cookieValue },
        authenticatedUserId: USER_A,
        env: {
          INVITATIONS_ENABLED: "false",
          INVITE_CONTINUATION_SECRET: TEST_SECRET,
        },
      }).kind,
    ).toBe("none");

    expect(
      resolveInvitationAuthState({
        cookies: { continuation: sealed.cookieValue },
        authenticatedUserId: USER_A,
        env: {
          INVITATIONS_ENABLED: "true",
          INVITE_CONTINUATION_SECRET: TEST_SECRET,
        },
      }).kind,
    ).toBe("raw_continuation");
  });
});

describe("invitations feature gate architecture locks", () => {
  it("gate helper is server-only and not NEXT_PUBLIC", () => {
    const helper = readFileSync(
      join(
        process.cwd(),
        "src/features/invitations/server/invitations-feature.ts",
      ),
      "utf8",
    );
    expect(helper).toContain("INVITATIONS_ENABLED");
    expect(helper).not.toContain("NEXT_PUBLIC_INVITATIONS_ENABLED");
    expect(helper).toContain('=== "true"');
    expect(helper).toContain("Server-only");
    expect(helper).toContain("deployment-environment control");

    const envExample = readFileSync(
      join(process.cwd(), ".env.example"),
      "utf8",
    );
    expect(envExample).toContain("INVITATIONS_ENABLED=false");
    expect(envExample).not.toContain("NEXT_PUBLIC_INVITATIONS_ENABLED");
  });

  it("exchange and accept surfaces check the gate; middleware unchanged", () => {
    const exchange = readFileSync(
      join(process.cwd(), "src/app/invite/accept/exchange/route.ts"),
      "utf8",
    );
    const page = readFileSync(
      join(process.cwd(), "src/app/invite/accept/page.tsx"),
      "utf8",
    );
    const action = readFileSync(
      join(
        process.cwd(),
        "src/features/invitations/actions/accept-invitation-action.ts",
      ),
      "utf8",
    );
    const register = readFileSync(
      join(process.cwd(), "src/app/register/page.tsx"),
      "utf8",
    );
    const authActions = readFileSync(
      join(process.cwd(), "src/features/auth/actions/auth-actions.ts"),
      "utf8",
    );
    const middleware = readFileSync(
      join(process.cwd(), "src/lib/supabase/middleware.ts"),
      "utf8",
    );

    expect(exchange).toContain("isInvitationsFeatureEnabled");
    expect(page).toContain("isInvitationsFeatureEnabled");
    expect(page).toContain("FeatureDisabledState");
    expect(page).toContain(
      "Invitations are currently unavailable. Please try again later.",
    );
    expect(page).not.toContain("force-static");
    expect(action).toContain("isInvitationsFeatureEnabled");
    expect(action).toContain("feature_disabled");
    expect(register).toContain("isInvitationsFeatureEnabled");
    expect(authActions).toContain("isInvitationsFeatureEnabled");
    expect(middleware).not.toContain("isInvitationsFeatureEnabled");
    expect(middleware).not.toContain("INVITATIONS_ENABLED");
  });

  it("does not add operator create/resend/revoke application surfaces", () => {
    const action = readFileSync(
      join(
        process.cwd(),
        "src/features/invitations/actions/accept-invitation-action.ts",
      ),
      "utf8",
    );
    expect(action).not.toContain("create_organization_invitation");
    expect(action).not.toContain("resend_organization_invitation");
    expect(action).not.toContain("revoke_organization_invitation");
  });
});
