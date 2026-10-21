import { z } from "zod";
import {
  ENROLLMENT_INITIAL_STATUSES,
  ENROLLMENT_STATUSES,
} from "@/features/enrollments/domain/status";

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

const metadataObjectSchema = z
  .record(z.string(), z.unknown())
  .optional()
  .default({});

/**
 * organizationId is accepted for boundary validation only.
 * Server adapters replace it with membership-resolved organization authority.
 */
export const createEnrollmentInputSchema = z
  .object({
    organizationId: uuidSchema,
    customerId: uuidSchema,
    programId: uuidSchema,
    ownerMemberId: uuidSchema.nullable().optional(),
    initialStatus: z.enum(ENROLLMENT_INITIAL_STATUSES).default("pending"),
    metadata: metadataObjectSchema,
  })
  .strict();

/**
 * Limited owner/metadata update only — no unrestricted update_enrollment RPC exists.
 */
export const updateEnrollmentOwnerMetadataInputSchema = z
  .object({
    organizationId: uuidSchema,
    enrollmentId: uuidSchema,
    ownerMemberId: uuidSchema.nullable().optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()
  .refine(
    (value) => value.ownerMemberId !== undefined || value.metadata !== undefined,
    {
      message: "Provide an owner or metadata update.",
      path: ["form"],
    },
  );

export const transitionEnrollmentStatusInputSchema = z
  .object({
    organizationId: uuidSchema,
    enrollmentId: uuidSchema,
    toStatus: z.enum(ENROLLMENT_STATUSES),
    reason: optionalTrimmedString(500),
  })
  .strict();

export const archiveEnrollmentInputSchema = z
  .object({
    organizationId: uuidSchema,
    enrollmentId: uuidSchema,
  })
  .strict();

export const restoreEnrollmentInputSchema = archiveEnrollmentInputSchema;

export type CreateEnrollmentInput = z.infer<typeof createEnrollmentInputSchema>;
export type UpdateEnrollmentOwnerMetadataInput = z.infer<
  typeof updateEnrollmentOwnerMetadataInputSchema
>;
export type TransitionEnrollmentStatusInput = z.infer<
  typeof transitionEnrollmentStatusInputSchema
>;
export type ArchiveEnrollmentInput = z.infer<typeof archiveEnrollmentInputSchema>;
export type RestoreEnrollmentInput = z.infer<typeof restoreEnrollmentInputSchema>;

export function validateCreateEnrollmentInput(input: unknown) {
  return createEnrollmentInputSchema.safeParse(input);
}

export function validateUpdateEnrollmentOwnerMetadataInput(input: unknown) {
  return updateEnrollmentOwnerMetadataInputSchema.safeParse(input);
}

export function validateTransitionEnrollmentStatusInput(input: unknown) {
  return transitionEnrollmentStatusInputSchema.safeParse(input);
}

export function validateArchiveEnrollmentInput(input: unknown) {
  return archiveEnrollmentInputSchema.safeParse(input);
}

export function validateRestoreEnrollmentInput(input: unknown) {
  return restoreEnrollmentInputSchema.safeParse(input);
}
