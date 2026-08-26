import { describe, expect, it } from "vitest";
import { evaluateAdmission } from "@/features/business-qualification/domain/admission";
import type { AdmissionEvaluationInput } from "@/features/business-qualification/domain/admission";

const supportEligible = {
  assessmentId: "sup-1",
  classificationDecisionId: "dec-1",
  rolloutMode: "internal_qa" as const,
  supportStatus: "supported_for_requested_rollout" as const,
  reasonCode: "eligible" as const,
  supersededAt: null,
};

function base(overrides: Partial<AdmissionEvaluationInput> = {}): AdmissionEvaluationInput {
  return {
    requestedRollout: "internal_qa",
    answersComplete: true,
    progressStatus: "confirmed",
    reviewStatus: "none",
    splitRecommended: false,
    currentClassification: {
      decisionId: "dec-1",
      decisionStatus: "confirmed",
      classificationOutcome: "classified",
    },
    support: supportEligible,
    activeDemand: false,
    ...overrides,
  };
}

describe("BQA-1E admission evaluation", () => {
  it("admits internal_qa when support is eligible and all BQA gates pass", () => {
    expect(evaluateAdmission(base())).toMatchObject({
      admissionStatus: "admitted",
      reasonCode: "eligible",
      rolloutMode: "internal_qa",
    });
  });

  it("does not admit closed_beta when OCB readiness is only context_ready", () => {
    expect(
      evaluateAdmission(
        base({
          requestedRollout: "closed_beta",
          support: {
            ...supportEligible,
            rolloutMode: "closed_beta",
            supportStatus: "not_yet_supported",
            reasonCode: "context_readiness_insufficient",
          },
        }),
      ),
    ).toMatchObject({
      admissionStatus: "not_yet_supported",
      reasonCode: "not_yet_supported",
    });
  });

  it("admits closed_beta when support is eligible at beta_supported", () => {
    expect(
      evaluateAdmission(
        base({
          requestedRollout: "closed_beta",
          support: {
            ...supportEligible,
            rolloutMode: "closed_beta",
          },
        }),
      ),
    ).toMatchObject({
      admissionStatus: "admitted",
      reasonCode: "eligible",
      rolloutMode: "closed_beta",
    });
  });

  it("does not admit production at beta_supported", () => {
    expect(
      evaluateAdmission(
        base({
          requestedRollout: "production",
          support: {
            ...supportEligible,
            rolloutMode: "production",
            supportStatus: "not_yet_supported",
            reasonCode: "context_readiness_insufficient",
          },
        }),
      ),
    ).toMatchObject({
      admissionStatus: "not_yet_supported",
      reasonCode: "not_yet_supported",
    });
  });

  it("admits production only when support is eligible at production_verified", () => {
    expect(
      evaluateAdmission(
        base({
          requestedRollout: "production",
          support: { ...supportEligible, rolloutMode: "production" },
        }),
      ),
    ).toMatchObject({
      admissionStatus: "admitted",
      reasonCode: "eligible",
      rolloutMode: "production",
    });
  });

  it("blocks Open Beta as undefined policy", () => {
    expect(
      evaluateAdmission(
        base({
          requestedRollout: "open_beta",
          support: {
            ...supportEligible,
            rolloutMode: "open_beta",
            supportStatus: "needs_review",
            reasonCode: "open_beta_policy_undefined",
          },
        }),
      ),
    ).toMatchObject({
      admissionStatus: "blocked",
      reasonCode: "blocked_policy",
    });
  });

  it("does not automatically admit review-required or not-yet-supported states", () => {
    expect(
      evaluateAdmission(
        base({
          support: {
            ...supportEligible,
            supportStatus: "needs_review",
            reasonCode: "review_required",
          },
        }),
      ),
    ).toMatchObject({ admissionStatus: "needs_review", reasonCode: "review_required" });
    expect(
      evaluateAdmission(
        base({
          support: {
            ...supportEligible,
            supportStatus: "not_yet_supported",
            reasonCode: "missing_context_pack",
          },
        }),
      ),
    ).toMatchObject({
      admissionStatus: "not_yet_supported",
      reasonCode: "not_yet_supported",
    });
  });

  it("moves not-yet-supported to waitlisted when an active demand signal exists", () => {
    expect(
      evaluateAdmission(
        base({
          activeDemand: true,
          support: {
            ...supportEligible,
            supportStatus: "not_yet_supported",
            reasonCode: "missing_context_pack",
          },
        }),
      ),
    ).toMatchObject({
      admissionStatus: "waitlisted",
      reasonCode: "waitlisted_not_eligible",
    });
  });
});
