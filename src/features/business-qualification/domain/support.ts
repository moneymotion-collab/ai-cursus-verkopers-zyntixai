/**
 * Pure deterministic BQA support evaluation.
 * Exact confirmed TAX target only. No ancestor tenant fallback. No Context assignment.
 */

import { isArchitectureGapTaxonomyKey } from "./architecture-gap";
import { isReadinessEligibleForRollout } from "./rollout-policy";
import type {
  ClassificationDecision,
  ContextDiscoveryState,
  ContextReadinessStatus,
  ExistingContextPinObservation,
  QualificationProgressStatus,
  QualificationReviewStatus,
  RolloutMode,
  SupportEvaluationSnapshot,
} from "./types";

export type CatalogVersionRef = {
  id: string;
  packId: string;
  versionNumber: number;
  publicationStatus: "draft" | "published" | "superseded";
};

export type CatalogPackRef = {
  id: string;
  packKey: string;
  targetId: string;
};

export type SupportEvaluationInput = {
  requestedRollout: RolloutMode;
  answersComplete: boolean;
  progressStatus: QualificationProgressStatus;
  reviewStatus: QualificationReviewStatus;
  splitRecommended: boolean;
  currentClassification: Pick<
    ClassificationDecision,
    | "decisionId"
    | "decisionStatus"
    | "classificationOutcome"
    | "taxonomyTargetKind"
    | "taxonomyTargetId"
    | "taxonomyTargetKey"
  > | null;
  pack: CatalogPackRef | null;
  versions: readonly CatalogVersionRef[];
  readinessByVersionId: Readonly<Record<string, ContextReadinessStatus>>;
  activePin: ExistingContextPinObservation | null;
};

function emptySnapshot(
  overrides: Partial<SupportEvaluationSnapshot>,
): SupportEvaluationSnapshot {
  return {
    supportStatus: "needs_review",
    reasonCode: "review_required",
    architectureGap: false,
    classificationDecisionId: null,
    taxonomyTargetKind: null,
    taxonomyTargetId: null,
    taxonomyTargetKey: null,
    contextPackId: null,
    contextPackVersionId: null,
    contextReadiness: null,
    existingPinRemains: false,
    upgradeMayExist: false,
    observedVersionIsPin: false,
    discoveryState: null,
    ...overrides,
  };
}

function classificationFields(
  decision: SupportEvaluationInput["currentClassification"],
): Pick<
  SupportEvaluationSnapshot,
  "classificationDecisionId" | "taxonomyTargetKind" | "taxonomyTargetId" | "taxonomyTargetKey"
> {
  return {
    classificationDecisionId: decision?.decisionId ?? null,
    taxonomyTargetKind: decision?.taxonomyTargetKind ?? null,
    taxonomyTargetId: decision?.taxonomyTargetId ?? null,
    taxonomyTargetKey: decision?.taxonomyTargetKey ?? null,
  };
}

function publishedVersions(versions: readonly CatalogVersionRef[]): CatalogVersionRef[] {
  return versions
    .filter((version) => version.publicationStatus === "published")
    .slice()
    .sort((left, right) => right.versionNumber - left.versionNumber);
}

function highestVersion(versions: readonly CatalogVersionRef[]): CatalogVersionRef | null {
  return publishedVersions(versions)[0] ?? null;
}

function eligiblePublishedVersions(
  versions: readonly CatalogVersionRef[],
  readinessByVersionId: Readonly<Record<string, ContextReadinessStatus>>,
  rollout: RolloutMode,
): CatalogVersionRef[] {
  return publishedVersions(versions).filter((version) => {
    const readiness = readinessByVersionId[version.id];
    return readiness ? isReadinessEligibleForRollout(readiness, rollout) : false;
  });
}

function discoveryFromCatalog(input: {
  pack: CatalogPackRef | null;
  versions: readonly CatalogVersionRef[];
  readinessByVersionId: Readonly<Record<string, ContextReadinessStatus>>;
  rollout: RolloutMode;
}): ContextDiscoveryState {
  if (!input.pack) {
    return "no_pack";
  }
  const published = publishedVersions(input.versions);
  if (published.length === 0) {
    return "no_published_version";
  }
  if (eligiblePublishedVersions(published, input.readinessByVersionId, input.rollout).length > 0) {
    return "eligible_published_version";
  }
  return "published_readiness_insufficient";
}

