import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const headersGetMock = vi.hoisted(() => vi.fn());
const cookiesGetMock = vi.hoisted(() => vi.fn());
const cookiesSetMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
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
import {
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  INVITE_CONTINUATION_COOKIE_NAME,
  sealInvitationContinuation,
} from "@/features/invitations/server/continuation";
import {
  INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
  sealInvitationRegistrationOrigin,
} from "@/features/invitations/server/registration-origin";
import { ACCEPT_INVITATION_MESSAGES } from "@/features/invitations/server/accept-invitation-result";

const TEST_SECRET = "c".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH);
const USER_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ORG_A = "11111111-1111-4111-8111-111111111111";
const VALID_TOKEN = "ab".repeat(32);

describe("acceptInvitationAction", () => {
  const previousSecret = process.env.INVITE_CONTINUATION_SECRET;
  const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
  const previousFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
    process.env.NEXT_PUBLIC_SITE_URL = "http://127.0.0.1:3000";
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    headersGetMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesSetMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    listMembershipsMock.mockReset();
    acceptRpcMock.mockReset();
    redirectMock.mockReset();

    headersGetMock.mockImplementation((name: string) =>
      name.toLowerCase() === "origin" ? "http://127.0.0.1:3000" : null,
    );
    cookiesGetMock.mockReturnValue(undefined);
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    redirectMock.mockImplementation((path: string) => {
      const error = new Error(`NEXT_REDIRECT:${path}`);
      (error as { digest?: string }).digest =
        `NEXT_REDIRECT;replace;${path};307;`;
      throw error;
    });
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.INVITE_CONTINUATION_SECRET;
    } else {
      process.env.INVITE_CONTINUATION_SECRET = previousSecret;
    }
    if (previousSite === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = previousSite;
    }
    if (previousFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = previousFlag;
    }
  });

  it("rejects cross-origin before RPC", async () => {
    headersGetMock.mockImplementation((name: string) =>
      name.toLowerCase() === "origin" ? "https://evil.example" : null,
    );
    const result = await acceptInvitationAction();
    expect(result.code).toBe("origin_rejected");
    expect(acceptRpcMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });

  it("denies unauthenticated callers without RPC", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const result = await acceptInvitationAction();
    expect(result.code).toBe("auth_required");
    expect(acceptRpcMock).not.toHaveBeenCalled();
  });

  it("does not call RPC without raw continuation", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
    const result = await acceptInvitationAction();
    expect(result.code).toBe("invitation_unavailable");
    expect(acceptRpcMock).not.toHaveBeenCalled();
    expect(cookiesSetMock).toHaveBeenCalledWith(
      INVITE_CONTINUATION_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("does not call RPC for tampered continuation and clears raw", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
    cookiesGetMock.mockImplementation((name: string) =>
      name === INVITE_CONTINUATION_COOKIE_NAME
        ? { value: "v1.not-valid-ciphertext" }
        : undefined,
    );
    const result = await acceptInvitationAction();
    expect(result.code).toBe("invitation_unavailable");
    expect(acceptRpcMock).not.toHaveBeenCalled();
  });

  it("does not call RPC for expired continuation and clears raw", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
    const expired = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
      nowMs: Date.now() - 3_600_000,
    });
    expect(expired.ok).toBe(true);
    if (!expired.ok) {
      return;
    }
    cookiesGetMock.mockImplementation((name: string) =>
      name === INVITE_CONTINUATION_COOKIE_NAME
        ? { value: expired.cookieValue }
        : undefined,
    );
    const result = await acceptInvitationAction();
    expect(result.code).toBe("invitation_unavailable");
    expect(acceptRpcMock).not.toHaveBeenCalled();
    expect(cookiesSetMock).toHaveBeenCalledWith(
      INVITE_CONTINUATION_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("rejects missing Origin before auth pipeline", async () => {
    headersGetMock.mockImplementation(() => null);
    const result = await acceptInvitationAction();
    expect(result.code).toBe("origin_rejected");
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(acceptRpcMock).not.toHaveBeenCalled();
  });

  it("gates unverified users before RPC", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: null } },
      error: null,
    });
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

    const result = await acceptInvitationAction();
    expect(result.code).toBe("verification_required");
    expect(acceptRpcMock).not.toHaveBeenCalled();
  });

  it("accepts when public registration is disabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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
    acceptRpcMock.mockResolvedValue({
      kind: "success",
      organizationId: ORG_A,
      membershipId: "m1",
      invitationId: "i1",
    });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "staff" }],
    });

    await expect(acceptInvitationAction()).rejects.toThrow(
      `NEXT_REDIRECT:/leads?org=${ORG_A}`,
    );
    expect(acceptRpcMock).toHaveBeenCalledOnce();
    expect(cookiesSetMock).toHaveBeenCalledWith(
      INVITE_CONTINUATION_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
    expect(cookiesSetMock).toHaveBeenCalledWith(
      INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("does not swallow successful redirect as unexpected", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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
    acceptRpcMock.mockResolvedValue({
      kind: "already_member",
      organizationId: ORG_A,
      membershipId: "m1",
      invitationId: "i1",
    });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "admin" }],
    });

    // redirect() is outside catch — mock throw propagates unchanged.
    await expect(acceptInvitationAction()).rejects.toThrow(
      `NEXT_REDIRECT:/leads?org=${ORG_A}`,
    );
  });

  it("fails closed when RPC org is missing from fresh memberships", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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
    acceptRpcMock.mockResolvedValue({
      kind: "success",
      organizationId: ORG_A,
      membershipId: "m1",
      invitationId: "i1",
    });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [],
    });

    await expect(acceptInvitationAction()).rejects.toThrow("NEXT_REDIRECT:/");
    expect(cookiesSetMock).toHaveBeenCalledWith(
      INVITE_CONTINUATION_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });

  it("uses authenticated landing when org verify fails but other memberships exist", async () => {
    const ORG_B = "22222222-2222-4222-8222-222222222222";
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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
    acceptRpcMock.mockResolvedValue({
      kind: "success",
      organizationId: ORG_A,
      membershipId: "m1",
      invitationId: "i1",
    });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_B, role: "staff" }],
    });

    await expect(acceptInvitationAction()).rejects.toThrow(
      `NEXT_REDIRECT:/leads?org=${ORG_B}`,
    );
  });

  it("retains cookies on email_mismatch", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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
    cookiesGetMock.mockImplementation((name: string) => {
      if (name === INVITE_CONTINUATION_COOKIE_NAME) {
        return { value: sealed.cookieValue };
      }
      if (name === INVITE_REGISTRATION_ORIGIN_COOKIE_NAME) {
        return { value: origin.cookieValue };
      }
      return undefined;
    });
    acceptRpcMock.mockResolvedValue({ kind: "email_mismatch" });

    const result = await acceptInvitationAction();
    expect(result).toEqual({
      ok: false,
      code: "email_mismatch",
      message: ACCEPT_INVITATION_MESSAGES.email_mismatch,
    });
    expect(cookiesSetMock).not.toHaveBeenCalled();
  });

  it("retains cookies on admin_action and forbidden", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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

    acceptRpcMock.mockResolvedValue({
      kind: "existing_membership_requires_admin_action",
    });
    expect((await acceptInvitationAction()).code).toBe("admin_action_required");
    expect(cookiesSetMock).not.toHaveBeenCalled();

    cookiesSetMock.mockClear();
    acceptRpcMock.mockResolvedValue({ kind: "forbidden" });
    expect((await acceptInvitationAction()).code).toBe("verification_required");
    expect(cookiesSetMock).not.toHaveBeenCalled();
  });

  it("clears only raw on unavailable", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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
    cookiesGetMock.mockImplementation((name: string) => {
      if (name === INVITE_CONTINUATION_COOKIE_NAME) {
        return { value: sealed.cookieValue };
      }
      if (name === INVITE_REGISTRATION_ORIGIN_COOKIE_NAME) {
        return { value: origin.cookieValue };
      }
      return undefined;
    });
    acceptRpcMock.mockResolvedValue({
      kind: "invite_not_found_or_unavailable",
    });

    const result = await acceptInvitationAction();
    expect(result.code).toBe("invitation_unavailable");
    expect(cookiesSetMock).toHaveBeenCalledWith(
      INVITE_CONTINUATION_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
    const clearedOrigin = cookiesSetMock.mock.calls.some(
      (call) => call[0] === INVITE_REGISTRATION_ORIGIN_COOKIE_NAME,
    );
    expect(clearedOrigin).toBe(false);
  });

  it("retains cookies on unexpected/transport", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_A, email_confirmed_at: "2026-01-01" } },
      error: null,
    });
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
    acceptRpcMock.mockResolvedValue({ kind: "transport_error" });
    expect((await acceptInvitationAction()).code).toBe("unexpected");
    expect(cookiesSetMock).not.toHaveBeenCalled();
  });
});

