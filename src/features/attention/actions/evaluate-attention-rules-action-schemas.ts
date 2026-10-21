import { z } from "zod";
import { evaluateAttentionRulesInputSchema } from "@/features/attention/validation/mutation-schemas";

/**
 * Optional UI return hint for post-evaluate navigation.
 * Never used as authorization.
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

export const evaluateAttentionRulesActionInputSchema =
  evaluateAttentionRulesInputSchema
    .extend({
      returnPath: returnPathSchema,
    })
    .strict();

export type EvaluateAttentionRulesActionInput = z.infer<
  typeof evaluateAttentionRulesActionInputSchema
>;

export function parseEvaluateAttentionRulesActionInput(input: unknown) {
  return evaluateAttentionRulesActionInputSchema.safeParse(input);
}
