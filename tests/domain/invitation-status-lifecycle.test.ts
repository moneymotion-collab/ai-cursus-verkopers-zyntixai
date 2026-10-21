import { describe, expect, it } from "vitest";
import {
  isOrganizationInvitationCredentialValid,
  isOrganizationInvitationEffectivelyExpired,
} from "@/features/invitations/domain/expiry";
import {
  isOrganizationInvitationAcceptable,
  isOrganizationInvitationLifecycleTerminal,
  isOrganizationInvitationResendable,
  isOrganizationInvitationRevocable,
} from "@/features/invitations/domain/lifecycle";
import {
  isNonTerminalOrganizationInvitationStatus,
  isTerminalOrganizationInvitationStatus,
} from "@/features/invitations/domain/status";

const EXPIRES_AT = "2026-08-09T12:00:00.000Z";
const BEFORE = "2026-08-09T11:59:59.999Z";
const AT = "2026-08-09T12:00:00.000Z";
const AFTER = "2026-08-09T12:00:00.001Z";

describe("organization invitation status terminal helpers", () => {
  it("treats pending as non-terminal", () => {
    expect(isTerminalOrganizationInvitationStatus("pending")).toBe(false);
    expect(isNonTerminalOrganizationInvitationStatus("pending")).toBe(true);
    expect(isOrganizationInvitationLifecycleTerminal("pending")).toBe(false);
  });

  it("treats accepted, revoked, and expired as terminal", () => {
    for (const status of ["accepted", "revoked", "expired"] as const) {
      expect(isTerminalOrganizationInvitationStatus(status)).toBe(true);
      expect(isNonTerminalOrganizationInvitationStatus(status)).toBe(false);
      expect(isOrganizationInvitationLifecycleTerminal(status)).toBe(true);
    }
  });
});

describe("organization invitation expiry boundary", () => {
  it("is valid only when pending and now < expiresAt", () => {
    expect(
      isOrganizationInvitationCredentialValid({
        status: "pending",
        expiresAt: EXPIRES_AT,
        now: BEFORE,
      }),
    ).toBe(true);

    expect(
      isOrganizationInvitationCredentialValid({
        status: "pending",
        expiresAt: EXPIRES_AT,
        now: AT,
      }),
    ).toBe(false);

    expect(
      isOrganizationInvitationCredentialValid({
        status: "pending",
        expiresAt: EXPIRES_AT,
        now: AFTER,
      }),
    ).toBe(false);
  });

  it("never treats accepted, revoked, or expired as credential-valid", () => {
    for (const status of ["accepted", "revoked", "expired"] as const) {
      expect(
        isOrganizationInvitationCredentialValid({
          status,
          expiresAt: EXPIRES_AT,
          now: BEFORE,
        }),
      ).toBe(false);
    }
  });

  it("marks pending at/after expiry as effectively expired", () => {
    expect(
      isOrganizationInvitationEffectivelyExpired({
        status: "pending",
        expiresAt: EXPIRES_AT,
        now: BEFORE,
      }),
    ).toBe(false);
    expect(
      isOrganizationInvitationEffectivelyExpired({
        status: "pending",
        expiresAt: EXPIRES_AT,
        now: AT,
      }),
    ).toBe(true);
    expect(
      isOrganizationInvitationEffectivelyExpired({
        status: "expired",
        expiresAt: EXPIRES_AT,
        now: BEFORE,
      }),
    ).toBe(true);
  });
});

describe("organization invitation lifecycle predicates", () => {
  it("allows accept/resend/revoke for pending before expiry", () => {
    const input = {
      status: "pending" as const,
      expiresAt: EXPIRES_AT,
      now: BEFORE,
    };
    expect(isOrganizationInvitationAcceptable(input)).toBe(true);
    expect(isOrganizationInvitationResendable(input)).toBe(true);
    expect(isOrganizationInvitationRevocable(input)).toBe(true);
  });

  it("denies accept/resend at and after expiry, but still allows revoke on pending", () => {
    for (const now of [AT, AFTER]) {
      const input = {
        status: "pending" as const,
        expiresAt: EXPIRES_AT,
        now,
      };
      expect(isOrganizationInvitationAcceptable(input)).toBe(false);
      expect(isOrganizationInvitationResendable(input)).toBe(false);
      expect(isOrganizationInvitationRevocable(input)).toBe(true);
    }
  });

  it("denies accept/resend/revoke for terminal statuses", () => {
    for (const status of ["accepted", "revoked", "expired"] as const) {
      const input = {
        status,
        expiresAt: EXPIRES_AT,
        now: BEFORE,
      };
      expect(isOrganizationInvitationAcceptable(input)).toBe(false);
      expect(isOrganizationInvitationResendable(input)).toBe(false);
      expect(isOrganizationInvitationRevocable(input)).toBe(false);
    }
  });
});
