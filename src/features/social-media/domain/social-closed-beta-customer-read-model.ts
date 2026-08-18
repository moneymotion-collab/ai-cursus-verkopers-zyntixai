/**
 * Customer-safe Social closed-beta entitlement read model (informational).
 * Does not grant authority — mutations remain server/DB authoritative.
 */

import {
  canExecuteWithClosedBetaEnrollment,
  canPrepareWithClosedBetaEnrollment,
  closedBetaPrepareDenialCode,
  closedBetaPublishDenialCode,
  type SocialClosedBetaEffectiveStatus,
  userSafeClosedBetaDenialMessage,
} from "@/features/social-media/domain/closed-beta-enrollment";
import { parseSocialPublishingEnabled } from "@/features/social-media/domain/publishing";

export type SocialClosedBetaCustomerActionMatrix = {
  connectAllowed: boolean;
  prepareAllowed: boolean;
  /** Org has publishing entitlement; still requires global gate + connection checks. */
  publishingEntitlementAllowed: boolean;
  socialNavVisible: boolean;
  /** Historical Social content may be shown read-only. */
  historicalReadAllowed: boolean;
  operationalMutationsAllowed: boolean;
};

export type SocialClosedBetaCustomerReadModel = {
  enrollmentStatus: SocialClosedBetaEffectiveStatus;
  isEnrolled: boolean;
  prepareAllowed: boolean;
  connectAllowed: boolean;
  publishingEntitlementAllowed: boolean;
  globalPublishingEnabled: boolean;
  socialNavVisible: boolean;
  historicalReadAllowed: boolean;
  executeBlockedReason: string | null;
  /** Operator/internal diagnostic (may include technical phrasing). */
  diagnosticSummary: string;
  /** Customer-facing headline. */
  customerHeadline: string;
  /** Customer-facing supporting copy. */
  customerBody: string;
  /** Compact beta badge label. */
  betaBadgeLabel: string;
  nextRecommendedAction: string | null;
};

/**
 * Connect is allowed only while the org is operationally enrolled
 * (approved or publishing_allowed). Pause/revoke/absent block new connects.
 */
export function canConnectWithClosedBetaEnrollment(
  status: SocialClosedBetaEffectiveStatus | null | undefined,
): boolean {
  return status === "approved" || status === "publishing_allowed";
}

/**
 * Social primary-nav visibility for closed beta.
 * Not enrolled: hide. All persisted enrollment states: show (incl. paused/revoked
 * so customers can reach honest status and historical read-only evidence).
 */
export function isSocialNavVisibleForClosedBetaEnrollment(
  status: SocialClosedBetaEffectiveStatus | null | undefined,
): boolean {
  if (!status || status === "not_enrolled") {
    return false;
  }
  return (
    status === "approved" ||
    status === "publishing_allowed" ||
    status === "paused" ||
    status === "revoked"
  );
}

export function resolveSocialClosedBetaCustomerActionMatrix(
  status: SocialClosedBetaEffectiveStatus,
): SocialClosedBetaCustomerActionMatrix {
  const connectAllowed = canConnectWithClosedBetaEnrollment(status);
  const prepareAllowed = canPrepareWithClosedBetaEnrollment(status);
  const publishingEntitlementAllowed = canExecuteWithClosedBetaEnrollment(status);
  const socialNavVisible = isSocialNavVisibleForClosedBetaEnrollment(status);
  const historicalReadAllowed = status !== "not_enrolled";
  const operationalMutationsAllowed =
    status === "approved" || status === "publishing_allowed";

  return {
    connectAllowed,
    prepareAllowed,
    publishingEntitlementAllowed,
    socialNavVisible,
    historicalReadAllowed,
    operationalMutationsAllowed,
  };
}

