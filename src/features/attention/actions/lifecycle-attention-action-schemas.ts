import { z } from "zod";
import {
  acknowledgeAttentionItemInputSchema,
  archiveAttentionItemInputSchema,
  assignAttentionItemInputSchema,
  dismissAttentionItemInputSchema,
  resolveAttentionItemInputSchema,
  updateAttentionSeverityInputSchema,
} from "@/features/attention/validation/mutation-schemas";

/**
 * Optional UI return hint for post-mutation navigation.
 * Never used as authorization. Validated to Attention-safe paths in the action boundary.
 */
const returnPathSchema = z
  .string()
  .trim()
  .max(2048)
  .optional()
  .nullable()
  .transform((value) => {
    if (value == null) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

function withReturnPath<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return schema
    .extend({
      returnPath: returnPathSchema,
    })
    .strict();
}

export const acknowledgeAttentionItemActionInputSchema = withReturnPath(
  acknowledgeAttentionItemInputSchema,
);

export const assignAttentionItemActionInputSchema = withReturnPath(
  assignAttentionItemInputSchema,
);

export const updateAttentionSeverityActionInputSchema = withReturnPath(
  updateAttentionSeverityInputSchema,
);

export const resolveAttentionItemActionInputSchema = withReturnPath(
  resolveAttentionItemInputSchema,
);

export const dismissAttentionItemActionInputSchema = withReturnPath(
  dismissAttentionItemInputSchema,
);

export const archiveAttentionItemActionInputSchema = withReturnPath(
  archiveAttentionItemInputSchema,
);

export type AcknowledgeAttentionItemActionInput = z.infer<
  typeof acknowledgeAttentionItemActionInputSchema
>;
export type AssignAttentionItemActionInput = z.infer<
  typeof assignAttentionItemActionInputSchema
>;
export type UpdateAttentionSeverityActionInput = z.infer<
  typeof updateAttentionSeverityActionInputSchema
>;
export type ResolveAttentionItemActionInput = z.infer<
  typeof resolveAttentionItemActionInputSchema
>;
export type DismissAttentionItemActionInput = z.infer<
  typeof dismissAttentionItemActionInputSchema
>;
export type ArchiveAttentionItemActionInput = z.infer<
  typeof archiveAttentionItemActionInputSchema
>;

export function parseAcknowledgeAttentionItemActionInput(input: unknown) {
  return acknowledgeAttentionItemActionInputSchema.safeParse(input);
}

export function parseAssignAttentionItemActionInput(input: unknown) {
  return assignAttentionItemActionInputSchema.safeParse(input);
}

export function parseUpdateAttentionSeverityActionInput(input: unknown) {
  return updateAttentionSeverityActionInputSchema.safeParse(input);
}

export function parseResolveAttentionItemActionInput(input: unknown) {
  return resolveAttentionItemActionInputSchema.safeParse(input);
}

export function parseDismissAttentionItemActionInput(input: unknown) {
  return dismissAttentionItemActionInputSchema.safeParse(input);
}

export function parseArchiveAttentionItemActionInput(input: unknown) {
  return archiveAttentionItemActionInputSchema.safeParse(input);
}
