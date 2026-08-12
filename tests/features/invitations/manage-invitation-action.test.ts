import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const resolveOrgContextMock = vi.hoisted(() => vi.fn());
const loadInvitationMock = vi.hoisted(() => vi.fn());
const resendRpcMock = vi.hoisted(() => vi.fn());
const revokeRpcMock = vi.hoisted(() => vi.fn());
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

vi.mock("@/features/invitations/server/load-invitation-for-manage", () => ({
  loadInvitationForManage: loadInvitationMock,
}));

vi.mock("@/features/invitations/server/resend-invitation", () => ({
  resendOrganizationInvitation: resendRpcMock,
}));

vi.mock("@/features/invitations/server/revoke-invitation", () => ({
  revokeOrganizationInvitation: revokeRpcMock,
}));

import { resendInvitationAction } from "@/features/invitations/actions/resend-invitation-action";
import { revokeInvitationAction } from "@/features/invitations/actions/revoke-invitation-action";
import { RESEND_INVITATION_MESSAGES } from "@/features/invitations/server/resend-invitation-result";
import { REVOKE_INVITATION_MESSAGES } from "@/features/invitations/server/revoke-invitation-result";
import { MEMBERS_ROUTE } from "@/features/invitations/domain/members-navigation";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ORG = "99999999-9999-4999-8999-999999999999";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const MEMBERSHIP_ID = "33333333-3333-4333-8333-333333333333";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SENTINEL = "RAW_TOKEN_SENTINEL_MUST_NOT_LEAK";
const FUTURE = "2099-01-01T00:00:00.000Z";

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

function pendingInvitation(role: "admin" | "staff" | "viewer") {
  return {
    ok: true as const,
    invitation: {
      invitationId: INVITE_ID,
      role,
      status: "pending",
      expiresAt: FUTURE,
    },
  };
}

