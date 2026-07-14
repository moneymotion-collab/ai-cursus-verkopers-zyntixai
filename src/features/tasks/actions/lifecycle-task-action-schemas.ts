import {  organizationContextSchema,
  taskArchiveInputSchema,
  taskCancelInputSchema,
  taskCompleteInputSchema,
  taskRestoreInputSchema,
} from "@/features/tasks/validation/schemas";

export const completeTaskActionInputSchema = organizationContextSchema
  .merge(taskCompleteInputSchema)
  .strict();

export const cancelTaskActionInputSchema = organizationContextSchema
  .merge(taskCancelInputSchema)
  .strict();

export const archiveTaskActionInputSchema = organizationContextSchema
  .merge(taskArchiveInputSchema)
  .strict();

export const restoreTaskActionInputSchema = organizationContextSchema
  .merge(taskRestoreInputSchema)
  .strict();

export function parseCompleteTaskActionInput(input: unknown) {
  return completeTaskActionInputSchema.safeParse(input);
}

export function parseCancelTaskActionInput(input: unknown) {
  return cancelTaskActionInputSchema.safeParse(input);
}

export function parseArchiveTaskActionInput(input: unknown) {
  return archiveTaskActionInputSchema.safeParse(input);
}

export function parseRestoreTaskActionInput(input: unknown) {
  return restoreTaskActionInputSchema.safeParse(input);
}
