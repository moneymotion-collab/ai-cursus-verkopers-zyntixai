import { describe, expect, it } from "vitest";
import {
  CREATE_INVITATION_MESSAGES,
  mapCreateInvitationRpcRow,
  toCreateInvitationActionResult,
} from "@/features/invitations/server/create-invitation-result";

const SENTINEL_RAW_TOKEN = "RAW_TOKEN_SENTINEL_MUST_NOT_LEAK";

describe("mapCreateInvitationRpcRow", () => {
  it("maps success and discards raw_token from adapter result", () => {
    const mapped = mapCreateInvitationRpcRow({
      result_code: "success",
      invitation_id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      expires_at: "2026-09-01T00:00:00.000Z",
      raw_token: SENTINEL_RAW_TOKEN,
    });

    expect(mapped).toEqual({
      kind: "success",
      invitationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      expiresAt: "2026-09-01T00:00:00.000Z",
    });
    expect(JSON.stringify(mapped)).not.toContain(SENTINEL_RAW_TOKEN);
    expect(JSON.stringify(mapped)).not.toContain("raw_token");
  });

  it("maps collision and error codes without tokens", () => {
    expect(
      mapCreateInvitationRpcRow({
        result_code: "already_member",
        invitation_id: null,
        expires_at: null,
        raw_token: SENTINEL_RAW_TOKEN,
      }),
    ).toEqual({ kind: "already_member" });

    expect(
      mapCreateInvitationRpcRow({
        result_code: "existing_membership_requires_admin_action",
        invitation_id: null,
        expires_at: null,
        raw_token: null,
      }),
    ).toEqual({ kind: "existing_membership_requires_admin_action" });

    expect(
      mapCreateInvitationRpcRow({
        result_code: "invite_already_pending",
        invitation_id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
        expires_at: "2026-09-01T00:00:00.000Z",
        raw_token: SENTINEL_RAW_TOKEN,
      }),
    ).toEqual({
      kind: "invite_already_pending",
      invitationId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      expiresAt: "2026-09-01T00:00:00.000Z",
    });

    expect(
      mapCreateInvitationRpcRow({
        result_code: "forbidden",
        invitation_id: null,
        expires_at: null,
        raw_token: null,
      }),
    ).toEqual({ kind: "forbidden" });
  });
});

describe("toCreateInvitationActionResult", () => {
  it("produces token-free client messages", () => {
    const success = toCreateInvitationActionResult({
      kind: "success",
      invitationId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      expiresAt: null,
    });
    expect(success).toEqual({
      ok: true,
      code: "success",
      message: CREATE_INVITATION_MESSAGES.success,
    });
    expect(JSON.stringify(success)).not.toContain("raw_token");
    expect(JSON.stringify(success)).not.toContain("token");
    expect(success.message.toLowerCase()).not.toContain("email sent");

    expect(
      toCreateInvitationActionResult({ kind: "already_member" }),
    ).toMatchObject({
      ok: false,
      code: "already_member",
    });

    expect(
      toCreateInvitationActionResult({
        kind: "existing_membership_requires_admin_action",
      }),
    ).toMatchObject({
      ok: false,
      code: "existing_membership_requires_admin_action",
    });

    expect(
      toCreateInvitationActionResult({
        kind: "invite_already_pending",
        invitationId: null,
        expiresAt: null,
      }),
    ).toMatchObject({
      ok: false,
      code: "invite_already_pending",
    });

    expect(
      toCreateInvitationActionResult({ kind: "transport_error" }),
    ).toMatchObject({
      ok: false,
      code: "unexpected",
    });
  });
});
