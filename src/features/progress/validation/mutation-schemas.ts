import { z } from "zod";
import { PROGRESS_FACT_TYPES } from "@/features/progress/domain/fact-types";

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

/**
 * organizationId is accepted for boundary validation only.
 * Server adapters replace it with membership-resolved organization authority.
 *
 * Correction uses the same schema with correctedFromFactId set (RPC record path).
 */
export const recordProgressFactInputSchema = z
  .object({
    organizationId: uuidSchema,
    enrollmentId: uuidSchema,
    factType: z.enum(PROGRESS_FACT_TYPES),
    occurredAt: z.string().trim().min(1).max(64),
    title: optionalTrimmedString(200),
    description: optionalTrimmedString(4000),
    numericValue: z.number().finite().optional().nullable(),
    numericUnit: optionalTrimmedString(50),
    isComplete: z.boolean().optional().nullable(),
    sequenceNumber: z.number().int().positive().optional().nullable(),
    idempotencyKey: optionalTrimmedString(200),
    correctedFromFactId: uuidSchema.optional().nullable(),
  })
  .strict()
  .superRefine((value, ctx) => {
    const hasTitle = value.title != null;
    const hasDescription = value.description != null;
    const hasNumeric = value.numericValue != null;
    const hasComplete = value.isComplete != null;
    const hasSequence = value.sequenceNumber != null;

    if (!hasTitle && !hasDescription && !hasNumeric && !hasComplete && !hasSequence) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide at least one progress payload field.",
        path: ["form"],
      });
    }

    if (value.numericUnit != null && value.numericValue == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A numeric unit requires a numeric value.",
        path: ["numericUnit"],
      });
    }

    if (value.correctedFromFactId != null && value.idempotencyKey == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A correction requires an idempotency key.",
        path: ["idempotencyKey"],
      });
    }
  });

export const voidProgressFactInputSchema = z
  .object({
    organizationId: uuidSchema,
    progressFactId: uuidSchema,
    reason: z.string().trim().min(1).max(500),
  })
  .strict();

export type RecordProgressFactInput = z.infer<typeof recordProgressFactInputSchema>;
export type VoidProgressFactInput = z.infer<typeof voidProgressFactInputSchema>;

export function validateRecordProgressFactInput(input: unknown) {
  return recordProgressFactInputSchema.safeParse(input);
}

export function validateVoidProgressFactInput(input: unknown) {
  return voidProgressFactInputSchema.safeParse(input);
}
