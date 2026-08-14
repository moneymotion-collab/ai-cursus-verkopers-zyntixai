import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const resolveOrgContextMock = vi.hoisted(() => vi.fn());
const createRpcMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: resolveOrgContextMock,
}));

vi.mock("@/features/invitations/server/create-invitation", () => ({
  createOrganizationInvitation: createRpcMock,
}));

import { createInvitationAction } from "@/features/invitations/actions/create-invitation-action";
import { CREATE_INVITATION_MESSAGES } from "@/features/invitations/server/create-invitation-result";
import { MEMBERS_ROUTE } from "@/features/invitations/domain/members-navigation";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "99999999-9999-4999-8999-999999999999";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const MEMBERSHIP_ID = "33333333-3333-4333-8333-333333333333";
const SENTINEL = "RAW_TOKEN_SENTINEL_MUST_NOT_LEAK";

function readyContext(role: "owner" | "admin" | "staff" | "viewer") {
  return {
    ok: true as const,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBERSHIP_ID,
      role,
      userId: USER_ID,
    },
  };
}

describe("createInvitationAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
  });

  it("creates for Owner with staff role and revalidates without leaking raw token", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      expiresAt: "2026-09-01T00:00:00.000Z",
      // Defensive: adapter must never pass this through; action must not either.
      raw_token: SENTINEL,
    });

    const result = await createInvitationAction({
      organizationId: ORG_ID,
      email: " Invitee@Example.com ",
      targetRole: "staff",
    });

    expect(createRpcMock).toHaveBeenCalledWith(expect.anything(), {
      organizationId: ORG_ID,
      email: "invitee@example.com",
      targetRole: "staff",
    });
    expect(result).toEqual({
      ok: true,
      code: "success",
      message: CREATE_INVITATION_MESSAGES.success_delivery_disabled,
      delivery: "disabled",
    });
    expect(JSON.stringify(result)).not.toContain(SENTINEL);
    expect(JSON.stringify(result)).not.toContain("raw_token");
    expect(JSON.stringify(result)).not.toContain("rawToken");
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);
  });

  it("allows Owner to invite admin and Admin to invite viewer only as permitted", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      expiresAt: null,
    });

    const ownerAdmin = await createInvitationAction({
      organizationId: ORG_ID,
      email: "admin-target@example.com",
      targetRole: "admin",
    });
    expect(ownerAdmin.ok).toBe(true);
    expect(createRpcMock).toHaveBeenCalled();

    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      expiresAt: null,
    });

    const adminViewer = await createInvitationAction({
      organizationId: ORG_ID,
      email: "viewer-target@example.com",
      targetRole: "viewer",
    });
    expect(adminViewer.ok).toBe(true);
  });

  it("denies Admin inviting admin before RPC", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));

    const result = await createInvitationAction({
      organizationId: ORG_ID,
      email: "admin-target@example.com",
      targetRole: "admin",
    });

    expect(result).toEqual({
      ok: false,
      code: "forbidden",
      message: CREATE_INVITATION_MESSAGES.forbidden,
    });
    expect(createRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("denies Staff and Viewer before RPC", async () => {
    for (const role of ["staff", "viewer"] as const) {
      vi.clearAllMocks();
      createServerClientMock.mockResolvedValue({
        auth: { getUser: getUserMock },
      });
      getUserMock.mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      });
      resolveOrgContextMock.mockResolvedValue(readyContext(role));

      const result = await createInvitationAction({
        organizationId: ORG_ID,
        email: "invitee@example.com",
        targetRole: "viewer",
      });

      expect(result.code).toBe("forbidden");
      expect(createRpcMock).not.toHaveBeenCalled();
    }
  });

  it("does not trust a foreign organization id", async () => {
    resolveOrgContextMock.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization membership is unavailable.",
        retryable: false,
        category: "auth",
      },
    });

    const result = await createInvitationAction({
      organizationId: OTHER_ORG,
      email: "invitee@example.com",
      targetRole: "staff",
    });

    expect(resolveOrgContextMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: OTHER_ORG,
    });
    expect(result).toMatchObject({ ok: false, code: "forbidden" });
    expect(createRpcMock).not.toHaveBeenCalled();
  });

  it("does not call RPC on invalid email", async () => {
    const result = await createInvitationAction({
      organizationId: ORG_ID,
      email: "not-an-email",
      targetRole: "staff",
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.code).toBe("invalid_input");
    expect(result.fieldErrors?.email).toBeTruthy();
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(createRpcMock).not.toHaveBeenCalled();
  });

  it("maps collisions without revalidation", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));

    for (const kind of [
      "already_member",
      "existing_membership_requires_admin_action",
      "invite_already_pending",
      "rate_limited",
    ] as const) {
      createRpcMock.mockResolvedValue(
        kind === "invite_already_pending"
          ? { kind, invitationId: null, expiresAt: null }
          : { kind },
      );

      const result = await createInvitationAction({
        organizationId: ORG_ID,
        email: "invitee@example.com",
        targetRole: "viewer",
      });

      expect(result).toMatchObject({ ok: false, code: kind });
      if (!result.ok && kind === "rate_limited") {
        expect(result.message).toBe(CREATE_INVITATION_MESSAGES.rate_limited);
      }
      expect(revalidatePathMock).not.toHaveBeenCalled();
    }
  });

  it("keeps action source free of client token fields and delivery claims", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/invitations/actions/create-invitation-action.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/raw_token|invite_token|accept_url|magic_link/);
    expect(source.toLowerCase()).not.toContain("email sent");
    expect(source).toContain("revalidatePath");
  });
});
