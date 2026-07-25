import {
  archiveEnrollmentInputSchema,
  createEnrollmentInputSchema,
  restoreEnrollmentInputSchema,
  transitionEnrollmentStatusInputSchema,
  updateEnrollmentOwnerMetadataInputSchema,
} from "@/features/enrollments/validation/mutation-schemas";

export function parseCreateEnrollmentActionInput(input: unknown) {
  return createEnrollmentInputSchema.safeParse(input);
}

export function parseUpdateEnrollmentOwnerMetadataActionInput(input: unknown) {
  return updateEnrollmentOwnerMetadataInputSchema.safeParse(input);
}

export function parseTransitionEnrollmentStatusActionInput(input: unknown) {
  return transitionEnrollmentStatusInputSchema.safeParse(input);
}

export function parseArchiveEnrollmentActionInput(input: unknown) {
  return archiveEnrollmentInputSchema.safeParse(input);
}

export function parseRestoreEnrollmentActionInput(input: unknown) {
  return restoreEnrollmentInputSchema.safeParse(input);
}
