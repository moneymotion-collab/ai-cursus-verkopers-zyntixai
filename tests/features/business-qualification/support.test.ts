import { describe, expect, it } from "vitest";
import { evaluateSupport } from "@/features/business-qualification/domain/support";
import type { SupportEvaluationInput } from "@/features/business-qualification/domain/support";

const PACK = { id: "pack-ocb", packKey: "niche.online-course-business", targetId: "tax-ocb" };
const V1 = { id: "ver-1", packId: "pack-ocb", versionNumber: 1, publicationStatus: "published" as const };
const V2 = { id: "ver-2", packId: "pack-ocb", versionNumber: 2, publicationStatus: "published" as const };
const DRAFT = { id: "ver-draft", packId: "pack-ocb", versionNumber: 3, publicationStatus: "draft" as const };

const confirmed = {
  decisionId: "dec-1",
  decisionStatus: "confirmed" as const,
  classificationOutcome: "classified" as const,
  taxonomyTargetKind: "niche" as const,
  taxonomyTargetId: "tax-ocb",
  taxonomyTargetKey: "online-course-business",
};

function base(overrides: Partial<SupportEvaluationInput> = {}): SupportEvaluationInput {
  return {
    requestedRollout: "internal_qa",
    answersComplete: true,
    progressStatus: "confirmed",
    reviewStatus: "none",
    splitRecommended: false,
    currentClassification: confirmed,
    pack: PACK,
    versions: [V1],
    readinessByVersionId: { "ver-1": "context_ready" },
    activePin: null,
    ...overrides,
  };
}

describe("BQA-1E support evaluation", () => {
  it("supports confirmed OCB context_ready for internal_qa and selects the exact published version", () => {
    const result = evaluateSupport(base());
    expect(result.supportStatus).toBe("supported_for_requested_rollout");
    expect(result.reasonCode).toBe("eligible");
    expect(result.contextPackVersionId).toBe("ver-1");
    expect(result.contextReadiness).toBe("context_ready");
    expect(result.existingPinRemains).toBe(false);
  });

  it("does not treat an existing exact pin as Closed Beta eligibility", () => {
    const result = evaluateSupport(
      base({
        requestedRollout: "closed_beta",
        activePin: { assignmentId: "asg-1", contextPackVersionId: "ver-1" },
      }),
    );
    expect(result.supportStatus).toBe("not_yet_supported");
    expect(result.reasonCode).toBe("context_readiness_insufficient");
    expect(result.existingPinRemains).toBe(true);
    expect(result.observedVersionIsPin).toBe(true);
    expect(result.contextPackVersionId).toBe("ver-1");
  });

  it("keeps the existing pin and only reports a newer eligible upgrade", () => {
    const result = evaluateSupport(
      base({
        requestedRollout: "internal_qa",
        versions: [V1, V2],
        readinessByVersionId: { "ver-1": "context_ready", "ver-2": "beta_supported" },
        activePin: { assignmentId: "asg-1", contextPackVersionId: "ver-1" },
      }),
    );
    expect(result.supportStatus).toBe("supported_for_requested_rollout");
    expect(result.contextPackVersionId).toBe("ver-1");
    expect(result.upgradeMayExist).toBe(true);
    expect(result.existingPinRemains).toBe(true);
  });

  it("selects the highest eligible published version when no pin exists", () => {
    const result = evaluateSupport(
      base({
        requestedRollout: "closed_beta",
        versions: [V1, V2],
        readinessByVersionId: { "ver-1": "context_ready", "ver-2": "beta_supported" },
      }),
    );
    expect(result.supportStatus).toBe("supported_for_requested_rollout");
    expect(result.contextPackVersionId).toBe("ver-2");
    expect(result.contextReadiness).toBe("beta_supported");
  });

  it("does not use a draft version", () => {
    const result = evaluateSupport(
      base({
        versions: [DRAFT],
        readinessByVersionId: { "ver-draft": "production_verified" },
      }),
    );
    expect(result.supportStatus).toBe("not_yet_supported");
    expect(result.reasonCode).toBe("no_published_context_version");
    expect(result.contextPackVersionId).toBeNull();
  });

  it("records missing pack without assigning a parent Context", () => {
    const result = evaluateSupport(base({ pack: null, versions: [], readinessByVersionId: {} }));
    expect(result.supportStatus).toBe("not_yet_supported");
    expect(result.reasonCode).toBe("missing_context_pack");
    expect(result.contextPackId).toBeNull();
    expect(result.contextPackVersionId).toBeNull();
  });

  it("marks manufacturing as an architecture gap instead of a missing-pack waitlist", () => {
    const result = evaluateSupport(
      base({
        currentClassification: {
          ...confirmed,
          taxonomyTargetKind: "industry",
          taxonomyTargetId: "tax-mfg",
          taxonomyTargetKey: "manufacturing-and-production",
        },
        pack: null,
        versions: [],
        readinessByVersionId: {},
      }),
    );
    expect(result.supportStatus).toBe("not_yet_supported");
    expect(result.reasonCode).toBe("architecture_gap");
    expect(result.architectureGap).toBe(true);
  });

  it("does not support unknown, ambiguous, or unconfirmed proposals", () => {
    expect(
      evaluateSupport(
        base({
          currentClassification: {
            ...confirmed,
            decisionStatus: "proposed",
            classificationOutcome: "unknown",
            taxonomyTargetId: null,
            taxonomyTargetKey: null,
          },
        }),
      ),
    ).toMatchObject({ supportStatus: "unknown", reasonCode: "classification_unknown" });
    expect(
      evaluateSupport(
        base({
          currentClassification: {
            ...confirmed,
            decisionStatus: "proposed",
            classificationOutcome: "ambiguous",
          },
        }),
      ),
    ).toMatchObject({ supportStatus: "needs_review", reasonCode: "classification_ambiguous" });
    expect(
      evaluateSupport(
        base({
          currentClassification: { ...confirmed, decisionStatus: "proposed" },
        }),
      ),
    ).toMatchObject({ supportStatus: "needs_review", reasonCode: "review_required" });
  });

  it("fails closed for Open Beta regardless of readiness", () => {
    const result = evaluateSupport(
      base({
        requestedRollout: "open_beta",
        readinessByVersionId: { "ver-1": "production_verified" },
      }),
    );
    expect(result.supportStatus).toBe("needs_review");
    expect(result.reasonCode).toBe("open_beta_policy_undefined");
  });

  it("requires review during requalification instead of reusing historical eligibility", () => {
    const result = evaluateSupport(base({ progressStatus: "requalifying" }));
    expect(result.supportStatus).toBe("needs_review");
    expect(result.reasonCode).toBe("review_required");
  });
});