export function evaluateSupport(input: SupportEvaluationInput): SupportEvaluationSnapshot {
  const classified = classificationFields(input.currentClassification);

  if (input.requestedRollout === "open_beta") {
    return emptySnapshot({
      ...classified,
      supportStatus: "needs_review",
      reasonCode: "open_beta_policy_undefined",
      contextPackId: input.pack?.id ?? null,
    });
  }

  if (!input.currentClassification) {
    return emptySnapshot({
      supportStatus: "needs_review",
      reasonCode: "review_required",
    });
  }

  const outcome = input.currentClassification.classificationOutcome;
  const confirmed = input.currentClassification.decisionStatus === "confirmed";

  if (outcome === "unknown") {
    return emptySnapshot({
      ...classified,
      supportStatus: "unknown",
      reasonCode: "classification_unknown",
    });
  }
  if (outcome === "ambiguous") {
    return emptySnapshot({
      ...classified,
      supportStatus: "needs_review",
      reasonCode: "classification_ambiguous",
    });
  }
  if (outcome === "architecture_gap") {
    return emptySnapshot({
      ...classified,
      supportStatus: "not_yet_supported",
      reasonCode: "architecture_gap",
      architectureGap: true,
    });
  }

  if (!confirmed) {
    return emptySnapshot({
      ...classified,
      supportStatus: "needs_review",
      reasonCode: "review_required",
    });
  }

  if (
    input.progressStatus === "requalifying" ||
    input.splitRecommended ||
    input.reviewStatus === "required" ||
    input.reviewStatus === "requested" ||
    !input.answersComplete
  ) {
    return emptySnapshot({
      ...classified,
      supportStatus: "needs_review",
      reasonCode: "review_required",
    });
  }

  if (isArchitectureGapTaxonomyKey(input.currentClassification.taxonomyTargetKey)) {
    return emptySnapshot({
      ...classified,
      supportStatus: "not_yet_supported",
      reasonCode: "architecture_gap",
      architectureGap: true,
      contextPackId: input.pack?.id ?? null,
    });
  }

  const discovery = discoveryFromCatalog({
    pack: input.pack,
    versions: input.versions,
    readinessByVersionId: input.readinessByVersionId,
    rollout: input.requestedRollout,
  });

  if (discovery === "no_pack") {
    return emptySnapshot({
      ...classified,
      supportStatus: "not_yet_supported",
      reasonCode: "missing_context_pack",
      discoveryState: discovery,
    });
  }

  const packId = input.pack?.id ?? null;
  const pinVersion = input.activePin
    ? input.versions.find((version) => version.id === input.activePin?.contextPackVersionId) ?? null
    : null;
  const existingPinRemains = Boolean(input.activePin);
  const eligible = eligiblePublishedVersions(
    input.versions,
    input.readinessByVersionId,
    input.requestedRollout,
  );
  const highestEligible = eligible[0] ?? null;
  const upgradeMayExist = Boolean(
    pinVersion &&
      highestEligible &&
      highestEligible.versionNumber > pinVersion.versionNumber,
  );

  if (input.activePin) {
    const pinReadiness = pinVersion
      ? input.readinessByVersionId[pinVersion.id] ?? null
      : null;
    const observedVersionIsPin = Boolean(pinVersion);
    if (!pinVersion || pinVersion.publicationStatus !== "published") {
      return emptySnapshot({
        ...classified,
        supportStatus: "not_yet_supported",
        reasonCode: "no_published_context_version",
        contextPackId: packId,
        contextPackVersionId: input.activePin.contextPackVersionId,
        contextReadiness: pinReadiness,
        existingPinRemains: true,
        upgradeMayExist,
        observedVersionIsPin,
        discoveryState: "no_published_version",
      });
    }
    if (!pinReadiness || !isReadinessEligibleForRollout(pinReadiness, input.requestedRollout)) {
      return emptySnapshot({
        ...classified,
        supportStatus: "not_yet_supported",
        reasonCode: "context_readiness_insufficient",
        contextPackId: packId,
        contextPackVersionId: pinVersion.id,
        contextReadiness: pinReadiness,
        existingPinRemains: true,
        upgradeMayExist,
        observedVersionIsPin: true,
        discoveryState: "published_readiness_insufficient",
      });
    }
    return emptySnapshot({
      ...classified,
      supportStatus: "supported_for_requested_rollout",
      reasonCode: "eligible",
      contextPackId: packId,
      contextPackVersionId: pinVersion.id,
      contextReadiness: pinReadiness,
      existingPinRemains: true,
      upgradeMayExist,
      observedVersionIsPin: true,
      discoveryState: "eligible_published_version",
    });
  }

  if (discovery === "no_published_version") {
    return emptySnapshot({
      ...classified,
      supportStatus: "not_yet_supported",
      reasonCode: "no_published_context_version",
      contextPackId: packId,
      existingPinRemains: false,
      discoveryState: discovery,
    });
  }

  if (discovery === "published_readiness_insufficient") {
    const observed = highestVersion(input.versions);
    return emptySnapshot({
      ...classified,
      supportStatus: "not_yet_supported",
      reasonCode: "context_readiness_insufficient",
      contextPackId: packId,
      contextPackVersionId: observed?.id ?? null,
      contextReadiness: observed ? input.readinessByVersionId[observed.id] ?? null : null,
      existingPinRemains,
      discoveryState: discovery,
    });
  }

  const selected = highestEligible;
  const selectedReadiness = selected
    ? input.readinessByVersionId[selected.id] ?? null
    : null;
  return emptySnapshot({
    ...classified,
    supportStatus: "supported_for_requested_rollout",
    reasonCode: "eligible",
    contextPackId: packId,
    contextPackVersionId: selected?.id ?? null,
    contextReadiness: selectedReadiness,
    existingPinRemains: false,
    upgradeMayExist: false,
    observedVersionIsPin: false,
    discoveryState: "eligible_published_version",
  });
}

export function sameSupportSnapshot(
  current: Pick<
    SupportEvaluationSnapshot,
    | "supportStatus"
    | "reasonCode"
    | "architectureGap"
    | "classificationDecisionId"
    | "contextPackId"
    | "contextPackVersionId"
    | "contextReadiness"
  >,
  next: SupportEvaluationSnapshot,
  rolloutMatches: boolean,
): boolean {
  return (
    rolloutMatches &&
    current.supportStatus === next.supportStatus &&
    current.reasonCode === next.reasonCode &&
    current.architectureGap === next.architectureGap &&
    current.classificationDecisionId === next.classificationDecisionId &&
    current.contextPackId === next.contextPackId &&
    current.contextPackVersionId === next.contextPackVersionId &&
    current.contextReadiness === next.contextReadiness
  );
}

export function demandWaitlistEligible(snapshot: Pick<SupportEvaluationSnapshot, "supportStatus">): boolean {
  return snapshot.supportStatus === "not_yet_supported";
}
