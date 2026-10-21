import { describe, expect, it } from "vitest";
import {
  mapAcceptInvitationRpcRow,
  normalizeAcceptInvitationResultCode,
  toAcceptInvitationUiResult,
} from "@/features/invitations/server/accept-invitation-result";
import { assertInvitationAcceptSameOrigin } from "@/features/invitations/server/accept-invitation-origin";

describe("accept invitation result mapping", () => {
  it("normalizes unknown codes to unexpected", () => {
    expect(normalizeAcceptInvitationResultCode("nope")).toBe("unexpected");
    expect(normalizeAcceptInvitationResultCode(null)).toBe("unexpected");
  });

  it("requires trusted ids for success and already_member", () => {
    expect(
      mapAcceptInvitationRpcRow({
        result_code: "success",
        invitation_id: "i1",
        organization_id: null,
        membership_id: "m1",
      }).kind,
    ).toBe("unexpected");

    expect(
      mapAcceptInvitationRpcRow({
        result_code: "already_member",
        invitation_id: "i1",
        organization_id: "o1",
        membership_id: "m1",
      }),
    ).toEqual({
      kind: "already_member",
      organizationId: "o1",
      membershipId: "m1",
      invitationId: "i1",
    });
  });

  it("maps failure codes without ids", () => {
    expect(
      mapAcceptInvitationRpcRow({
        result_code: "email_mismatch",
        invitation_id: null,
        organization_id: null,
        membership_id: null,
      }).kind,
    ).toBe("email_mismatch");
    expect(toAcceptInvitationUiResult("forbidden").code).toBe(
      "verification_required",
    );
    expect(
      toAcceptInvitationUiResult("existing_membership_requires_admin_action")
        .code,
    ).toBe("admin_action_required");
  });
});

describe("accept invitation same-origin check", () => {
  const env = { NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000" };

  it("allows matching Origin", () => {
    expect(
      assertInvitationAcceptSameOrigin(
        { get: (name) => (name === "origin" ? "http://127.0.0.1:3000" : null) },
        env,
      ),
    ).toBe(true);
  });

  it("rejects missing or cross-origin Origin", () => {
    expect(
      assertInvitationAcceptSameOrigin({ get: () => null }, env),
    ).toBe(false);
    expect(
      assertInvitationAcceptSameOrigin(
        { get: (name) => (name === "origin" ? "https://evil.example" : null) },
        env,
      ),
    ).toBe(false);
  });

  it("normalizes Origin via URL.origin (trailing path ignored)", () => {
    expect(
      assertInvitationAcceptSameOrigin(
        {
          get: (name) =>
            name === "origin" ? "http://127.0.0.1:3000/ignored" : null,
        },
        env,
      ),
    ).toBe(true);
  });
});
