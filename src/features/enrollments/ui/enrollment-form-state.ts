import {
  enrollmentMutationFormIsLocked,
  interpretEnrollmentMutationResult,
  type EnrollmentMutationUiState,
} from "@/features/enrollments/domain/mutation-interpretation";
import type {
  EnrollmentMutationResult,
  EnrollmentRefreshHints,
} from "@/features/enrollments/domain/types";

export type EnrollmentFormUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | EnrollmentMutationUiState;

export function interpretEnrollmentFormMutationResult(
  result: EnrollmentMutationResult,
): EnrollmentMutationUiState {
  return interpretEnrollmentMutationResult(result);
}

export function fieldErrorMessage(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function enrollmentFormIsLocked(state: EnrollmentFormUiState): boolean {
  if (state.kind === "idle" || state.kind === "pending") {
    return state.kind === "pending";
  }
  return enrollmentMutationFormIsLocked(state);
}

export function enrollmentMutationRefreshRequired(hints: EnrollmentRefreshHints): boolean {
  return hints.detail || hints.list || hints.history;
}
