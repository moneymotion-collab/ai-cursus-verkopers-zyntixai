import { z } from "zod";
import { evaluateProjectAttentionRulesInputSchema } from "@/features/attention/validation/mutation-schemas";

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

export const evaluateProjectAttentionRulesActionInputSchema =
  evaluateProjectAttentionRulesInputSchema
    .extend({
      returnPath: returnPathSchema,
    })
    .strict();

export type EvaluateProjectAttentionRulesActionInput = z.infer<
  typeof evaluateProjectAttentionRulesActionInputSchema
>;

export function parseEvaluateProjectAttentionRulesActionInput(input: unknown) {
  return evaluateProjectAttentionRulesActionInputSchema.safeParse(input);
}
