import {
  customerMutationFormIsLocked,
  interpretCustomerMutationResult,
  type CustomerMutationUiState,
} from "@/features/customers/domain/mutation-interpretation";
import type { CustomerMutationResult, CustomerRefreshHints } from "@/features/customers/domain/types";

export type CustomerFormUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | CustomerMutationUiState;

export function interpretCustomerFormMutationResult(
  result: CustomerMutationResult,
): CustomerMutationUiState {
  return interpretCustomerMutationResult(result);
}

export function fieldErrorMessage(
  fieldErrors: Record<string, string[]> | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function customerFormIsLocked(state: CustomerFormUiState): boolean {
  if (state.kind === "idle" || state.kind === "pending") {
    return state.kind === "pending";
  }
  return customerMutationFormIsLocked(state);
}

export function customerMutationRefreshRequired(hints: CustomerRefreshHints): boolean {
  return hints.detail || hints.list || hints.history || hints.relatedTasks;
}
