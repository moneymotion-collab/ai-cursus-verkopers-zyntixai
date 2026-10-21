/**
 * SMM-R1 closed-beta enrollment domain contracts.
 * Organization-level entitlement under the global SOCIAL_PUBLISHING_ENABLED kill switch.
 * Does not replace Meta access requirements.
 */

export const SOCIAL_CLOSED_BETA_ENROLLMENT_STATUSES = [
  "approved",
  "publishing_allowed",
  "paused",
  "revoked",
] as const;

export type SocialClosedBetaEnrollmentStatus =
  (typeof SOCIAL_CLOSED_BETA_ENROLLMENT_STATUSES)[number];

/** Effective UX/read model including absent enrollment. */
export type SocialClosedBetaEffectiveStatus =
  | "not_enrolled"
  | SocialClosedBetaEnrollmentStatus;

export const SOCIAL_CLOSED_BETA_ENROLLMENT_EVENT_TYPES = [
  "social_beta_enrolled_approved",
  "social_beta_publishing_allowed",
  "social_beta_paused",
  "social_beta_resumed",
  "social_beta_revoked",
] as const;

export type SocialClosedBetaEnrollmentEventType =
  (typeof SOCIAL_CLOSED_BETA_ENROLLMENT_EVENT_TYPES)[number];

export const SOCIAL_CLOSED_BETA_OPERATOR_ACTIONS = [
  "enroll_approved",
  "allow_publishing",
  "pause",
  "resume",
  "revoke",
] as const;

export type SocialClosedBetaOperatorAction =
  (typeof SOCIAL_CLOSED_BETA_OPERATOR_ACTIONS)[number];

export type SocialClosedBetaEntitlementDenialCode =
  | "closed_beta_not_enrolled"
  | "closed_beta_paused"
  | "closed_beta_revoked"
  | "closed_beta_publish_not_allowed";

export function isSocialClosedBetaEnrollmentStatus(
  value: string,
): value is SocialClosedBetaEnrollmentStatus {
  return (SOCIAL_CLOSED_BETA_ENROLLMENT_STATUSES as readonly string[]).includes(
    value,
  );
}

export function isSocialClosedBetaEffectiveStatus(
  value: string,
): value is SocialClosedBetaEffectiveStatus {
  return (
    value === "not_enrolled" || isSocialClosedBetaEnrollmentStatus(value)
  );
}

/** Prepare is allowed for approved and publishing_allowed only. */
export function canPrepareWithClosedBetaEnrollment(
  status: SocialClosedBetaEffectiveStatus | null | undefined,
): boolean {
  return status === "approved" || status === "publishing_allowed";
}

/** Provider-write entitlement only — still requires global kill switch ON. */
export function canExecuteWithClosedBetaEnrollment(
  status: SocialClosedBetaEffectiveStatus | null | undefined,
): boolean {
  return status === "publishing_allowed";
}

export function closedBetaPrepareDenialCode(
  status: SocialClosedBetaEffectiveStatus | null | undefined,
): SocialClosedBetaEntitlementDenialCode | null {
  if (status === "approved" || status === "publishing_allowed") {
    return null;
  }
  if (status === "paused") {
    return "closed_beta_paused";
  }
  if (status === "revoked") {
    return "closed_beta_revoked";
  }
  return "closed_beta_not_enrolled";
}

export function closedBetaPublishDenialCode(
  status: SocialClosedBetaEffectiveStatus | null | undefined,
): SocialClosedBetaEntitlementDenialCode | null {
  if (status === "publishing_allowed") {
    return null;
  }
  if (status === "approved") {
    return "closed_beta_publish_not_allowed";
  }
  if (status === "paused") {
    return "closed_beta_paused";
  }
  if (status === "revoked") {
    return "closed_beta_revoked";
  }
  return "closed_beta_not_enrolled";
}

export function userSafeClosedBetaDenialMessage(
  code: SocialClosedBetaEntitlementDenialCode,
): string {
  switch (code) {
    case "closed_beta_not_enrolled":
      return "Social closed beta is not enabled for this organization.";
    case "closed_beta_paused":
      return "Social closed beta is paused for this organization.";
    case "closed_beta_revoked":
      return "Social closed beta access was revoked for this organization.";
    case "closed_beta_publish_not_allowed":
      return "Closed-beta publishing is not enabled for this organization yet.";
    default:
      return "Social closed beta entitlement denied.";
  }
}

/**
 * Legal transition graph for operator mutations (R1).
 * Absent is represented as null current status.
 */
export function isLegalClosedBetaTransition(input: {
  current: SocialClosedBetaEnrollmentStatus | null;
  action: SocialClosedBetaOperatorAction;
  statusBeforePause?: "approved" | "publishing_allowed" | null;
}): boolean {
  const { current, action, statusBeforePause = null } = input;

  switch (action) {
    case "enroll_approved":
      return current === null;
    case "allow_publishing":
      return current === "approved";
    case "pause":
      return current === "approved" || current === "publishing_allowed";
    case "resume":
      return (
        current === "paused" &&
        (statusBeforePause === "approved" ||
          statusBeforePause === "publishing_allowed")
      );
    case "revoke":
      return (
        current === "approved" ||
        current === "publishing_allowed" ||
        current === "paused"
      );
    default:
      return false;
  }
}

export function nextClosedBetaStatusAfterAction(input: {
  current: SocialClosedBetaEnrollmentStatus | null;
  action: SocialClosedBetaOperatorAction;
  statusBeforePause?: "approved" | "publishing_allowed" | null;
}): SocialClosedBetaEnrollmentStatus | null {
  if (!isLegalClosedBetaTransition(input)) {
    return null;
  }
  switch (input.action) {
    case "enroll_approved":
      return "approved";
    case "allow_publishing":
      return "publishing_allowed";
    case "pause":
      return "paused";
    case "resume":
      return input.statusBeforePause ?? null;
    case "revoke":
      return "revoked";
    default:
      return null;
  }
}

/**
 * Combined provider-write gate for unit tests / app composition.
 * Does not perform Meta calls.
 */
export function evaluateSocialProviderWriteAuthorization(input: {
  socialPublishingEnabled: boolean;
  enrollmentStatus: SocialClosedBetaEffectiveStatus | null | undefined;
  isOwnerOrAdmin: boolean;
  membershipActive: boolean;
  connectionEligible: boolean;
  lifecycleClaimable: boolean;
}):
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "publishing_globally_disabled"
        | SocialClosedBetaEntitlementDenialCode
        | "authorization_failure"
        | "connection_capability_failure"
        | "lifecycle_failure";
    } {
  if (!input.socialPublishingEnabled) {
    return { allowed: false, reason: "publishing_globally_disabled" };
  }
  const entitlement = closedBetaPublishDenialCode(input.enrollmentStatus);
  if (entitlement) {
    return { allowed: false, reason: entitlement };
  }
  if (!input.membershipActive || !input.isOwnerOrAdmin) {
    return { allowed: false, reason: "authorization_failure" };
  }
  if (!input.connectionEligible) {
    return { allowed: false, reason: "connection_capability_failure" };
  }
  if (!input.lifecycleClaimable) {
    return { allowed: false, reason: "lifecycle_failure" };
  }
  return { allowed: true };
}
