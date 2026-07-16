import {
  interpretLeadMutationResult,
  leadMutationFormIsLocked,
  type LeadMutationUiState,
} from "@/features/leads/domain/mutation-interpretation";
import type { LeadMutationResult, LeadRefreshHints } from "@/features/leads/domain/types";

export type LeadFormUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | LeadMutationUiState;

export function interpretLeadFormMutationResult(
  result: LeadMutationResult,
): LeadMutationUiState {
  return interpretLeadMutationResult(result);
}

export function fieldErrorMessage(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function leadFormIsLocked(state: LeadFormUiState): boolean {
  if (state.kind === "idle" || state.kind === "pending") {
    return state.kind === "pending";
  }
  return leadMutationFormIsLocked(state);
}

export function leadMutationRefreshRequired(hints: LeadRefreshHints): boolean {
  return (
    hints.detail ||
    hints.list ||
    hints.statusHistory ||
    hints.stageHistory ||
    hints.relatedTasks
  );
}
