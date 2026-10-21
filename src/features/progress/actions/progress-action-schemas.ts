import { z } from "zod";
import {
  recordProgressFactInputSchema,
  validateRecordProgressFactInput,
  validateVoidProgressFactInput,
  type RecordProgressFactInput,
  type VoidProgressFactInput,
} from "@/features/progress/validation/mutation-schemas";

export type RecordProgressFactActionInput = RecordProgressFactInput;
export type VoidProgressFactActionInput = VoidProgressFactInput;
export type CorrectProgressFactActionInput = RecordProgressFactInput & {
  correctedFromFactId: string;
};

/**
 * Action-boundary parse helpers for B1.6.3 record/void/correct workflows.
 */
export function parseRecordProgressFactActionInput(input: unknown) {
  return validateRecordProgressFactInput(input);
}

export function parseVoidProgressFactActionInput(input: unknown) {
  return validateVoidProgressFactInput(input);
}

/**
 * Correction reuses the record schema but requires an explicit
 * correctedFromFactId — otherwise it is indistinguishable from a plain record.
 */
const correctProgressFactInputSchema = recordProgressFactInputSchema.superRefine(
  (value, ctx) => {
    if (value.correctedFromFactId == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A correction requires the original progress fact.",
        path: ["correctedFromFactId"],
      });
    }
  },
);

export function parseCorrectProgressFactActionInput(input: unknown) {
  return correctProgressFactInputSchema.safeParse(input);
}
