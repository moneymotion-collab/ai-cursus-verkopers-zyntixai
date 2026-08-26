/**
 * Pure classification confirmation / review / split gates.
 * No TAX lookup. No Activity mutation.
 */

import { bqaFail, bqaOk, type BqaResult } from "./errors";
import { canAwaitConfirmation, requiresReview } from "./progress";
import type {
  ClassificationConfidenceBand,
  ClassificationDecision,
  ClassificationOutcome,
  TaxonomyTargetKind,
} from "./types";

export const CONFIDENCE_BANDS = ["high", "medium", "low", "none"] as const;
export const CLASSIFICATION_OUTCOMES = [
  "classified",
  "ambiguous",
  "unknown",
  "architecture_gap",
] as const;
export const TAXONOMY_TARGET_KINDS = [
  "foundation",
  "industry",
  "niche",
  "specialization",
  "deep_specialization",
] as const;
export const MAX_ALTERNATIVE_TARGETS = 8;
export const MAX_UNRESOLVED_DIMENSIONS = 16;

const FORBIDDEN_EVIDENCE_KEYS = [
  "chain_of_thought",
  "prompt",
  "reasoning",
  "raw_model_output",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBqaUuid(value: string): boolean {
  return UUID_PATTERN.test(value.trim());
}

export function isConfidenceBand(value: string): value is ClassificationConfidenceBand {
  return (CONFIDENCE_BANDS as readonly string[]).includes(value);
}

export function isClassificationOutcome(value: string): value is ClassificationOutcome {
  return (CLASSIFICATION_OUTCOMES as readonly string[]).includes(value);
}

export function isTaxonomyTargetKind(value: string): value is TaxonomyTargetKind {
  return (TAXONOMY_TARGET_KINDS as readonly string[]).includes(value);
}

export function sanitizeEvidenceSnapshot(
  value: Readonly<Record<string, unknown>> | null | undefined,
): BqaResult<Readonly<Record<string, unknown>>> {
  const snapshot = value ?? {};
  for (const key of FORBIDDEN_EVIDENCE_KEYS) {
    if (key in snapshot) {
      return bqaFail(
        "INVALID_ANSWER",
        "Classification evidence must not include model internals",
      );
    }
  }
  return bqaOk(snapshot);
}

export function boundedUuidList(
  values: readonly string[] | null | undefined,
  max: number,
): BqaResult<readonly string[]> {
  const list = values ?? [];
  if (list.length > max) {
    return bqaFail("INVALID_ANSWER", "Too many alternative taxonomy targets");
  }
  for (const id of list) {
    if (!isBqaUuid(id)) {
      return bqaFail("INVALID_ANSWER", "Alternative taxonomy target ids must be UUIDs");
    }
  }
  return bqaOk(list);
}

export function confirmationBlock(input: {
  requiredAnswersComplete: boolean;
  splitRecommended: boolean;
  reviewStatus: "none" | "required" | "requested" | "resolved_proceed" | "resolved_reject";
  decision: Pick<
    ClassificationDecision,
    "decisionStatus" | "classificationOutcome" | "confidenceBand" | "unresolvedDimensionCodes" | "taxonomyTargetId"
  > | null;
}): BqaResult<true> {
  if (!input.requiredAnswersComplete) {
    return bqaFail(
      "CLASSIFICATION_NOT_READY",
      "Required qualification answers are incomplete",
    );
  }
  if (input.splitRecommended) {
    return bqaFail(
      "CLASSIFICATION_REVIEW_REQUIRED",
      "Unresolved hybrid split must not be confirmed on this Activity",
    );
  }
  if (input.reviewStatus === "required" || input.reviewStatus === "requested") {
    return bqaFail(
      "CLASSIFICATION_REVIEW_REQUIRED",
      "Classification is waiting for review",
    );
  }
  if (!input.decision || input.decision.decisionStatus !== "proposed") {
    return bqaFail(
      "CLASSIFICATION_NOT_READY",
      "A confirmable classification proposal is required",
    );
  }
  if (input.decision.classificationOutcome === "ambiguous") {
    return bqaFail("CLASSIFICATION_AMBIGUOUS", "Ambiguous classification cannot be confirmed");
  }
  if (input.decision.classificationOutcome === "unknown") {
    return bqaFail("CLASSIFICATION_UNKNOWN", "Unknown classification cannot be confirmed");
  }
  if (input.decision.classificationOutcome === "architecture_gap") {
    return bqaFail(
      "CLASSIFICATION_REVIEW_REQUIRED",
      "Architecture-gap classification cannot be confirmed",
    );
  }
  if (
    requiresReview(
      input.decision.classificationOutcome,
      input.decision.confidenceBand,
      input.decision.unresolvedDimensionCodes,
    )
  ) {
    return bqaFail(
      "CLASSIFICATION_REVIEW_REQUIRED",
      "Confidence or unresolved dimensions require review before confirmation",
    );
  }
  if (
    !canAwaitConfirmation(
      {
        classificationOutcome: input.decision.classificationOutcome,
        confidenceBand: input.decision.confidenceBand,
        unresolvedDimensionCodes: input.decision.unresolvedDimensionCodes,
      },
      false,
    )
  ) {
    return bqaFail("CLASSIFICATION_NOT_READY", "Classification is not eligible for confirmation");
  }
  if (!input.decision.taxonomyTargetId) {
    return bqaFail("CLASSIFICATION_NOT_READY", "Confirmed classification requires a TAX target");
  }
  return bqaOk(true);
}

export function sameConfirmedTarget(input: {
  current: Pick<ClassificationDecision, "taxonomyTargetId" | "taxonomyReleaseId" | "decisionStatus"> | null;
  taxonomyTargetId: string;
  taxonomyReleaseId: string;
}): boolean {
  return (
    input.current?.decisionStatus === "confirmed" &&
    input.current.taxonomyTargetId === input.taxonomyTargetId &&
    input.current.taxonomyReleaseId === input.taxonomyReleaseId
  );
}
