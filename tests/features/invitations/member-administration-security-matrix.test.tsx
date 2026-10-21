/**
 * Slice 6 — Member Administration security / mutation matrix.
 * P0/P1 action-boundary regressions. TEST-ONLY.
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PendingInvitationsSection } from "@/features/invitations/ui/member-administration-lists";
import { MEMBERS_ROUTE } from "@/features/invitations/domain/members-navigation";
import { CREATE_INVITATION_MESSAGES } from "@/features/invitations/server/create-invitation-result";
import { RESEND_INVITATION_MESSAGES } from "@/features/invitations/server/resend-invitation-result";
import { REVOKE_INVITATION_MESSAGES } from "@/features/invitations/server/revoke-invitation-result";
import {
  ORG_A,
  ORG_B,
  USER_ID,
  INVITE_ID,
  SENTINEL_RAW_TOKEN,
  FUTURE_EXPIRES,
  PAST_EXPIRES,
  readyOrgContext,
  missingOrgContext,
  pendingManageRecord,
  pendingListItem,
} from "./helpers/member-admin-fixtures";

const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const resolveOrgContextMock = vi.hoisted(() => vi.fn());
const loadInvitationMock = vi.hoisted(() => vi.fn());
const createRpcMock = vi.hoisted(() => vi.fn());
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

vi.mock("@/features/invitations/server/create-invitation", () => ({
  createOrganizationInvitation: createRpcMock,
}));

vi.mock("@/features/invitations/server/resend-invitation", () => ({
  resendOrganizationInvitation: resendRpcMock,
}));

vi.mock("@/features/invitations/server/revoke-invitation", () => ({
  revokeOrganizationInvitation: revokeRpcMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

import { createInvitationAction } from "@/features/invitations/actions/create-invitation-action";
import { resendInvitationAction } from "@/features/invitations/actions/resend-invitation-action";
import { revokeInvitationAction } from "@/features/invitations/actions/revoke-invitation-action";

function resetAuthMocks() {
  createServerClientMock.mockResolvedValue({
    auth: { getUser: getUserMock },
  });
  getUserMock.mockResolvedValue({
    data: { user: { id: USER_ID } },
    error: null,
  });
}

describe("ADMIN READ VS MUTATION", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks();
  });

  it("Admin can read admin-target row but cannot resend/revoke via UI or action", async () => {
    const adminTarget = pendingListItem({
      invitationId: INVITE_ID,
      emailNormalized: "admin-invitee@example.com",
      role: "admin",
    });

    const html = renderToStaticMarkup(
      <PendingInvitationsSection
        invitations={[adminTarget]}
        timeZone="UTC"
        loadFailed={false}
        organizationId={ORG_A}
        actorRole="admin"
      />,
    );

    expect(html).toContain("admin-invitee@example.com");
    expect(html).toContain("Owner access required to manage this invitation.");
    expect(html).not.toContain("Resend");
    expect(html).not.toContain("Revoke");
    expect(html).not.toContain("data-pending-action-owner");

    resolveOrgContextMock.mockResolvedValue(readyOrgContext("admin"));
    loadInvitationMock.mockResolvedValue(pendingManageRecord("admin"));

    const resend = await resendInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });
    const revoke = await revokeInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });

    expect(resend).toEqual({
      ok: false,
      code: "forbidden",
      message: RESEND_INVITATION_MESSAGES.forbidden,
    });
    expect(revoke).toEqual({
      ok: false,
      code: "forbidden",
      message: REVOKE_INVITATION_MESSAGES.forbidden,
    });
    expect(resendRpcMock).not.toHaveBeenCalled();
    expect(revokeRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(JSON.stringify(resend)).not.toContain("admin-invitee@example.com");
    expect(JSON.stringify(revoke)).not.toContain("admin-invitee@example.com");
  });
});

describe("STALE / EXPIRED INVITATION", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks();
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("owner"));
  });

  it("resend rejects effectively expired pending before RPC", async () => {
    loadInvitationMock.mockResolvedValue(
      pendingManageRecord("staff", { expiresAt: PAST_EXPIRES }),
    );

    const result = await resendInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });

    expect(result).toEqual({
      ok: false,
      code: "invite_not_found_or_unavailable",
      message: RESEND_INVITATION_MESSAGES.invite_not_found_or_unavailable,
    });
    expect(resendRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("raw_token");
    expect(JSON.stringify(result)).not.toContain("invitee@");
    expect(JSON.stringify(result)).not.toMatch(/"role"/);
  });

  it("resend treats missing invitation as unavailable without RPC", async () => {
    loadInvitationMock.mockResolvedValue({ ok: false, kind: "not_found" });

    const result = await resendInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });

    expect(result.code).toBe("invite_not_found_or_unavailable");
    expect(resendRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revoke rejects terminal/non-pending status before RPC", async () => {
    loadInvitationMock.mockResolvedValue(
      pendingManageRecord("staff", { status: "revoked" }),
    );

    const result = await revokeInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });

    expect(result).toEqual({
      ok: false,
      code: "invite_not_found_or_unavailable",
      message: REVOKE_INVITATION_MESSAGES.invite_not_found_or_unavailable,
    });
    expect(revokeRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain("raw_token");
  });

  it("revoke treats missing invitation as unavailable without RPC", async () => {
    loadInvitationMock.mockResolvedValue({ ok: false, kind: "not_found" });

    const result = await revokeInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });

    expect(result.code).toBe("invite_not_found_or_unavailable");
    expect(revokeRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("CREATE OWNER TARGET DENIAL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks();
  });

  it("denies targetRole owner before auth/RPC via schema short-circuit", async () => {
    const result = await createInvitationAction({
      organizationId: ORG_A,
      email: "owner-target@example.com",
      targetRole: "owner",
    });

    expect(result).toMatchObject({
      ok: false,
      code: "invalid_input",
      message: CREATE_INVITATION_MESSAGES.invalid_input,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.targetRole).toBeTruthy();
    }
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(createRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("CREATE / REVOKE SUCCESS MATRIX", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks();
  });

  it("Owner → viewer succeeds, sanitizes token, and revalidates", async () => {
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("owner"));
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE_EXPIRES,
      raw_token: SENTINEL_RAW_TOKEN,
    });

    const result = await createInvitationAction({
      organizationId: ORG_A,
      email: "viewer-target@example.com",
      targetRole: "viewer",
    });

    expect(createRpcMock).toHaveBeenCalledWith(expect.anything(), {
      organizationId: ORG_A,
      email: "viewer-target@example.com",
      targetRole: "viewer",
    });
    expect(result).toEqual({
      ok: true,
      code: "success",
      message: CREATE_INVITATION_MESSAGES.success_delivery_disabled,
      delivery: "disabled",
    });
    expect(JSON.stringify(result)).not.toContain(SENTINEL_RAW_TOKEN);
    expect(JSON.stringify(result)).not.toContain("raw_token");
    expect(JSON.stringify(result)).not.toContain("rawToken");
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);
  });

  it("Admin → staff succeeds with sanitized result and revalidation", async () => {
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("admin"));
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE_EXPIRES,
    });

    const result = await createInvitationAction({
      organizationId: ORG_A,
      email: "staff-target@example.com",
      targetRole: "staff",
    });

    expect(result.ok).toBe(true);
    expect(createRpcMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);
  });

  it.each([
    ["staff"] as const,
    ["viewer"] as const,
  ])("Admin may revoke %s pending invitation and revalidates", async (target) => {
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("admin"));
    loadInvitationMock.mockResolvedValue(pendingManageRecord(target));
    revokeRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
    });

    const result = await revokeInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });

    expect(result).toEqual({
      ok: true,
      code: "success",
      message: REVOKE_INVITATION_MESSAGES.success,
    });
    expect(revokeRpcMock).toHaveBeenCalledWith(expect.anything(), {
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);
  });
});

describe("FOREIGN-TENANT DENIAL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks();
    resolveOrgContextMock.mockResolvedValue(missingOrgContext());
  });

  it.each([
    [
      "create",
      async () =>
        createInvitationAction({
          organizationId: ORG_B,
          email: "foreign@example.com",
          targetRole: "staff",
        }),
      () => createRpcMock,
    ],
    [
      "resend",
      async () =>
        resendInvitationAction({
          organizationId: ORG_B,
          invitationId: INVITE_ID,
        }),
      () => resendRpcMock,
    ],
    [
      "revoke",
      async () =>
        revokeInvitationAction({
          organizationId: ORG_B,
          invitationId: INVITE_ID,
        }),
      () => revokeRpcMock,
    ],
  ] as const)(
    "%s fails closed for foreign organization without RPC",
    async (_label, run, rpcGetter) => {
      const result = await run();

      expect(resolveOrgContextMock).toHaveBeenCalledWith({
        supabase: expect.anything(),
        organizationId: ORG_B,
      });
      expect(result).toMatchObject({ ok: false, code: "forbidden" });
      expect(rpcGetter()).not.toHaveBeenCalled();
      expect(loadInvitationMock).not.toHaveBeenCalled();
      expect(revalidatePathMock).not.toHaveBeenCalled();
      expect(JSON.stringify(result)).not.toContain("foreign@example.com");
      expect(JSON.stringify(result)).not.toContain(ORG_B);
    },
  );
});

describe("STAFF / VIEWER MUTATION DENIAL GLUE", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks();
  });

  it.each([
    ["staff"] as const,
    ["viewer"] as const,
  ])("%s create/resend/revoke denied before RPC", async (role) => {
    resolveOrgContextMock.mockResolvedValue(readyOrgContext(role));
    loadInvitationMock.mockResolvedValue(pendingManageRecord("viewer"));

    const create = await createInvitationAction({
      organizationId: ORG_A,
      email: "denied@example.com",
      targetRole: "viewer",
    });
    const resend = await resendInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });
    const revoke = await revokeInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });

    expect(create.code).toBe("forbidden");
    expect(resend.code).toBe("forbidden");
    expect(revoke.code).toBe("forbidden");
    expect(createRpcMock).not.toHaveBeenCalled();
    expect(resendRpcMock).not.toHaveBeenCalled();
    expect(revokeRpcMock).not.toHaveBeenCalled();
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});

describe("REVALIDATION CONSISTENCY", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAuthMocks();
    resolveOrgContextMock.mockResolvedValue(readyOrgContext("owner"));
  });

  it("success paths revalidate Members route; unavailable does not", async () => {
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE_EXPIRES,
    });
    const create = await createInvitationAction({
      organizationId: ORG_A,
      email: "ok@example.com",
      targetRole: "staff",
    });
    expect(create.ok).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);

    revalidatePathMock.mockClear();
    loadInvitationMock.mockResolvedValue(pendingManageRecord("staff"));
    resendRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE_EXPIRES,
      raw_token: SENTINEL_RAW_TOKEN,
    });
    const resend = await resendInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });
    expect(resend.ok).toBe(true);
    expect(JSON.stringify(resend)).not.toContain(SENTINEL_RAW_TOKEN);
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);

    revalidatePathMock.mockClear();
    loadInvitationMock.mockResolvedValue(pendingManageRecord("staff"));
    revokeRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
    });
    const revoke = await revokeInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });
    expect(revoke.ok).toBe(true);
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);

    revalidatePathMock.mockClear();
    loadInvitationMock.mockResolvedValue({ ok: false, kind: "not_found" });
    const unavailable = await resendInvitationAction({
      organizationId: ORG_A,
      invitationId: INVITE_ID,
    });
    expect(unavailable.ok).toBe(false);
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });
});
