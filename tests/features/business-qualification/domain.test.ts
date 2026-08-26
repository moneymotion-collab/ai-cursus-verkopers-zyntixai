import { describe, expect, it } from "vitest";
import { confirmationBlock } from "@/features/business-qualification/domain/classification";
import { evaluateRequiredAnswers, validateQualificationAnswer } from "@/features/business-qualification/domain/questions";
import { canPerformBqaOperation } from "@/features/business-qualification/domain/authorization";
import { deriveProgressStatus } from "@/features/business-qualification/domain/progress";

describe("BQA-1D domain contract", () => {
  it("accepts frozen required answers and rejects unknown keys", () => {
    expect(
      validateQualificationAnswer({
        questionKey: "activity_description",
        valueText: "Course business",
      }).ok,
    ).toBe(true);
    expect(
      validateQualificationAnswer({
        questionKey: "primary_value_delivered",
        valueCode: "structured_programs",
      }).ok,
    ).toBe(true);
    expect(
      validateQualificationAnswer({
        questionKey: "line_structure",
        valueCode: "one_line",
      }).ok,
    ).toBe(true);
    expect(
      validateQualificationAnswer({
        questionKey: "delivery_mode",
        valueCode: "online",
      }).ok,
    ).toBe(false);
    expect(
      validateQualificationAnswer({
        questionKey: "primary_value_delivered",
        valueCode: "not_a_code",
      }).ok,
    ).toBe(false);
  });

  it("treats completeness as qualification progress only", () => {
    const incomplete = evaluateRequiredAnswers([{ questionKey: "activity_description" }]);
    expect(incomplete.requiredComplete).toBe(false);
    expect(incomplete.missingQuestionKeys).toEqual([
      "primary_value_delivered",
      "line_structure",
    ]);
    expect(
      evaluateRequiredAnswers([
        { questionKey: "activity_description" },
        { questionKey: "primary_value_delivered" },
        { questionKey: "line_structure" },
      ]).requiredComplete,
    ).toBe(true);
  });

  it("does not let Staff confirm or requalify", () => {
    expect(canPerformBqaOperation("staff", "save_answer")).toBe(true);
    expect(canPerformBqaOperation("staff", "confirm_classification")).toBe(false);
    expect(canPerformBqaOperation("viewer", "save_answer")).toBe(false);
    expect(canPerformBqaOperation("owner", "confirm_classification")).toBe(true);
  });

  it("blocks confirmation for unknown, ambiguous, medium, low, none, and split", () => {
    const base = {
      requiredAnswersComplete: true,
      splitRecommended: false,
      reviewStatus: "none" as const,
    };
    expect(
      confirmationBlock({
        ...base,
        decision: {
          decisionStatus: "proposed",
          classificationOutcome: "unknown",
          confidenceBand: "none",
          unresolvedDimensionCodes: [],
          taxonomyTargetId: null,
        },
      }).ok,
    ).toBe(false);
    expect(
      confirmationBlock({
        ...base,
        decision: {
          decisionStatus: "proposed",
          classificationOutcome: "ambiguous",
          confidenceBand: "medium",
          unresolvedDimensionCodes: ["delivery_mode"],
          taxonomyTargetId: "9831efc8-b7ce-4726-be96-f5a061f21951",
        },
      }).ok,
    ).toBe(false);
    expect(
      confirmationBlock({
        ...base,
        splitRecommended: true,
        decision: {
          decisionStatus: "proposed",
          classificationOutcome: "classified",
          confidenceBand: "high",
          unresolvedDimensionCodes: [],
          taxonomyTargetId: "9831efc8-b7ce-4726-be96-f5a061f21951",
        },
      }).ok,
    ).toBe(false);
    expect(
      confirmationBlock({
        ...base,
        decision: {
          decisionStatus: "proposed",
          classificationOutcome: "classified",
          confidenceBand: "high",
          unresolvedDimensionCodes: [],
          taxonomyTargetId: "9831efc8-b7ce-4726-be96-f5a061f21951",
        },
      }).ok,
    ).toBe(true);
  });

  it("keeps requalifying progress until confirmation", () => {
    expect(
      deriveProgressStatus({
        answers: [
          { questionKey: "activity_description", valueCode: null },
          { questionKey: "primary_value_delivered", valueCode: "structured_programs" },
          { questionKey: "line_structure", valueCode: "one_line" },
        ],
        splitRecommended: false,
        reviewStatus: "none",
        currentProgress: "requalifying",
        currentClassification: {
          decisionStatus: "confirmed",
          classificationOutcome: "classified",
          confidenceBand: "high",
          unresolvedDimensionCodes: [],
        },
      }),
    ).toBe("requalifying");
  });
});
