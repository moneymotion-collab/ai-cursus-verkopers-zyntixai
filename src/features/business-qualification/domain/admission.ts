/**
 * Pure deterministic BQA admission evaluation.
 * Admission is not identity, entitlement, Context assignment, or Path B.
 */

import type {
  AdmissionEvaluationSnapshot,
  ClassificationDecision,
  QualificationProgressStatus,
  QualificationReviewStatus,
  RolloutMode,
  SupportAssessment,
} from "./types";

export type AdmissionEvaluationInput = {
  requestedRollout: RolloutMode;
  answersComplete: boolean;
  progressStatus: QualificationProgressStatus;
  reviewStatus: QualificationReviewStatus;
  splitRecommended: boolean;
  currentClassification: Pick<
    ClassificationDecision,
    "decisionId" | "decisionStatus" | "classificationOutcome"
  > | null;
  support: Pick<
    SupportAssessment,
    | "assessmentId"
    | "classificationDecisionId"
    | "rolloutMode"
    | "supportStatus"
    | "reasonCode"
    | "supersededAt"
  >;
  activeDemand: boolean;
};

export function evaluateAdmission(
  input: AdmissionEvaluationInput,
): AdmissionEvaluationSnapshot {
  const supportAssessmentId = input.support.assessmentId;
  const rolloutMode = input.requestedRollout;

  if (input.requestedRollout === "open_beta" || input.support.reasonCode === "open_beta_policy_undefined") {
    return {
      admissionStatus: "blocked",
      reasonCode: "blocked_policy",
      supportAssessmentId,
      rolloutMode,
    };
  }

  if (!input.answersComplete) {
    return {
      admissionStatus: "incomplete",
      reasonCode: "incomplete_answers",
      supportAssessmentId,
      rolloutMode,
    };
  }

  if (
    !input.currentClassification ||
    input.currentClassification.decisionStatus !== "confirmed" ||
    input.progressStatus === "requalifying"
  ) {
    return {
      admissionStatus: "incomplete",
      reasonCode: "confirmation_required",
      supportAssessmentId,
      rolloutMode,
    };
  }

  if (
    input.splitRecommended ||
    input.reviewStatus === "required" ||
    input.reviewStatus === "requested" ||
    input.support.supportStatus === "needs_review" ||
    input.support.reasonCode === "review_required" ||
    input.support.reasonCode === "classification_ambiguous" ||
    input.support.reasonCode === "architecture_gap"
  ) {
    return {
      admissionStatus: "needs_review",
      reasonCode: "review_required",
      supportAssessmentId,
      rolloutMode,
    };
  }

  if (
    input.support.supportStatus === "unknown" ||
    input.support.reasonCode === "classification_unknown"
  ) {
    return {
      admissionStatus: "needs_review",
      reasonCode: "review_required",
      supportAssessmentId,
      rolloutMode,
    };
  }

  if (input.support.supportStatus === "unsupported") {
    return {
      admissionStatus: "unsupported",
      reasonCode: "unsupported",
      supportAssessmentId,
      rolloutMode,
    };
  }

  if (input.support.supportStatus === "not_yet_supported") {
    if (input.activeDemand) {
      return {
        admissionStatus: "waitlisted",
        reasonCode: "waitlisted_not_eligible",
        supportAssessmentId,
        rolloutMode,
      };
    }
    return {
      admissionStatus: "not_yet_supported",
      reasonCode: "not_yet_supported",
      supportAssessmentId,
      rolloutMode,
    };
  }

  if (
    input.support.supportStatus === "supported_for_requested_rollout" &&
    input.support.reasonCode === "eligible" &&
    input.progressStatus === "confirmed" &&
    input.currentClassification.classificationOutcome === "classified"
  ) {
    return {
      admissionStatus: "admitted",
      reasonCode: "eligible",
      supportAssessmentId,
      rolloutMode,
    };
  }

  return {
    admissionStatus: "blocked",
    reasonCode: "blocked_integrity",
    supportAssessmentId,
    rolloutMode,
  };
}

export function sameAdmissionSnapshot(
  current: Pick<AdmissionEvaluationSnapshot, "admissionStatus" | "reasonCode" | "supportAssessmentId" | "rolloutMode">,
  next: AdmissionEvaluationSnapshot,
): boolean {
  return (
    current.admissionStatus === next.admissionStatus &&
    current.reasonCode === next.reasonCode &&
    current.supportAssessmentId === next.supportAssessmentId &&
    current.rolloutMode === next.rolloutMode
  );
}

export function supportAssessmentMatchesAdmissionGate(input: {
  support: Pick<SupportAssessment, "classificationDecisionId" | "rolloutMode" | "supersededAt">;
  requestedRollout: RolloutMode;
  currentClassificationDecisionId: string | null;
}): boolean {
  return (
    input.support.supersededAt === null &&
    input.support.rolloutMode === input.requestedRollout &&
    input.support.classificationDecisionId === input.currentClassificationDecisionId
  );
}
