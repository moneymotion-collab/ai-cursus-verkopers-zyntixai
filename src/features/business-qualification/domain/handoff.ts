/**
 * Pure BQA assignment-handoff gates.
 * Persisted admission is historical evidence, not a bearer token.
 */

import type { BqaErrorCode } from "./errors";
import { isReadinessEligibleForRollout } from "./rollout-policy";
import type {
  AdmissionDecision,
  ClassificationDecision,
  ContextReadinessStatus,
  QualificationProgressStatus,
  QualificationReviewStatus,
  RolloutMode,
  SupportAssessment,
} from "./types";

export function handoffDenialForOpenBeta(rollout: RolloutMode): BqaErrorCode | null {
  return rollout === "open_beta" ? "ROLLOUT_POLICY_UNDEFINED" : null;
}

export function handoffDenialForAdmission(
  admission: Pick<
    AdmissionDecision,
    "rolloutMode" | "admissionStatus" | "reasonCode" | "organizationId" | "businessActivityId" | "qualificationId"
  >,
  input: {
    organizationId: string;
    businessActivityId: string;
    qualificationId: string;
    rolloutMode: RolloutMode;
  },
): BqaErrorCode | null {
  if (
    admission.organizationId !== input.organizationId ||
    admission.businessActivityId !== input.businessActivityId ||
    admission.qualificationId !== input.qualificationId
  ) {
    return "ADMISSION_NOT_FOUND";
  }
  if (admission.rolloutMode !== input.rolloutMode) {
    return "ROLLOUT_MISMATCH";
  }
  if (admission.admissionStatus !== "admitted" || admission.reasonCode !== "eligible") {
    return "ADMISSION_NOT_ELIGIBLE";
  }
  return null;
}

export function handoffDenialForSupport(
  support: Pick<
    SupportAssessment,
    | "organizationId"
    | "businessActivityId"
    | "qualificationId"
    | "rolloutMode"
    | "supportStatus"
    | "reasonCode"
    | "classificationDecisionId"
    | "contextPackId"
    | "contextPackVersionId"
    | "supersededAt"
  >,
  input: {
    organizationId: string;
    businessActivityId: string;
    qualificationId: string;
    rolloutMode: RolloutMode;
  },
): BqaErrorCode | null {
  if (
    support.organizationId !== input.organizationId ||
    support.businessActivityId !== input.businessActivityId ||
    support.qualificationId !== input.qualificationId ||
    support.supersededAt !== null
  ) {
    return "SUPPORT_ASSESSMENT_NOT_READY";
  }
  if (support.rolloutMode !== input.rolloutMode) {
    return "ROLLOUT_MISMATCH";
  }
  if (
    support.supportStatus !== "supported_for_requested_rollout" ||
    support.reasonCode !== "eligible" ||
    !support.classificationDecisionId ||
    !support.contextPackId ||
    !support.contextPackVersionId
  ) {
    return "SUPPORT_ASSESSMENT_NOT_READY";
  }
  return null;
}

export function handoffDenialForQualification(input: {
  progressStatus: QualificationProgressStatus;
  reviewStatus: QualificationReviewStatus;
  splitRecommended: boolean;
}): BqaErrorCode | null {
  if (input.progressStatus === "requalifying") {
    return "REQUALIFICATION_REQUIRED";
  }
  if (input.reviewStatus === "required" || input.reviewStatus === "requested") {
    return "CLASSIFICATION_REVIEW_REQUIRED";
  }
  if (input.splitRecommended || input.progressStatus !== "confirmed") {
    return "CLASSIFICATION_NOT_CONFIRMED";
  }
  return null;
}

export function handoffDenialForClassification(
  current: Pick<
    ClassificationDecision,
    "decisionId" | "decisionStatus" | "classificationOutcome" | "taxonomyTargetKind" | "taxonomyTargetId"
  > | null,
  linkedDecisionId: string | null,
): BqaErrorCode | null {
  if (!current || current.decisionStatus !== "confirmed") {
    return "CLASSIFICATION_NOT_CONFIRMED";
  }
  if (current.decisionId !== linkedDecisionId) {
    return "ADMISSION_STALE";
  }
  if (
    current.classificationOutcome !== "classified" ||
    !current.taxonomyTargetKind ||
    !current.taxonomyTargetId
  ) {
    return "CLASSIFICATION_NOT_CONFIRMED";
  }
  return null;
}

export function handoffDenialForCurrentReadiness(
  readiness: ContextReadinessStatus,
  rollout: RolloutMode,
): BqaErrorCode | null {
  if (!isReadinessEligibleForRollout(readiness, rollout)) {
    return "CONTEXT_READINESS_NO_LONGER_ELIGIBLE";
  }
  return null;
}

export function handoffDenialForActivityTax(input: {
  activityKind: string | null;
  activityTargetId: string | null;
  confirmedKind: string;
  confirmedTargetId: string;
}): BqaErrorCode | null {
  if (!input.activityKind || !input.activityTargetId) {
    return null;
  }
  if (
    input.activityKind !== input.confirmedKind ||
    input.activityTargetId !== input.confirmedTargetId
  ) {
    return "ACTIVITY_CLASSIFICATION_MISMATCH";
  }
  return null;
}
