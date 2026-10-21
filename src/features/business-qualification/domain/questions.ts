/**
 * Frozen v1 qualification question contract.
 * UI wording is not canonical. Adaptive keys are server-allowlisted only.
 */

import { bqaFail, bqaOk, type BqaResult } from "./errors";
import type {
  LineStructureCode,
  PrimaryValueDeliveredCode,
  QualificationAnswerValueKind,
} from "./types";

export const REQUIRED_QUESTION_KEYS = [
  "activity_description",
  "primary_value_delivered",
  "line_structure",
] as const;

export type RequiredQuestionKey = (typeof REQUIRED_QUESTION_KEYS)[number];

export const PRIMARY_VALUE_DELIVERED_CODES = [
  "structured_programs",
  "individualized_service",
  "physical_product",
  "digital_product",
  "field_work",
] as const satisfies readonly PrimaryValueDeliveredCode[];

export const LINE_STRUCTURE_CODES = [
  "one_line",
  "several_lines",
] as const satisfies readonly LineStructureCode[];

const QUESTION_KEY_PATTERN = /^[a-z][a-z0-9_]*$/;
const PRIMARY_VALUE_SET = new Set<string>(PRIMARY_VALUE_DELIVERED_CODES);
const LINE_STRUCTURE_SET = new Set<string>(LINE_STRUCTURE_CODES);

export type ValidatedQualificationAnswer = {
  questionKey: string;
  valueKind: QualificationAnswerValueKind;
  valueText: string | null;
  valueCode: string | null;
};

export function isRequiredQuestionKey(value: string): value is RequiredQuestionKey {
  return (REQUIRED_QUESTION_KEYS as readonly string[]).includes(value);
}

export function isAllowedQuestionKey(value: string): boolean {
  return isRequiredQuestionKey(value);
}

export function evaluateRequiredAnswers(
  answers: ReadonlyArray<{ questionKey: string }>,
): { requiredComplete: boolean; missingQuestionKeys: readonly string[] } {
  const present = new Set(answers.map((answer) => answer.questionKey));
  const missingQuestionKeys = REQUIRED_QUESTION_KEYS.filter((key) => !present.has(key));
  return {
    requiredComplete: missingQuestionKeys.length === 0,
    missingQuestionKeys,
  };
}

export function answersIndicateSplit(
  answers: ReadonlyArray<{ questionKey: string; valueCode: string | null }>,
): boolean {
  return answers.some(
    (answer) =>
      answer.questionKey === "line_structure" && answer.valueCode === "several_lines",
  );
}

export function validateQualificationAnswer(input: {
  questionKey: string;
  valueText?: string | null;
  valueCode?: string | null;
}): BqaResult<ValidatedQualificationAnswer> {
  const questionKey = input.questionKey.trim().toLowerCase();
  if (
    questionKey.length < 2 ||
    questionKey.length > 80 ||
    !QUESTION_KEY_PATTERN.test(questionKey)
  ) {
    return bqaFail("QUESTION_NOT_ALLOWED", "Question key is not allowed");
  }
  if (!isAllowedQuestionKey(questionKey)) {
    return bqaFail("QUESTION_NOT_ALLOWED", "Question key is not in the v1 server allowlist");
  }

  if (questionKey === "activity_description") {
    const valueText = (input.valueText ?? "").trim();
    if (valueText.length < 1 || valueText.length > 8000) {
      return bqaFail("INVALID_ANSWER", "activity_description must be meaningful non-empty text");
    }
    return bqaOk({
      questionKey,
      valueKind: "text",
      valueText,
      valueCode: null,
    });
  }

  const valueCode = (input.valueCode ?? "").trim().toLowerCase();
  if (questionKey === "primary_value_delivered") {
    if (!PRIMARY_VALUE_SET.has(valueCode)) {
      return bqaFail(
        "INVALID_ANSWER",
        "primary_value_delivered must be a frozen coded value",
      );
    }
    return bqaOk({
      questionKey,
      valueKind: "code",
      valueText: null,
      valueCode,
    });
  }

  if (!LINE_STRUCTURE_SET.has(valueCode)) {
    return bqaFail("INVALID_ANSWER", "line_structure must be one_line or several_lines");
  }
  return bqaOk({
    questionKey,
    valueKind: "code",
    valueText: null,
    valueCode,
  });
}

export function answersAreEqual(
  current: {
    valueKind: string;
    valueText: string | null;
    valueCode: string | null;
  },
  next: ValidatedQualificationAnswer,
): boolean {
  return (
    current.valueKind === next.valueKind &&
    (current.valueText ?? null) === next.valueText &&
    (current.valueCode ?? null) === next.valueCode
  );
}
