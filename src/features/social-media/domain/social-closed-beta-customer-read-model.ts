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

export type SocialClosedBetaCustomerReadModel = {
  enrollmentStatus: SocialClosedBetaEffectiveStatus;
  prepareAllowed: boolean;
  publishingEntitlementAllowed: boolean;
  globalPublishingEnabled: boolean;
  executeBlockedReason: string | null;
  diagnosticSummary: string;
};

export function buildSocialClosedBetaCustomerReadModel(input: {
  enrollmentStatus: SocialClosedBetaEffectiveStatus;
  socialPublishingEnabled?: string | null;
}): SocialClosedBetaCustomerReadModel {
  const globalPublishingEnabled = parseSocialPublishingEnabled(
    input.socialPublishingEnabled,
  );
  const prepareAllowed = canPrepareWithClosedBetaEnrollment(
    input.enrollmentStatus,
  );
  const publishingEntitlementAllowed = canExecuteWithClosedBetaEnrollment(
    input.enrollmentStatus,
  );

  let executeBlockedReason: string | null = null;
  if (!globalPublishingEnabled) {
    executeBlockedReason =
      "Global Social publishing is currently OFF.";
  } else {
    const denial = closedBetaPublishDenialCode(input.enrollmentStatus);
    if (denial) {
      executeBlockedReason = userSafeClosedBetaDenialMessage(denial);
    }
  }

  let diagnosticSummary: string;
  switch (input.enrollmentStatus) {
    case "not_enrolled":
      diagnosticSummary = "Not enrolled";
      break;
    case "approved":
      diagnosticSummary =
        "Approved — prepare allowed, publishing not enabled";
      break;
    case "publishing_allowed":
      diagnosticSummary = globalPublishingEnabled
        ? "Publishing allowed — subject to connection and lifecycle checks"
        : "Publishing allowed — global kill switch currently OFF";
      break;
    case "paused":
      diagnosticSummary = "Paused";
      break;
    case "revoked":
      diagnosticSummary = "Revoked";
      break;
    default:
      diagnosticSummary = "Closed-beta status unavailable";
  }

  const prepareDenial = closedBetaPrepareDenialCode(input.enrollmentStatus);
  if (!prepareAllowed && prepareDenial && input.enrollmentStatus !== "not_enrolled") {
    diagnosticSummary = userSafeClosedBetaDenialMessage(prepareDenial);
  }

  return {
    enrollmentStatus: input.enrollmentStatus,
    prepareAllowed,
    publishingEntitlementAllowed,
    globalPublishingEnabled,
    executeBlockedReason,
    diagnosticSummary,
  };
}