function customerCopyFor(input: {
  status: SocialClosedBetaEffectiveStatus;
  globalPublishingEnabled: boolean;
}): {
  headline: string;
  body: string;
  nextRecommendedAction: string | null;
  diagnosticSummary: string;
  executeBlockedReason: string | null;
} {
  const { status, globalPublishingEnabled } = input;

  switch (status) {
    case "not_enrolled":
      return {
        headline: "Social is currently available through a limited closed beta.",
        body: "This organization is not enrolled in Social closed beta yet. Connection, content prepare, and publishing controls are unavailable.",
        nextRecommendedAction: null,
        diagnosticSummary: "Not enrolled",
        executeBlockedReason:
          "Social closed beta is not enabled for this organization.",
      };
    case "approved":
      return {
        headline: "Social Beta access approved",
        body: "You can connect Instagram and prepare image content. Publishing access has not been enabled for your organization yet.",
        nextRecommendedAction: globalPublishingEnabled
          ? "Connect Instagram if needed, then prepare content. Publishing may still require connection readiness."
          : "Connect Instagram if needed, prepare content, then wait for publishing access.",
        diagnosticSummary:
          "Approved — prepare allowed, publishing not enabled",
        executeBlockedReason:
          "Publishing access has not been enabled for your organization.",
      };
    case "publishing_allowed":
      if (!globalPublishingEnabled) {
        return {
          headline: "Publishing access approved — publishing is temporarily unavailable",
          body: "Your organization is approved for publishing, but Social publishing is temporarily unavailable at platform level. You can still connect Instagram and prepare content.",
          nextRecommendedAction:
            "Keep Instagram healthy and prepare content while publishing is temporarily unavailable.",
          diagnosticSummary:
            "Publishing allowed — platform publishing currently unavailable",
          executeBlockedReason: "Publishing is temporarily unavailable.",
        };
      }
      return {
        headline: "Publishing access approved",
        body: "Your organization may publish when Instagram connection and publication readiness checks pass.",
        nextRecommendedAction:
          "Connect a healthy Instagram account if needed, then prepare and publish intentionally.",
        diagnosticSummary:
          "Publishing allowed — subject to connection and lifecycle checks",
        executeBlockedReason: null,
      };
    case "paused":
      return {
        headline: "Social beta access is temporarily paused",
        body: "Social beta access is temporarily paused for this organization. Your existing Social data remains available. New connections, prepare, and publishing are unavailable while paused.",
        nextRecommendedAction: null,
        diagnosticSummary: "Paused",
        executeBlockedReason: "Publishing is paused for your organization.",
      };
    case "revoked":
      return {
        headline: "Social closed-beta access is no longer active",
        body: "Closed-beta access was revoked for this organization. Existing Social history may remain visible in read-only form. There is no self-service reactivation.",
        nextRecommendedAction: null,
        diagnosticSummary: "Revoked",
        executeBlockedReason:
          "Social closed beta access was revoked for this organization.",
      };
    default:
      return {
        headline: "Social closed-beta status unavailable",
        body: "Unable to determine closed-beta access for this organization.",
        nextRecommendedAction: null,
        diagnosticSummary: "Closed-beta status unavailable",
        executeBlockedReason: "Social closed beta entitlement denied.",
      };
  }
}

export function buildSocialClosedBetaCustomerReadModel(input: {
  enrollmentStatus: SocialClosedBetaEffectiveStatus;
  socialPublishingEnabled?: string | null;
}): SocialClosedBetaCustomerReadModel {
  const globalPublishingEnabled = parseSocialPublishingEnabled(
    input.socialPublishingEnabled,
  );
  const actions = resolveSocialClosedBetaCustomerActionMatrix(
    input.enrollmentStatus,
  );
  const copy = customerCopyFor({
    status: input.enrollmentStatus,
    globalPublishingEnabled,
  });

  let executeBlockedReason = copy.executeBlockedReason;
  if (
    input.enrollmentStatus === "publishing_allowed" &&
    globalPublishingEnabled
  ) {
    const denial = closedBetaPublishDenialCode(input.enrollmentStatus);
    executeBlockedReason = denial
      ? userSafeClosedBetaDenialMessage(denial)
      : null;
  }

  let diagnosticSummary = copy.diagnosticSummary;
  const prepareDenial = closedBetaPrepareDenialCode(input.enrollmentStatus);
  if (
    !actions.prepareAllowed &&
    prepareDenial &&
    input.enrollmentStatus !== "not_enrolled"
  ) {
    diagnosticSummary = userSafeClosedBetaDenialMessage(prepareDenial);
  }

  return {
    enrollmentStatus: input.enrollmentStatus,
    isEnrolled: input.enrollmentStatus !== "not_enrolled",
    prepareAllowed: actions.prepareAllowed,
    connectAllowed: actions.connectAllowed,
    publishingEntitlementAllowed: actions.publishingEntitlementAllowed,
    globalPublishingEnabled,
    socialNavVisible: actions.socialNavVisible,
    historicalReadAllowed: actions.historicalReadAllowed,
    executeBlockedReason,
    diagnosticSummary,
    customerHeadline: copy.headline,
    customerBody: copy.body,
    betaBadgeLabel: "Social — Closed Beta",
    nextRecommendedAction: copy.nextRecommendedAction,
  };
}

export type ResolveSocialNavVisibleInput = {
  explicitVisibility?: boolean;
  enrollmentStatus?: SocialClosedBetaEffectiveStatus | null;
};

/**
 * Fail-closed Social primary-nav visibility (presentation only).
 * Route authorization and mutation asserts remain authoritative.
 */
export function resolveSocialNavVisible(
  input: ResolveSocialNavVisibleInput,
): boolean {
  if (input.explicitVisibility === false) {
    return false;
  }
  if (input.explicitVisibility === true) {
    return true;
  }
  return isSocialNavVisibleForClosedBetaEnrollment(
    input.enrollmentStatus ?? "not_enrolled",
  );
}
