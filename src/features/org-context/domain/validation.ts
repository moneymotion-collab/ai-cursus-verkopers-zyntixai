/**
 * Pure ORG-CONTEXT validation helpers.
 * Database constraints remain the structural floor.
 */

import type { ContextReadinessStatus } from "@/features/control-plane/domain/types";
import {
  orgContextFail,
  orgContextOk,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";
import type {
  OrgContextAssignmentMode,
  TaxonomyClassificationKind,
  TaxonomyClassificationRef,
} from "@/features/org-context/domain/types";

export const ACTIVITY_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
export const ACTIVITY_KEY_MIN_LENGTH = 2;
export const ACTIVITY_KEY_MAX_LENGTH = 64;
export const DISPLAY_NAME_MIN_LENGTH = 2;
export const DISPLAY_NAME_MAX_LENGTH = 100;

export const ORG_CONTEXT_ASSIGNMENT_MODE_INTERNAL_QA: OrgContextAssignmentMode =
  "internal_qa";

const INTERNAL_QA_ALLOWED_READINESS: ReadonlySet<ContextReadinessStatus> =
  new Set(["context_ready", "beta_supported", "production_verified"]);

const CLASSIFICATION_KINDS: ReadonlySet<TaxonomyClassificationKind> = new Set([
  "foundation",
  "industry",
  "niche",
  "specialization",
  "deep_specialization",
]);

export function isTaxonomyClassificationKind(
  value: string | null | undefined,
): value is TaxonomyClassificationKind {
  return (
    typeof value === "string" &&
    CLASSIFICATION_KINDS.has(value as TaxonomyClassificationKind)
  );
}

export function normalizeDisplayName(
  displayName: string,
): OrgContextResult<string> {
  const normalized = displayName.trim();
  if (
    normalized.length < DISPLAY_NAME_MIN_LENGTH ||
    normalized.length > DISPLAY_NAME_MAX_LENGTH
  ) {
    return orgContextFail(
      "MUTATION_FAILED",
      "Business Activity display name must be 2 to 100 characters",
    );
  }
  return orgContextOk(normalized);
}

export function assertActivityKeyGrammar(
  activityKey: string,
): OrgContextResult<string> {
  if (
    activityKey.length < ACTIVITY_KEY_MIN_LENGTH ||
    activityKey.length > ACTIVITY_KEY_MAX_LENGTH ||
    activityKey !== activityKey.toLowerCase() ||
    !ACTIVITY_KEY_PATTERN.test(activityKey)
  ) {
    return orgContextFail(
      "MUTATION_FAILED",
      "activity_key must be 2-64 lowercase characters matching [a-z][a-z0-9_]*",
      { activityKey },
    );
  }
  return orgContextOk(activityKey);
}

export function slugifyActivityKey(displayName: string): string {
  let slug = displayName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
  if (!slug) {
    slug = "activity";
  }
  if (!/^[a-z]/.test(slug)) {
    slug = `a_${slug}`;
  }
  if (slug.length < ACTIVITY_KEY_MIN_LENGTH) {
    slug = `${slug}x`;
  }
  if (slug.length > ACTIVITY_KEY_MAX_LENGTH) {
    slug = slug.slice(0, ACTIVITY_KEY_MAX_LENGTH).replace(/_+$/g, "");
    if (slug.length < ACTIVITY_KEY_MIN_LENGTH || !/^[a-z]/.test(slug)) {
      slug = "activity";
    }
  }
  return slug;
}

export function allocateActivityKey(
  preferredKey: string,
  existingKeys: ReadonlySet<string>,
): OrgContextResult<string> {
  const grammar = assertActivityKeyGrammar(preferredKey);
  if (!grammar.ok) {
    return grammar;
  }
  if (!existingKeys.has(grammar.value)) {
    return orgContextOk(grammar.value);
  }
  for (let n = 2; n < 10_000; n += 1) {
    const suffix = `_${n}`;
    const maxBase = ACTIVITY_KEY_MAX_LENGTH - suffix.length;
    let base = grammar.value.slice(0, Math.max(ACTIVITY_KEY_MIN_LENGTH, maxBase));
    base = base.replace(/_+$/g, "");
    if (base.length < 1) {
      base = "activity";
    }
    if (!/^[a-z]/.test(base)) {
      base = `a_${base}`;
    }
    const candidate = `${base}${suffix}`.slice(0, ACTIVITY_KEY_MAX_LENGTH);
    const candidateGrammar = assertActivityKeyGrammar(candidate);
    if (candidateGrammar.ok && !existingKeys.has(candidateGrammar.value)) {
      return orgContextOk(candidateGrammar.value);
    }
  }
  return orgContextFail(
    "MUTATION_FAILED",
    "Could not allocate a unique activity_key within the Organization",
  );
}

export function classificationTargetColumn(
  kind: TaxonomyClassificationKind,
):
  | "foundationId"
  | "industryId"
  | "nicheId"
  | "specializationId"
  | "deepSpecializationId" {
  if (kind === "foundation") return "foundationId";
  if (kind === "industry") return "industryId";
  if (kind === "niche") return "nicheId";
  if (kind === "specialization") return "specializationId";
  return "deepSpecializationId";
}

export function classificationFromXor(input: {
  classificationKind: string | null;
  foundationId: string | null;
  industryId: string | null;
  nicheId: string | null;
  specializationId: string | null;
  deepSpecializationId: string | null;
}): OrgContextResult<TaxonomyClassificationRef | null> {
  const populated = [
    { kind: "foundation" as const, id: input.foundationId },
    { kind: "industry" as const, id: input.industryId },
    { kind: "niche" as const, id: input.nicheId },
    { kind: "specialization" as const, id: input.specializationId },
    { kind: "deep_specialization" as const, id: input.deepSpecializationId },
  ].filter((entry) => entry.id);
  if (!input.classificationKind) {
    if (populated.length > 0) {
      return orgContextFail(
        "CATALOG_INTEGRITY_ERROR",
        "Unclassified activity has a taxonomy target",
      );
    }
    return orgContextOk(null);
  }
  if (!isTaxonomyClassificationKind(input.classificationKind)) {
    return orgContextFail(
      "CATALOG_INTEGRITY_ERROR",
      "Unknown classification kind",
      { classificationKind: input.classificationKind },
    );
  }
  if (populated.length !== 1 || populated[0].kind !== input.classificationKind) {
    return orgContextFail(
      "CATALOG_INTEGRITY_ERROR",
      "Classification kind/target XOR is invalid",
      { classificationKind: input.classificationKind, count: populated.length },
    );
  }
  const targetId = populated[0].id;
  if (!targetId) {
    return orgContextFail(
      "CATALOG_INTEGRITY_ERROR",
      "Classification target id is missing",
    );
  }
  return orgContextOk({
    kind: input.classificationKind,
    targetId,
  });
}

export function isExactTaxContextCompatible(input: {
  classification: TaxonomyClassificationRef | null;
  packKind: TaxonomyClassificationKind;
  packTargetId: string;
}): boolean {
  return (
    input.classification !== null &&
    input.classification.kind === input.packKind &&
    input.classification.targetId === input.packTargetId
  );
}

export function assertInternalQaReadiness(
  mode: OrgContextAssignmentMode,
  readinessStatus: ContextReadinessStatus | null | undefined,
): OrgContextResult<ContextReadinessStatus> {
  if (mode !== ORG_CONTEXT_ASSIGNMENT_MODE_INTERNAL_QA) {
    return orgContextFail(
      "CONTEXT_VERSION_NOT_ASSIGNABLE",
      "Unsupported ORG-CONTEXT assignment mode",
      { mode },
    );
  }
  if (!readinessStatus) {
    return orgContextFail(
      "CONTEXT_VERSION_NOT_ASSIGNABLE",
      "Context pack readiness is missing",
    );
  }
  if (!INTERNAL_QA_ALLOWED_READINESS.has(readinessStatus)) {
    return orgContextFail(
      "CONTEXT_VERSION_NOT_ASSIGNABLE",
      "internal_qa cannot assign a planned or unknown readiness Context version",
      { readinessStatus },
    );
  }
  return orgContextOk(readinessStatus);
}

export function assertClassifiedForActive(input: {
  status: "draft" | "active" | "archived";
  classification: TaxonomyClassificationRef | null;
  isPrimary: boolean;
}): OrgContextResult<true> {
  if (input.status === "active" && !input.classification) {
    return orgContextFail(
      "MUTATION_FAILED",
      "Active Business Activity must be classified",
    );
  }
  if (input.isPrimary && input.status !== "active") {
    return orgContextFail(
      "PRIMARY_ACTIVITY_CONFLICT",
      "Primary Business Activity must be active",
      { status: input.status },
    );
  }
  return orgContextOk(true);
}
