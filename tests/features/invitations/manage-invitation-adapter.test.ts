import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resendOrganizationInvitation } from "@/features/invitations/server/resend-invitation";
import { revokeOrganizationInvitation } from "@/features/invitations/server/revoke-invitation";
import { RESEND_ORGANIZATION_INVITATION_RPC } from "@/features/invitations/server/resend-invitation-result";
import { REVOKE_ORGANIZATION_INVITATION_RPC } from "@/features/invitations/server/revoke-invitation-result";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SENTINEL = "RAW_TOKEN_SENTINEL_MUST_NOT_LEAK";

describe("manage invitation adapters", () => {
  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createClient() {
    return { rpc: rpcMock } as unknown as SupabaseClient<Database>;
  }

  it("resend invokes RPC once and strips raw_token sentinel", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          result_code: "success",
          invitation_id: INVITE_ID,
          expires_at: "2026-09-01T00:00:00.000Z",
          raw_token: SENTINEL,
        },
      ],
      error: null,
    });

    const result = await resendOrganizationInvitation(createClient(), {
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(RESEND_ORGANIZATION_INVITATION_RPC, {
      p_organization_id: ORG_ID,
      p_invitation_id: INVITE_ID,
    });
    expect(result).toEqual({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: "2026-09-01T00:00:00.000Z",
      rawToken: null,
    });
    expect(JSON.stringify(result)).not.toContain(SENTINEL);
    expect(result).not.toHaveProperty("raw_token");
  });

  it("revoke invokes RPC once without token fields on success", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          result_code: "success",
          invitation_id: INVITE_ID,
          expires_at: null,
          raw_token: null,
        },
      ],
      error: null,
    });

    const result = await revokeOrganizationInvitation(createClient(), {
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(rpcMock).toHaveBeenCalledTimes(1);
    expect(rpcMock).toHaveBeenCalledWith(REVOKE_ORGANIZATION_INVITATION_RPC, {
      p_organization_id: ORG_ID,
      p_invitation_id: INVITE_ID,
    });
    expect(result).toEqual({ kind: "success", invitationId: INVITE_ID });
    expect(result).not.toHaveProperty("raw_token");
    expect(result).not.toHaveProperty("token");
  });

  it("maps transport errors for both adapters", async () => {
    rpcMock.mockResolvedValue({ data: null, error: { message: "boom" } });

    await expect(
      resendOrganizationInvitation(createClient(), {
        organizationId: ORG_ID,
        invitationId: INVITE_ID,
      }),
    ).resolves.toEqual({ kind: "transport_error" });

    await expect(
      revokeOrganizationInvitation(createClient(), {
        organizationId: ORG_ID,
        invitationId: INVITE_ID,
      }),
    ).resolves.toEqual({ kind: "transport_error" });
  });

  it("maps resend rate_limited without raw_token", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          result_code: "rate_limited",
          invitation_id: null,
          expires_at: null,
          raw_token: SENTINEL,
        },
      ],
      error: null,
    });

    const result = await resendOrganizationInvitation(createClient(), {
      organizationId: ORG_ID,
      invitationId: INVITE_ID,
    });

    expect(result).toEqual({ kind: "rate_limited" });
    expect(JSON.stringify(result)).not.toContain(SENTINEL);
  });
});
