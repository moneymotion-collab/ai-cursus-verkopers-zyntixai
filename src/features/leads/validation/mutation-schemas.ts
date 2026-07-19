import { z } from "zod";
import { LEAD_STATUS_TRANSITION_TARGETS } from "@/features/leads/domain/status";

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

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : null;
  })
  .refine((value) => value === null || z.string().email().safeParse(value).success, {
    message: "Enter a valid email address.",
  });

const optionalMetadata = z.record(z.unknown()).optional();

const requiredSourceType = z
  .string()
  .trim()
  .min(1, "Lead source is required.")
  .max(200)
  .default("manual");

/**
 * Aligned to `public.create_lead`.
 * Stage and initial status are assigned by the database (default stage, status `open`).
 */
export const createLeadInputSchema = z
  .object({
    organizationId: uuidSchema,
    displayName: z.string().trim().min(1, "Lead name is required.").max(200),
    firstName: optionalTrimmedString(200),
    lastName: optionalTrimmedString(200),
    email: optionalEmail,
    phone: optionalTrimmedString(50),
    ownerMemberId: uuidSchema.optional().nullable(),
    sourceType: requiredSourceType,
    sourceDetail: optionalTrimmedString(200),
    pursuitLabel: optionalTrimmedString(200),
    metadata: optionalMetadata,
  })
  .strict();

/**
 * Profile fields covered by lead column-level UPDATE grants.
 * Excludes lifecycle, organization, conversion, stage, and history fields.
 */
export const updateLeadProfileInputSchema = z
  .object({
    organizationId: uuidSchema,
    leadId: uuidSchema,
    displayName: z.string().trim().min(1, "Lead name is required.").max(200),
    firstName: optionalTrimmedString(200),
    lastName: optionalTrimmedString(200),
    email: optionalEmail,
    phone: optionalTrimmedString(50),
    ownerMemberId: uuidSchema.optional().nullable(),
    sourceType: z.string().trim().min(1, "Lead source is required.").max(200),
    sourceDetail: optionalTrimmedString(200),
    pursuitLabel: optionalTrimmedString(200),
    metadata: optionalMetadata,
  })
  .strict();

/**
 * Aligned to `public.transition_lead_stage`.
 */
export const transitionLeadStageInputSchema = z
  .object({
    organizationId: uuidSchema,
    leadId: uuidSchema,
    toStageId: uuidSchema,
    reason: optionalTrimmedString(500),
  })
  .strict();

/**
 * Aligned to `public.transition_lead_status`.
 * Does not accept `converted` — use convertLeadInputSchema.
 */
export const transitionLeadStatusInputSchema = z
  .object({
    organizationId: uuidSchema,
    leadId: uuidSchema,
    toStatus: z.enum(LEAD_STATUS_TRANSITION_TARGETS),
    reason: optionalTrimmedString(500),
  })
  .strict();

/**
 * Aligned to `public.convert_lead_to_customer`.
 * Omit existingCustomerId to create a new customer from the lead profile.
 */
export const convertLeadInputSchema = z
  .object({
    organizationId: uuidSchema,
    leadId: uuidSchema,
    existingCustomerId: uuidSchema.optional().nullable(),
    reason: optionalTrimmedString(500),
  })
  .strict();

export const archiveLeadInputSchema = z
  .object({
    organizationId: uuidSchema,
    leadId: uuidSchema,
  })
  .strict();

export const restoreLeadInputSchema = archiveLeadInputSchema;

export type CreateLeadInput = z.infer<typeof createLeadInputSchema>;
export type UpdateLeadProfileInput = z.infer<typeof updateLeadProfileInputSchema>;
export type TransitionLeadStageInput = z.infer<typeof transitionLeadStageInputSchema>;
export type TransitionLeadStatusInput = z.infer<typeof transitionLeadStatusInputSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadInputSchema>;
export type ArchiveLeadInput = z.infer<typeof archiveLeadInputSchema>;
export type RestoreLeadInput = z.infer<typeof restoreLeadInputSchema>;

export function validateCreateLeadInput(input: unknown) {
  return createLeadInputSchema.safeParse(input);
}

export function validateUpdateLeadProfileInput(input: unknown) {
  return updateLeadProfileInputSchema.safeParse(input);
}

export function validateTransitionLeadStageInput(input: unknown) {
  return transitionLeadStageInputSchema.safeParse(input);
}

export function validateTransitionLeadStatusInput(input: unknown) {
  return transitionLeadStatusInputSchema.safeParse(input);
}

export function validateConvertLeadInput(input: unknown) {
  return convertLeadInputSchema.safeParse(input);
}

export function validateArchiveLeadInput(input: unknown) {
  return archiveLeadInputSchema.safeParse(input);
}

export function validateRestoreLeadInput(input: unknown) {
  return restoreLeadInputSchema.safeParse(input);
}
