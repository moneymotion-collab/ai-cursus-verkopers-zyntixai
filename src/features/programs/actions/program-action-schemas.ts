import {
  archiveProgramInputSchema,
  createProgramInputSchema,
  restoreProgramInputSchema,
  transitionProgramStatusInputSchema,
  updateProgramInputSchema,
} from "@/features/programs/validation/mutation-schemas";

export function parseCreateProgramActionInput(input: unknown) {
  return createProgramInputSchema.safeParse(input);
}

export function parseUpdateProgramActionInput(input: unknown) {
  return updateProgramInputSchema.safeParse(input);
}

export function parseTransitionProgramStatusActionInput(input: unknown) {
  return transitionProgramStatusInputSchema.safeParse(input);
}

export function parseArchiveProgramActionInput(input: unknown) {
  return archiveProgramInputSchema.safeParse(input);
}

export function parseRestoreProgramActionInput(input: unknown) {
  return restoreProgramInputSchema.safeParse(input);
}
