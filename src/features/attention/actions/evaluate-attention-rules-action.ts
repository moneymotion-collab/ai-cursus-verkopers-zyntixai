"use server";

import { revalidatePath } from "next/cache";
import { parseEvaluateAttentionRulesActionInput } from "@/features/attention/actions/evaluate-attention-rules-action-schemas";
import {
  ATTENTION_EVALUATE_RULES_ACTION,
  type AttentionEvaluateRulesMutationFailure,
  type AttentionEvaluateRulesMutationResult,
} from "@/features/attention/domain/evaluate-action-types";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { evaluateAttentionRules } from "@/features/attention/server/attention-rpc-adapters";
import {
  mapOrganizationContextError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/attention/server/normalize-attention-error";
import {
  listAttentionEvaluateRevalidationPaths,
  resolveAttentionEvaluateReturnPath,
} from "@/features/attention/ui/attention-evaluate-return";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
  error: import("zod").ZodError,
): AttentionEvaluateRulesMutationFailure {
  return {
    ok: false,
    action: ATTENTION_EVALUATE_RULES_ACTION,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
    returnPath: ATTENTION_ROUTE,
  };
}

function unexpectedActionFailure(
  returnPath: string,
): AttentionEvaluateRulesMutationFailure {
  return {
    ok: false,
    action: ATTENTION_EVALUATE_RULES_ACTION,
    committed: false,
    error: {
      code: "UNEXPECTED_ERROR",
      message: "Something went wrong. Please try again.",
      retryable: true,
      category: "server",
    },
    returnPath,
  };
}

/**
 * Owner/Admin on-demand evaluation of enrollment_no_recent_progress.
 * Organization id is re-derived from verified membership; never trusted from the client alone.
 */
export async function evaluateAttentionRulesAction(
  input: unknown,
): Promise<AttentionEvaluateRulesMutationResult> {
  const parsed = parseEvaluateAttentionRulesActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure(parsed.error);
  }

  const fallbackReturnPath = resolveAttentionEvaluateReturnPath(
    parsed.data.returnPath,
    ATTENTION_ROUTE,
  );

  try {
    const supabase = await createSupabaseServerClient();
    const org = await resolveOrganizationContext({
      supabase,
      organizationId: parsed.data.organizationId,
    });

    if (!org.ok) {
      return {
        ok: false,
        action: ATTENTION_EVALUATE_RULES_ACTION,
        committed: false,
        error: mapOrganizationContextError(org.error),
        returnPath: fallbackReturnPath,
      };
    }

    const returnPath = resolveAttentionEvaluateReturnPath(
      parsed.data.returnPath,
      ATTENTION_ROUTE,
    );

    const enrollmentId = parsed.data.enrollmentId ?? null;

    const result = await evaluateAttentionRules({
      supabase,
      organizationId: org.context.organizationId,
      input: {
        organizationId: org.context.organizationId,
        enrollmentId,
      },
    });

    if (!result.ok || !result.data) {
      return {
        ok: false,
        action: ATTENTION_EVALUATE_RULES_ACTION,
        committed: false,
        error: result.ok
          ? {
              code: "UNEXPECTED_ERROR",
              message: "Something went wrong. Please try again.",
              retryable: true,
              category: "server",
            }
          : result.error,
        returnPath,
      };
    }

    for (const path of listAttentionEvaluateRevalidationPaths(
      org.context.organizationId,
      enrollmentId,
    )) {
      revalidatePath(path);
    }

    return {
      ok: true,
      action: ATTENTION_EVALUATE_RULES_ACTION,
      committed: true,
      refreshRequired: false,
      returnPath,
      result: result.data,
      scope: enrollmentId ? "enrollment" : "organization",
      enrollmentId,
    };
  } catch {
    return unexpectedActionFailure(fallbackReturnPath);
  }
}
