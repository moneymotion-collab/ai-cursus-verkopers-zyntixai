import { describe, expect, it } from "vitest";
import {
  mapResendInvitationRpcRow,
  toResendInvitationActionResult,
  RESEND_INVITATION_MESSAGES,
} from "@/features/invitations/server/resend-invitation-result";
import {
  mapRevokeInvitationRpcRow,
  toRevokeInvitationActionResult,
  REVOKE_INVITATION_MESSAGES,
} from "@/features/invitations/server/revoke-invitation-result";

const SENTINEL = "RAW_TOKEN_SENTINEL_MUST_NOT_LEAK";
const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

describe("resend invitation result mapping", () => {
  it("sanitizes success and discards raw_token sentinel", () => {
    const mapped = mapResendInvitationRpcRow({
      result_code: "success",
      invitation_id: INVITE_ID,
      expires_at: "2026-09-01T00:00:00.000Z",
      raw_token: SENTINEL,
    });

    expect(mapped).toEqual({
      kind: "success",
      invitationId: INVITE_ID,
      expiresAt: "2026-09-01T00:00:00.000Z",
    });
    expect(JSON.stringify(mapped)).not.toContain(SENTINEL);
    expect(mapped).not.toHaveProperty("raw_token");
    expect(mapped).not.toHaveProperty("token");

    const action = toResendInvitationActionResult(mapped);
    expect(action).toEqual({
      ok: true,
      code: "success",
      message: RESEND_INVITATION_MESSAGES.success,
    });
    expect(JSON.stringify(action)).not.toContain(SENTINEL);
    expect(JSON.stringify(action)).not.toContain("raw_token");
    expect(action.message.toLowerCase()).not.toContain("email");
    expect(action.message.toLowerCase()).not.toContain("delivered");
  });

  it("maps domain and transport failures without bearer fields", () => {
    expect(
      toResendInvitationActionResult({
        kind: "invite_not_found_or_unavailable",
      }),
    ).toMatchObject({ ok: false, code: "invite_not_found_or_unavailable" });

    expect(
      toResendInvitationActionResult({ kind: "invite_revoked" }),
    ).toMatchObject({ ok: false, code: "invite_revoked" });

    expect(
      toResendInvitationActionResult({ kind: "invite_expired" }),
    ).toMatchObject({ ok: false, code: "invite_expired" });

    expect(
      toResendInvitationActionResult({ kind: "transport_error" }),
    ).toMatchObject({ ok: false, code: "unexpected" });

    expect(
      mapResendInvitationRpcRow({
        result_code: "unknown_code",
        invitation_id: null,
        expires_at: null,
        raw_token: SENTINEL,
      }),
    ).toEqual({ kind: "unexpected" });
  });
});

describe("revoke invitation result mapping", () => {
  it("maps success without token-capable fields", () => {
    const mapped = mapRevokeInvitationRpcRow({
      result_code: "success",
      invitation_id: INVITE_ID,
      expires_at: null,
      raw_token: null,
    });

    expect(mapped).toEqual({ kind: "success", invitationId: INVITE_ID });
    expect(mapped).not.toHaveProperty("raw_token");
    expect(mapped).not.toHaveProperty("token");

    const action = toRevokeInvitationActionResult(mapped);
    expect(action).toEqual({
      ok: true,
      code: "success",
      message: REVOKE_INVITATION_MESSAGES.success,
    });
    expect(JSON.stringify(action)).not.toContain("raw_token");
    expect(JSON.stringify(action)).not.toContain('"token"');
  });

  it("maps unavailable, revoked, and unexpected safely", () => {
    expect(
      toRevokeInvitationActionResult({
        kind: "invite_not_found_or_unavailable",
      }),
    ).toMatchObject({ ok: false, code: "invite_not_found_or_unavailable" });

    expect(
      toRevokeInvitationActionResult({ kind: "invite_revoked" }),
    ).toMatchObject({ ok: false, code: "invite_revoked" });

    expect(
      toRevokeInvitationActionResult({ kind: "transport_error" }),
    ).toMatchObject({ ok: false, code: "unexpected" });
  });
});