describe("resendInvitationAction / revokeInvitationAction", () => {
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

  it("Owner may resend viewer/staff/admin and revalidates without leaking token", async () => {
    for (const target of ["viewer", "staff", "admin"] as const) {
      vi.clearAllMocks();
      createServerClientMock.mockResolvedValue({
        auth: { getUser: getUserMock },
      });
      getUserMock.mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      });
      resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
      loadInvitationMock.mockResolvedValue(pendingInvitation(target));
      resendRpcMock.mockResolvedValue({
        kind: "success",
        invitationId: INVITE_ID,
        expiresAt: FUTURE,
        raw_token: SENTINEL,
      });

      const result = await resendInvitationAction({
        organizationId: ORG_ID,
        invitationId: INVITE_ID,
      });

      expect(resendRpcMock).toHaveBeenCalledTimes(1);
      expect(resendRpcMock).toHaveBeenCalledWith(expect.anything(), {
        organizationId: ORG_ID,
        invitationId: INVITE_ID,
      });
      expect(result).toEqual({
        ok: true,
        code: "success",
        message: RESEND_INVITATION_MESSAGES.success,
      });
      expect(JSON.stringify(result)).not.toContain(SENTINEL);
      expect(JSON.stringify(result)).not.toContain("raw_token");
      expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);
    }
  });

  it("Admin may resend viewer/staff but not admin-target", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    loadInvitationMock.mockResolvedValue(pendingInvitation("viewer"));
    resendRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE,
    });

    const viewer = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });
    expect(viewer.ok).toBe(true);
    expect(resendRpcMock).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    loadInvitationMock.mockResolvedValue(pendingInvitation("staff"));
    resendRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE,
    });

    const staff = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });
    expect(staff.ok).toBe(true);

    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    loadInvitationMock.mockResolvedValue(pendingInvitation("admin"));

    const adminTarget = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });
    expect(adminTarget).toEqual({
      ok: false,
      code: "forbidden",
      message: RESEND_INVITATION_MESSAGES.forbidden,
    });
    expect(resendRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("Owner may revoke authorized pending targets; Admin denied on admin-target", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    loadInvitationMock.mockResolvedValue(pendingInvitation("admin"));
    revokeRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
    });

    const owner = await revokeInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });
    expect(owner).toEqual({
      ok: true,
      code: "success",
      message: REVOKE_INVITATION_MESSAGES.success,
    });
    expect(revokeRpcMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);

    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getUserMock.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    });
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    loadInvitationMock.mockResolvedValue(pendingInvitation("admin"));

    const adminDenied = await revokeInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });
    expect(adminDenied.code).toBe("forbidden");
    expect(revokeRpcMock).not.toHaveBeenCalled();
  });

  it("denies Staff and Viewer for both actions before RPC", async () => {
    for (const role of ["staff", "viewer"] as const) {
      for (const run of ["resend", "revoke"] as const) {
        vi.clearAllMocks();
        createServerClientMock.mockResolvedValue({
          auth: { getUser: getUserMock },
        });
        getUserMock.mockResolvedValue({
          data: { user: { id: USER_ID } },
          error: null,
        });
        resolveOrgContextMock.mockResolvedValue(readyContext(role));
        loadInvitationMock.mockResolvedValue(pendingInvitation("viewer"));

        const result =
          run === "resend"
            ? await resendInvitationAction({
                organizationId: ORG_ID,
                invitationId: INVITE_ID,
              })
            : await revokeInvitationAction({
                organizationId: ORG_ID,
                invitationId: INVITE_ID,
              });

        expect(result.code).toBe("forbidden");
        expect(resendRpcMock).not.toHaveBeenCalled();
        expect(revokeRpcMock).not.toHaveBeenCalled();
      }
    }
  });

  it("fails closed when active organization context is missing", async () => {
    resolveOrgContextMock.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization membership is unavailable.",
        retryable: false,
        category: "auth",
      },
    });

    const resend = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });
    const revoke = await revokeInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(resend.code).toBe("forbidden");
    expect(revoke.code).toBe("forbidden");
    expect(loadInvitationMock).not.toHaveBeenCalled();
    expect(resendRpcMock).not.toHaveBeenCalled();
    expect(revokeRpcMock).not.toHaveBeenCalled();
  });

  it("treats foreign/missing invitation as unavailable without RPC", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    loadInvitationMock.mockResolvedValue({ ok: false, kind: "not_found" });

    const result = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(result).toMatchObject({
      ok: false,
      code: "invite_not_found_or_unavailable",
    });
    expect(resendRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
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

    const result = await revokeInvitationAction({
      organizationId: OTHER_ORG,
      invitationId: INVITE_ID,
    });

    expect(resolveOrgContextMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: OTHER_ORG,
    });
    expect(result).toMatchObject({ ok: false, code: "forbidden" });
    expect(revokeRpcMock).not.toHaveBeenCalled();
  });

  it("rejects invalid invitation id before auth/RPC", async () => {
    const result = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: "not-a-uuid",
    });

    expect(result.code).toBe("invalid_input");
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(resendRpcMock).not.toHaveBeenCalled();
  });

  it("maps unexpected adapter failures without fabricating success", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    loadInvitationMock.mockResolvedValue(pendingInvitation("viewer"));
    resendRpcMock.mockResolvedValue({ kind: "transport_error" });
    revokeRpcMock.mockResolvedValue({ kind: "unexpected" });

    const resend = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });
    const revoke = await revokeInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(resend).toMatchObject({ ok: false, code: "unexpected" });
    expect(revoke).toMatchObject({ ok: false, code: "unexpected" });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("source boundary: no service role, console logging, or token_hash in manage path", () => {
    const files = [
      "src/features/invitations/actions/resend-invitation-action.ts",
      "src/features/invitations/actions/revoke-invitation-action.ts",
      "src/features/invitations/server/resend-invitation.ts",
      "src/features/invitations/server/revoke-invitation.ts",
      "src/features/invitations/server/resend-invitation-result.ts",
      "src/features/invitations/server/revoke-invitation-result.ts",
      "src/features/invitations/server/load-invitation-for-manage.ts",
      "src/features/invitations/ui/pending-invitation-actions.tsx",
    ];

    for (const relative of files) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source).not.toContain("service_role");
      expect(source).not.toContain("console.log");
      expect(source).not.toContain("console.error");
      expect(source).not.toMatch(/token_hash/);
    }

    const actionResultTypes = readFileSync(
      join(
        process.cwd(),
        "src/features/invitations/server/resend-invitation-result.ts",
      ),
      "utf8",
    );
    const actionBlock = actionResultTypes.slice(
      actionResultTypes.indexOf("export type ResendInvitationActionResult"),
      actionResultTypes.indexOf("export const RESEND_INVITATION_MESSAGES"),
    );
    expect(actionBlock).not.toContain("raw_token");
    expect(actionBlock).not.toContain("token");
  });
});
