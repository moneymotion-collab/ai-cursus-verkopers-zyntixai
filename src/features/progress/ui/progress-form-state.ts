import {
  interpretProgressMutationResult,
  progressMutationFormIsLocked,
  type ProgressMutationUiState,
} from "@/features/progress/domain/mutation-interpretation";
import type {
  ProgressMutationResult,
  ProgressRefreshHints,
} from "@/features/progress/domain/types";

export type ProgressFormUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | ProgressMutationUiState;

export function interpretProgressFormMutationResult(
  result: ProgressMutationResult,
): ProgressMutationUiState {
  return interpretProgressMutationResult(result);
}

export function fieldErrorMessage(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function progressFormIsLocked(state: ProgressFormUiState): boolean {
  if (state.kind === "idle" || state.kind === "pending") {
    return state.kind === "pending";
  }
  return progressMutationFormIsLocked(state);
}

export function progressMutationRefreshRequired(hints: ProgressRefreshHints): boolean {
  return hints.detail || hints.list;
}
