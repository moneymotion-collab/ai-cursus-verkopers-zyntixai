import { beforeEach, describe, expect, it, vi } from "vitest";
import { CREATE_INVITATION_MESSAGES } from "@/features/invitations/server/create-invitation-result";
import { RESEND_INVITATION_MESSAGES } from "@/features/invitations/server/resend-invitation-result";
import { MEMBERS_ROUTE } from "@/features/invitations/domain/members-navigation";

const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const resolveOrgContextMock = vi.hoisted(() => vi.fn());
const createRpcMock = vi.hoisted(() => vi.fn());
const resendRpcMock = vi.hoisted(() => vi.fn());
const loadInvitationMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const orchestrateMock = vi.hoisted(() => vi.fn());

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

vi.mock("@/features/invitations/server/resend-invitation", () => ({
  resendOrganizationInvitation: resendRpcMock,
}));

vi.mock("@/features/invitations/server/load-invitation-for-manage", () => ({
  loadInvitationForManage: loadInvitationMock,
}));

vi.mock(
  "@/features/invitations/server/delivery/orchestrate-invitation-delivery",
  () => ({
    orchestrateInvitationDelivery: orchestrateMock,
  }),
);

import { createInvitationAction } from "@/features/invitations/actions/create-invitation-action";
import { resendInvitationAction } from "@/features/invitations/actions/resend-invitation-action";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "44444444-4444-4444-8444-444444444444";
const MEMBERSHIP_ID = "33333333-3333-4333-8333-333333333333";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const VALID_TOKEN =
  "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd";
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

describe("invitation delivery orchestration in actions (CB-E1-A)", () => {
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

  it("create success hands raw token to orchestration once and strips it from action result", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE,
      rawToken: VALID_TOKEN,
    });
    orchestrateMock.mockResolvedValue({
      kind: "submitted",
      providerMessageId: "msg_1",
    });

    const result = await createInvitationAction({
      organizationId: ORG_ID,
      email: "qa@example.com",
      targetRole: "staff",
    });

    expect(orchestrateMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock.mock.calls[0]?.[0]).toMatchObject({
      rawToken: VALID_TOKEN,
      invitationId: INVITE_ID,
      organizationId: ORG_ID,
      recipientEmail: "qa@example.com",
      targetRole: "staff",
      operation: "create",
    });
    expect(result).toEqual({
      ok: true,
      code: "success",
      message: CREATE_INVITATION_MESSAGES.success_submitted,
      delivery: "submitted",
    });
    expect(JSON.stringify(result)).not.toContain(VALID_TOKEN);
    expect(JSON.stringify(result)).not.toContain("rawToken");
    expect(JSON.stringify(result)).not.toContain("/invite/accept/exchange");
    expect(revalidatePathMock).toHaveBeenCalledWith(MEMBERS_ROUTE);
  });

  it("create rate_limited never calls delivery orchestration", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    createRpcMock.mockResolvedValue({ kind: "rate_limited" });

    const result = await createInvitationAction({
      organizationId: ORG_ID,
      email: "qa@example.com",
      targetRole: "staff",
    });

    expect(result).toEqual({
      ok: false,
      code: "rate_limited",
      message: CREATE_INVITATION_MESSAGES.rate_limited,
    });
    expect(orchestrateMock).not.toHaveBeenCalled();
  });

  it("Staff create is forbidden with zero delivery calls", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("staff"));

    const result = await createInvitationAction({
      organizationId: ORG_ID,
      email: "qa@example.com",
      targetRole: "viewer",
    });

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ code: "forbidden" });
    expect(createRpcMock).not.toHaveBeenCalled();
    expect(orchestrateMock).not.toHaveBeenCalled();
  });

  it("provider failure after create keeps invitation success with truthful delivery status", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    createRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE,
      rawToken: VALID_TOKEN,
    });
    orchestrateMock.mockResolvedValue({ kind: "delivery_provider_error" });

    const result = await createInvitationAction({
      organizationId: ORG_ID,
      email: "qa@example.com",
      targetRole: "viewer",
    });

    expect(result).toEqual({
      ok: true,
      code: "success",
      message: CREATE_INVITATION_MESSAGES.success_delivery_unavailable,
      delivery: "provider_error",
    });
    expect(createRpcMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock).toHaveBeenCalledTimes(1);
  });

  it("resend success rotates credential into orchestration once; action has no token", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    loadInvitationMock.mockResolvedValue({
      ok: true,
      invitation: {
        invitationId: INVITE_ID,
        role: "staff",
        status: "pending",
        expiresAt: FUTURE,
        emailNormalized: "qa@example.com",
      },
    });
    resendRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE,
      rawToken: VALID_TOKEN,
    });
    orchestrateMock.mockResolvedValue({
      kind: "submitted",
      providerMessageId: "msg_2",
    });

    const result = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(resendRpcMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock.mock.calls[0]?.[0]).toMatchObject({
      rawToken: VALID_TOKEN,
      operation: "resend",
      recipientEmail: "qa@example.com",
    });
    expect(result).toEqual({
      ok: true,
      code: "success",
      message: RESEND_INVITATION_MESSAGES.success_submitted,
      delivery: "submitted",
    });
    expect(JSON.stringify(result)).not.toContain(VALID_TOKEN);
  });

  it("resend rate_limited never calls delivery; no second resend", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("owner"));
    loadInvitationMock.mockResolvedValue({
      ok: true,
      invitation: {
        invitationId: INVITE_ID,
        role: "viewer",
        status: "pending",
        expiresAt: FUTURE,
        emailNormalized: "qa@example.com",
      },
    });
    resendRpcMock.mockResolvedValue({ kind: "rate_limited" });

    const result = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(result.code).toBe("rate_limited");
    expect(resendRpcMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock).not.toHaveBeenCalled();
  });

  it("provider failure after resend does not call resend RPC again", async () => {
    resolveOrgContextMock.mockResolvedValue(readyContext("admin"));
    loadInvitationMock.mockResolvedValue({
      ok: true,
      invitation: {
        invitationId: INVITE_ID,
        role: "viewer",
        status: "pending",
        expiresAt: FUTURE,
        emailNormalized: "qa@example.com",
      },
    });
    resendRpcMock.mockResolvedValue({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: FUTURE,
      rawToken: VALID_TOKEN,
    });
    orchestrateMock.mockResolvedValue({ kind: "delivery_provider_error" });

    const result = await resendInvitationAction({
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(resendRpcMock).toHaveBeenCalledTimes(1);
    expect(orchestrateMock).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      ok: true,
      code: "success",
      message: RESEND_INVITATION_MESSAGES.success_delivery_unavailable,
      delivery: "provider_error",
    });
  });
});
