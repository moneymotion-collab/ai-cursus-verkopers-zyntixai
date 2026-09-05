import { z } from "zod";
import { ATTENTION_SEVERITIES } from "@/features/attention/domain/severity";
import {
  ATTENTION_EXPLANATION_MAX_LENGTH,
  ATTENTION_REASON_MAX_LENGTH,
  ATTENTION_SUMMARY_MAX_LENGTH,
  ATTENTION_TITLE_MAX_LENGTH,
} from "@/features/attention/domain/validation";

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

const requiredTrimmedString = (max: number) =>
  z.string().trim().min(1).max(max);

/**
 * organizationId is accepted for boundary validation only.
 * Server adapters replace it with membership-resolved organization authority.
 */
export const createManualAttentionItemInputSchema = z
  .object({
    organizationId: uuidSchema,
    enrollmentId: uuidSchema,
    title: requiredTrimmedString(ATTENTION_TITLE_MAX_LENGTH),
    summary: optionalTrimmedString(ATTENTION_SUMMARY_MAX_LENGTH),
    severity: z.enum(ATTENTION_SEVERITIES).optional(),
    explanation: requiredTrimmedString(ATTENTION_EXPLANATION_MAX_LENGTH),
    evidenceNote: optionalTrimmedString(ATTENTION_REASON_MAX_LENGTH),
  })
  .strict();

export const recordAttentionSignalInputSchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
    explanation: requiredTrimmedString(ATTENTION_EXPLANATION_MAX_LENGTH),
    evidence: z
      .object({
        kind: z.enum(["manual_note", "stale_progress", "generic"]),
        note: optionalTrimmedString(ATTENTION_REASON_MAX_LENGTH),
        referenceOccurredAt: z.string().trim().min(1).max(64).optional().nullable(),
        evaluationOccurredAt: z.string().trim().min(1).max(64).optional(),
        ageCalendarDays: z.number().int().nonnegative().optional(),
        citedProgressFactIds: z.array(uuidSchema).max(50).optional(),
      })
      .strict()
      .optional(),
    detectedAt: z.string().trim().min(1).max(64).optional().nullable(),
  })
  .strict();

export const acknowledgeAttentionItemInputSchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
  })
  .strict();

export const assignAttentionItemInputSchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
    assigneeMemberId: uuidSchema.nullable(),
  })
  .strict();

export const updateAttentionSeverityInputSchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
    severity: z.enum(ATTENTION_SEVERITIES),
  })
  .strict();

export const resolveAttentionItemInputSchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
    resolutionReason: requiredTrimmedString(ATTENTION_REASON_MAX_LENGTH),
  })
  .strict();

export const dismissAttentionItemInputSchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
    dismissalReason: requiredTrimmedString(ATTENTION_REASON_MAX_LENGTH),
  })
  .strict();

export const archiveAttentionItemInputSchema = z
  .object({
    organizationId: uuidSchema,
    attentionItemId: uuidSchema,
  })
  .strict();

export const evaluateAttentionRulesInputSchema = z
  .object({
    organizationId: uuidSchema,
    enrollmentId: uuidSchema.optional().nullable(),
  })
  .strict();

export const evaluateProjectAttentionRulesInputSchema = z
  .object({
    organizationId: uuidSchema,
    projectId: uuidSchema.optional().nullable(),
  })
  .strict();

export type CreateManualAttentionItemAdapterInput = z.infer<
  typeof createManualAttentionItemInputSchema
>;
export type RecordAttentionSignalAdapterInput = z.infer<
  typeof recordAttentionSignalInputSchema
>;
export type AcknowledgeAttentionItemAdapterInput = z.infer<
  typeof acknowledgeAttentionItemInputSchema
>;
export type AssignAttentionItemAdapterInput = z.infer<
  typeof assignAttentionItemInputSchema
>;
export type UpdateAttentionSeverityAdapterInput = z.infer<
  typeof updateAttentionSeverityInputSchema
>;
export type ResolveAttentionItemAdapterInput = z.infer<
  typeof resolveAttentionItemInputSchema
>;
export type DismissAttentionItemAdapterInput = z.infer<
  typeof dismissAttentionItemInputSchema
>;
export type ArchiveAttentionItemAdapterInput = z.infer<
  typeof archiveAttentionItemInputSchema
>;
export type EvaluateAttentionRulesAdapterInput = z.infer<
  typeof evaluateAttentionRulesInputSchema
>;
export type EvaluateProjectAttentionRulesAdapterInput = z.infer<
  typeof evaluateProjectAttentionRulesInputSchema
>;

export function validateCreateManualAttentionItemAdapterInput(input: unknown) {
  return createManualAttentionItemInputSchema.safeParse(input);
}

export function validateRecordAttentionSignalAdapterInput(input: unknown) {
  return recordAttentionSignalInputSchema.safeParse(input);
}

export function validateAcknowledgeAttentionItemAdapterInput(input: unknown) {
  return acknowledgeAttentionItemInputSchema.safeParse(input);
}

export function validateAssignAttentionItemAdapterInput(input: unknown) {
  return assignAttentionItemInputSchema.safeParse(input);
}

export function validateUpdateAttentionSeverityAdapterInput(input: unknown) {
  return updateAttentionSeverityInputSchema.safeParse(input);
}

export function validateResolveAttentionItemAdapterInput(input: unknown) {
  return resolveAttentionItemInputSchema.safeParse(input);
}

export function validateDismissAttentionItemAdapterInput(input: unknown) {
  return dismissAttentionItemInputSchema.safeParse(input);
}

export function validateArchiveAttentionItemAdapterInput(input: unknown) {
  return archiveAttentionItemInputSchema.safeParse(input);
}

export function validateEvaluateAttentionRulesAdapterInput(input: unknown) {
  return evaluateAttentionRulesInputSchema.safeParse(input);
}

export function validateEvaluateProjectAttentionRulesAdapterInput(input: unknown) {
  return evaluateProjectAttentionRulesInputSchema.safeParse(input);
}
