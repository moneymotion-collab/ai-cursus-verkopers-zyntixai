import {
  validateRecordProgressFactInput,
  validateVoidProgressFactInput,
} from "@/features/progress/validation/mutation-schemas";

/**
 * Action-boundary parse helpers for future B1.6.3 workflows.
 * No "use server" route actions or redirects in B1.6.1.
 */
export function parseRecordProgressFactActionInput(input: unknown) {
  return validateRecordProgressFactInput(input);
}

export function parseVoidProgressFactActionInput(input: unknown) {
  return validateVoidProgressFactInput(input);
}