describe("Slice C architecture locks", () => {
  it("page GET does not call Accept RPC; action owns mutation", () => {
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
    const exchange = readFileSync(
      join(process.cwd(), "src/app/invite/accept/exchange/route.ts"),
      "utf8",
    );
    expect(page).not.toMatch(/accept_organization_invitation/);
    expect(page).not.toContain("acceptOrganizationInvitation");
    expect(exchange).not.toMatch(/accept_organization_invitation/);
    expect(action).toContain("acceptOrganizationInvitation");
    expect(action).not.toContain("tryProvisionAndLand");
    expect(action).not.toContain("completeOwnerProvisioning");
    expect(action).not.toMatch(/SERVICE_ROLE|service_role/i);
    expect(action).toContain("assertInvitationAcceptSameOrigin");
    expect(action).toContain("buildProductDestination");
    expect(action).not.toContain("resolveAuthenticatedLanding");
    // redirect must not sit inside a catch that normalizes to unexpected.
    expect(action).not.toMatch(/catch\s*\([^)]*\)\s*\{[\s\S]*NEXT_REDIRECT/);
    expect(action).not.toContain("isNextRedirectError");
  });

  it("client accept control never receives raw token props", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/invitations/ui/accept-invitation-button.tsx",
      ),
      "utf8",
    );
    expect(source).toContain("Accept invitation");
    expect(source).not.toMatch(/rawToken|raw_token|token=/);
    expect(source).not.toContain("organizationId");
    expect(source).not.toContain("invitationId");
  });
});
