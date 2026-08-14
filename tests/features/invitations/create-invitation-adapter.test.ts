import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createOrganizationInvitation } from "@/features/invitations/server/create-invitation";
import { CREATE_ORGANIZATION_INVITATION_RPC } from "@/features/invitations/server/create-invitation-result";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const SENTINEL = "RAW_TOKEN_SENTINEL_MUST_NOT_LEAK";

describe("createOrganizationInvitation adapter", () => {
  const rpcMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  function createClient() {
    return { rpc: rpcMock } as unknown as SupabaseClient<Database>;
  }

  it("invokes authenticated create RPC and strips raw_token from result", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          result_code: "success",
          invitation_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
          expires_at: "2026-09-01T00:00:00.000Z",
          raw_token: SENTINEL,
        },
      ],
      error: null,
    });

    const result = await createOrganizationInvitation(createClient(), {
      organizationId: ORG_ID,
      email: "invitee@example.com",
      targetRole: "staff",
    });

    expect(rpcMock).toHaveBeenCalledWith(CREATE_ORGANIZATION_INVITATION_RPC, {
      p_organization_id: ORG_ID,
      p_email: "invitee@example.com",
      p_target_role: "staff",
    });
    expect(result).toEqual({
      kind: "success",
      invitationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      expiresAt: "2026-09-01T00:00:00.000Z",
    });
    expect(JSON.stringify(result)).not.toContain(SENTINEL);
    expect(result).not.toHaveProperty("raw_token");
  });

  it("maps transport errors without leaking payloads", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "boom" },
    });

    const result = await createOrganizationInvitation(createClient(), {
      organizationId: ORG_ID,
      email: "invitee@example.com",
      targetRole: "viewer",
    });

    expect(result).toEqual({ kind: "transport_error" });
  });

  it("maps rate_limited RPC result without raw_token", async () => {
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

    const result = await createOrganizationInvitation(createClient(), {
      organizationId: ORG_ID,
      email: "invitee@example.com",
      targetRole: "staff",
    });

    expect(result).toEqual({ kind: "rate_limited" });
    expect(JSON.stringify(result)).not.toContain(SENTINEL);
  });
});
