import {
  programMutationFormIsLocked,
  interpretProgramMutationResult,
  type ProgramMutationUiState,
} from "@/features/programs/domain/mutation-interpretation";
import type { ProgramMutationResult, ProgramRefreshHints } from "@/features/programs/domain/types";

export type ProgramFormUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | ProgramMutationUiState;

export function interpretProgramFormMutationResult(
  result: ProgramMutationResult,
): ProgramMutationUiState {
  return interpretProgramMutationResult(result);
}

export function fieldErrorMessage(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function programFormIsLocked(state: ProgramFormUiState): boolean {
  if (state.kind === "idle" || state.kind === "pending") {
    return state.kind === "pending";
  }
  return programMutationFormIsLocked(state);
}

export function programMutationRefreshRequired(hints: ProgramRefreshHints): boolean {
  return hints.detail || hints.list || hints.history;
}
