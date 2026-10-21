/**
 * Deterministic qualification workflow derivation.
 * Completeness is not support, admission, or Context assignment.
 */

import { evaluateRequiredAnswers } from "./questions";
import type {
  ClassificationConfidenceBand,
  ClassificationDecision,
  ClassificationOutcome,
  QualificationProgressStatus,
  QualificationReviewStatus,
} from "./types";

export type ProgressDerivationInput = {
  answers: ReadonlyArray<{ questionKey: string; valueCode: string | null }>;
  splitRecommended: boolean;
  reviewStatus: QualificationReviewStatus;
  currentProgress: QualificationProgressStatus;
  currentClassification: Pick<
    ClassificationDecision,
    "decisionStatus" | "classificationOutcome" | "confidenceBand" | "unresolvedDimensionCodes"
  > | null;
};

export function deriveProgressStatus(input: ProgressDerivationInput): QualificationProgressStatus {
  if (input.currentProgress === "requalifying") {
    return "requalifying";
  }
  if (
    input.currentClassification?.decisionStatus === "confirmed" &&
    input.currentProgress === "confirmed"
  ) {
    return "confirmed";
  }

  const completeness = evaluateRequiredAnswers(input.answers);
  if (!completeness.requiredComplete) {
    return input.answers.length === 0 ? "unstarted" : "collecting";
  }

  if (
    input.reviewStatus === "required" ||
    input.reviewStatus === "requested" ||
    input.currentProgress === "needs_review"
  ) {
    return "needs_review";
  }

  const proposed = input.currentClassification?.decisionStatus === "proposed"
    ? input.currentClassification
    : null;
  if (!proposed) {
    return "collecting";
  }
  if (canAwaitConfirmation(proposed, input.splitRecommended)) {
    return "awaiting_confirmation";
  }
  if (requiresReview(proposed.classificationOutcome, proposed.confidenceBand, proposed.unresolvedDimensionCodes)) {
    return "needs_review";
  }
  return "collecting";
}

export function canAwaitConfirmation(
  decision: {
    classificationOutcome: ClassificationOutcome;
    confidenceBand: ClassificationConfidenceBand;
    unresolvedDimensionCodes: readonly string[];
  },
  splitRecommended: boolean,
): boolean {
  return (
    !splitRecommended &&
    decision.classificationOutcome === "classified" &&
    decision.confidenceBand === "high" &&
    decision.unresolvedDimensionCodes.length === 0
  );
}

export function requiresReview(
  outcome: ClassificationOutcome,
  confidence: ClassificationConfidenceBand,
  unresolvedDimensionCodes: readonly string[],
): boolean {
  if (outcome === "ambiguous" || outcome === "unknown" || outcome === "architecture_gap") {
    return true;
  }
  if (confidence === "low" || confidence === "none") {
    return true;
  }
  if (confidence === "medium" && unresolvedDimensionCodes.length > 0) {
    return true;
  }
  return confidence === "medium";
}
