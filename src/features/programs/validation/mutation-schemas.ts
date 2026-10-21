import { z } from "zod";
import { PROGRAM_DELIVERY_MODES } from "@/features/programs/domain/delivery-mode";
import { PROGRAM_STATUSES } from "@/features/programs/domain/status";

const uuidSchema = z.string().uuid();

const optionalTrimmedString = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    });

export const createProgramInputSchema = z
  .object({
    organizationId: uuidSchema,
    name: z.string().trim().min(1, "Program name is required.").max(200),
    deliveryMode: z.enum(PROGRAM_DELIVERY_MODES),
    description: optionalTrimmedString(4000),
  })
  .strict();

export const updateProgramInputSchema = z
  .object({
    organizationId: uuidSchema,
    programId: uuidSchema,
    name: z.string().trim().min(1, "Program name is required.").max(200),
    deliveryMode: z.enum(PROGRAM_DELIVERY_MODES),
    description: optionalTrimmedString(4000),
  })
  .strict();

export const transitionProgramStatusInputSchema = z
  .object({
    organizationId: uuidSchema,
    programId: uuidSchema,
    toStatus: z.enum(PROGRAM_STATUSES),
    reason: optionalTrimmedString(500),
  })
  .strict();

export const archiveProgramInputSchema = z
  .object({
    organizationId: uuidSchema,
    programId: uuidSchema,
  })
  .strict();

export const restoreProgramInputSchema = archiveProgramInputSchema;

export type CreateProgramInput = z.infer<typeof createProgramInputSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramInputSchema>;
export type TransitionProgramStatusInput = z.infer<
  typeof transitionProgramStatusInputSchema
>;
export type ArchiveProgramInput = z.infer<typeof archiveProgramInputSchema>;
export type RestoreProgramInput = z.infer<typeof restoreProgramInputSchema>;

export function validateCreateProgramInput(input: unknown) {
  return createProgramInputSchema.safeParse(input);
}

export function validateUpdateProgramInput(input: unknown) {
  return updateProgramInputSchema.safeParse(input);
}

export function validateTransitionProgramStatusInput(input: unknown) {
  return transitionProgramStatusInputSchema.safeParse(input);
}

export function validateArchiveProgramInput(input: unknown) {
  return archiveProgramInputSchema.safeParse(input);
}

export function validateRestoreProgramInput(input: unknown) {
  return restoreProgramInputSchema.safeParse(input);
}
