import { describe, expect, it } from "vitest";
import {
  canExecuteWithClosedBetaEnrollment,
  canPrepareWithClosedBetaEnrollment,
  closedBetaPrepareDenialCode,
  closedBetaPublishDenialCode,
  evaluateSocialProviderWriteAuthorization,
  isLegalClosedBetaTransition,
  nextClosedBetaStatusAfterAction,
  userSafeClosedBetaDenialMessage,
} from "@/features/social-media/domain/closed-beta-enrollment";

describe("SMM-R1-A closed-beta enrollment domain", () => {
  it("enforces prepare eligibility by status", () => {
    expect(canPrepareWithClosedBetaEnrollment("not_enrolled")).toBe(false);
    expect(canPrepareWithClosedBetaEnrollment("approved")).toBe(true);
    expect(canPrepareWithClosedBetaEnrollment("publishing_allowed")).toBe(true);
    expect(canPrepareWithClosedBetaEnrollment("paused")).toBe(false);
    expect(canPrepareWithClosedBetaEnrollment("revoked")).toBe(false);
    expect(closedBetaPrepareDenialCode("not_enrolled")).toBe(
      "closed_beta_not_enrolled",
    );
    expect(closedBetaPrepareDenialCode("paused")).toBe("closed_beta_paused");
    expect(closedBetaPrepareDenialCode("revoked")).toBe("closed_beta_revoked");
    expect(closedBetaPrepareDenialCode("approved")).toBeNull();
  });

  it("enforces publish eligibility separately from prepare", () => {
    expect(canExecuteWithClosedBetaEnrollment("approved")).toBe(false);
    expect(canExecuteWithClosedBetaEnrollment("publishing_allowed")).toBe(true);
    expect(closedBetaPublishDenialCode("approved")).toBe(
      "closed_beta_publish_not_allowed",
    );
    expect(closedBetaPublishDenialCode("publishing_allowed")).toBeNull();
  });

  it("defines legal operator transitions and rejects illegal ones", () => {
    expect(
      isLegalClosedBetaTransition({ current: null, action: "enroll_approved" }),
    ).toBe(true);
    expect(
      nextClosedBetaStatusAfterAction({
        current: null,
        action: "enroll_approved",
      }),
    ).toBe("approved");

    expect(
      isLegalClosedBetaTransition({
        current: "approved",
        action: "allow_publishing",
      }),
    ).toBe(true);
    expect(
      isLegalClosedBetaTransition({
        current: "publishing_allowed",
        action: "allow_publishing",
      }),
    ).toBe(false);

    expect(
      isLegalClosedBetaTransition({ current: "approved", action: "pause" }),
    ).toBe(true);
    expect(
      isLegalClosedBetaTransition({
        current: "publishing_allowed",
        action: "pause",
      }),
    ).toBe(true);
    expect(
      isLegalClosedBetaTransition({
        current: "paused",
        action: "resume",
        statusBeforePause: "approved",
      }),
    ).toBe(true);
    expect(
      nextClosedBetaStatusAfterAction({
        current: "paused",
        action: "resume",
        statusBeforePause: "publishing_allowed",
      }),
    ).toBe("publishing_allowed");

    expect(
      isLegalClosedBetaTransition({ current: "revoked", action: "resume" }),
    ).toBe(false);
    expect(
      isLegalClosedBetaTransition({
        current: "revoked",
        action: "allow_publishing",
      }),
    ).toBe(false);
    expect(
      isLegalClosedBetaTransition({
        current: "approved",
        action: "revoke",
      }),
    ).toBe(true);
  });

  it("proves global kill-switch precedence over publishing_allowed", () => {
    const base = {
      enrollmentStatus: "publishing_allowed" as const,
      isOwnerOrAdmin: true,
      membershipActive: true,
      connectionEligible: true,
      lifecycleClaimable: true,
    };

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: false,
      }),
    ).toEqual({ allowed: false, reason: "publishing_globally_disabled" });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
        enrollmentStatus: "not_enrolled",
      }),
    ).toEqual({ allowed: false, reason: "closed_beta_not_enrolled" });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
        enrollmentStatus: "approved",
      }),
    ).toEqual({ allowed: false, reason: "closed_beta_publish_not_allowed" });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
        enrollmentStatus: "paused",
      }),
    ).toEqual({ allowed: false, reason: "closed_beta_paused" });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
        enrollmentStatus: "revoked",
      }),
    ).toEqual({ allowed: false, reason: "closed_beta_revoked" });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
      }),
    ).toEqual({ allowed: true });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
        isOwnerOrAdmin: false,
      }),
    ).toEqual({ allowed: false, reason: "authorization_failure" });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
        connectionEligible: false,
      }),
    ).toEqual({ allowed: false, reason: "connection_capability_failure" });

    expect(
      evaluateSocialProviderWriteAuthorization({
        ...base,
        socialPublishingEnabled: true,
        lifecycleClaimable: false,
      }),
    ).toEqual({ allowed: false, reason: "lifecycle_failure" });
  });

  it("exposes user-safe denial copy without secrets", () => {
    const msg = userSafeClosedBetaDenialMessage("closed_beta_publish_not_allowed");
    expect(msg.toLowerCase()).toContain("publishing");
    expect(msg).not.toMatch(/token|secret|ciphertext/i);
  });
});
