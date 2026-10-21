import { describe, expect, it } from "vitest";
import {
  handoffDenialForActivityTax,
  handoffDenialForAdmission,
  handoffDenialForClassification,
  handoffDenialForCurrentReadiness,
  handoffDenialForOpenBeta,
  handoffDenialForQualification,
  handoffDenialForSupport,
} from "@/features/business-qualification/domain/handoff";
import { canPerformAssignmentHandoff } from "@/features/business-qualification/domain/authorization";

describe("BQA-1F-R assignment handoff domain gates", () => {
  it("allows Owner and Admin and denies Staff and Viewer", () => {
    expect(canPerformAssignmentHandoff("owner")).toBe(true);
    expect(canPerformAssignmentHandoff("admin")).toBe(true);
    expect(canPerformAssignmentHandoff("staff")).toBe(false);
    expect(canPerformAssignmentHandoff("viewer")).toBe(false);
  });

  it("treats Open Beta as undefined policy", () => {
    expect(handoffDenialForOpenBeta("open_beta")).toBe("ROLLOUT_POLICY_UNDEFINED");
    expect(handoffDenialForOpenBeta("internal_qa")).toBeNull();
  });

  it("requires exact admitted eligible AdmissionDecision and rollout match", () => {
    const admission = {
      organizationId: "org",
      businessActivityId: "act",
      qualificationId: "qual",
      rolloutMode: "internal_qa" as const,
      admissionStatus: "admitted" as const,
      reasonCode: "eligible" as const,
    };
    const input = {
      organizationId: "org",
      businessActivityId: "act",
      qualificationId: "qual",
      rolloutMode: "internal_qa" as const,
    };
    expect(handoffDenialForAdmission(admission, input)).toBeNull();
    expect(
      handoffDenialForAdmission(
        { ...admission, admissionStatus: "not_yet_supported" },
        input,
      ),
    ).toBe("ADMISSION_NOT_ELIGIBLE");
    expect(
      handoffDenialForAdmission(admission, { ...input, rolloutMode: "closed_beta" }),
    ).toBe("ROLLOUT_MISMATCH");
  });

  it("does not treat a persisted support snapshot as current readiness", () => {
    expect(handoffDenialForCurrentReadiness("context_ready", "closed_beta")).toBe(
      "CONTEXT_READINESS_NO_LONGER_ELIGIBLE",
    );
    expect(handoffDenialForCurrentReadiness("beta_supported", "closed_beta")).toBeNull();
    expect(handoffDenialForCurrentReadiness("context_ready", "production")).toBe(
      "CONTEXT_READINESS_NO_LONGER_ELIGIBLE",
    );
    expect(handoffDenialForCurrentReadiness("context_ready", "internal_qa")).toBeNull();
  });

  it("fails closed on requalifying, review-required, and stale classification", () => {
    expect(
      handoffDenialForQualification({
        progressStatus: "requalifying",
        reviewStatus: "none",
        splitRecommended: false,
      }),
    ).toBe("REQUALIFICATION_REQUIRED");
    expect(
      handoffDenialForQualification({
        progressStatus: "confirmed",
        reviewStatus: "required",
        splitRecommended: false,
      }),
    ).toBe("CLASSIFICATION_REVIEW_REQUIRED");
    expect(
      handoffDenialForClassification(
        {
          decisionId: "new",
          decisionStatus: "confirmed",
          classificationOutcome: "classified",
          taxonomyTargetKind: "niche",
          taxonomyTargetId: "tax",
        },
        "old",
      ),
    ).toBe("ADMISSION_STALE");
  });

  it("does not overwrite a different Activity TAX and treats unclassified as classify-eligible", () => {
    expect(
      handoffDenialForActivityTax({
        activityKind: null,
        activityTargetId: null,
        confirmedKind: "niche",
        confirmedTargetId: "tax",
      }),
    ).toBeNull();
    expect(
      handoffDenialForActivityTax({
        activityKind: "niche",
        activityTargetId: "other",
        confirmedKind: "niche",
        confirmedTargetId: "tax",
      }),
    ).toBe("ACTIVITY_CLASSIFICATION_MISMATCH");
  });

  it("requires eligible linked support for the requested rollout", () => {
    expect(
      handoffDenialForSupport(
        {
          organizationId: "org",
          businessActivityId: "act",
          qualificationId: "qual",
          rolloutMode: "internal_qa",
          supportStatus: "supported_for_requested_rollout",
          reasonCode: "eligible",
          classificationDecisionId: "dec",
          contextPackId: "pack",
          contextPackVersionId: "ver",
          supersededAt: null,
        },
        {
          organizationId: "org",
          businessActivityId: "act",
          qualificationId: "qual",
          rolloutMode: "internal_qa",
        },
      ),
    ).toBeNull();
    expect(
      handoffDenialForSupport(
        {
          organizationId: "org",
          businessActivityId: "act",
          qualificationId: "qual",
          rolloutMode: "internal_qa",
          supportStatus: "not_yet_supported",
          reasonCode: "context_readiness_insufficient",
          classificationDecisionId: "dec",
          contextPackId: "pack",
          contextPackVersionId: "ver",
          supersededAt: null,
        },
        {
          organizationId: "org",
          businessActivityId: "act",
          qualificationId: "qual",
          rolloutMode: "internal_qa",
        },
      ),
    ).toBe("SUPPORT_ASSESSMENT_NOT_READY");
  });
});
