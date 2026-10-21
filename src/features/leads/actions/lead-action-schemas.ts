import {
  archiveLeadInputSchema,
  convertLeadInputSchema,
  createLeadInputSchema,
  restoreLeadInputSchema,
  transitionLeadStageInputSchema,
  transitionLeadStatusInputSchema,
  updateLeadProfileInputSchema,
} from "@/features/leads/validation/mutation-schemas";

export function parseCreateLeadActionInput(input: unknown) {
  return createLeadInputSchema.safeParse(input);
}

export function parseUpdateLeadProfileActionInput(input: unknown) {
  return updateLeadProfileInputSchema.safeParse(input);
}

export function parseTransitionLeadStageActionInput(input: unknown) {
  return transitionLeadStageInputSchema.safeParse(input);
}

export function parseTransitionLeadStatusActionInput(input: unknown) {
  return transitionLeadStatusInputSchema.safeParse(input);
}

export function parseConvertLeadActionInput(input: unknown) {
  return convertLeadInputSchema.safeParse(input);
}

export function parseArchiveLeadActionInput(input: unknown) {
  return archiveLeadInputSchema.safeParse(input);
}

export function parseRestoreLeadActionInput(input: unknown) {
  return restoreLeadInputSchema.safeParse(input);
}
