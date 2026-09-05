"use server";

import { revalidatePath } from "next/cache";
import { parseEvaluateProjectAttentionRulesActionInput } from "@/features/attention/actions/evaluate-project-attention-rules-action-schemas";
import {
  ATTENTION_EVALUATE_PROJECT_RULES_ACTION,
  type AttentionEvaluateProjectRulesMutationFailure,
  type AttentionEvaluateProjectRulesMutationResult,
} from "@/features/attention/domain/evaluate-action-types";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { evaluateProjectAttentionRules } from "@/features/attention/server/attention-rpc-adapters";
import {
  mapOrganizationContextError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/attention/server/normalize-attention-error";
import {
  listProjectAttentionEvaluateRevalidationPaths,
  resolveAttentionEvaluateReturnPath,
} from "@/features/attention/ui/attention-evaluate-return";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
  error: import("zod").ZodError,
): AttentionEvaluateProjectRulesMutationFailure {
  return {
    ok: false,
    action: ATTENTION_EVALUATE_PROJECT_RULES_ACTION,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
    returnPath: ATTENTION_ROUTE,
  };
}

function unexpectedActionFailure(
  returnPath: string,
): AttentionEvaluateProjectRulesMutationFailure {
  return {
    ok: false,
    action: ATTENTION_EVALUATE_PROJECT_RULES_ACTION,
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
 * Owner/Admin on-demand evaluation of project_overdue_active, project_task_overdue,
 * and project_no_owner Attention signals (TG2-AGENCY-SLICE).
 * Organization id is re-derived from verified membership; never trusted from the client alone.
 */
export async function evaluateProjectAttentionRulesAction(
  input: unknown,
): Promise<AttentionEvaluateProjectRulesMutationResult> {
  const parsed = parseEvaluateProjectAttentionRulesActionInput(input);
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
        action: ATTENTION_EVALUATE_PROJECT_RULES_ACTION,
        committed: false,
        error: mapOrganizationContextError(org.error),
        returnPath: fallbackReturnPath,
      };
    }

    const returnPath = resolveAttentionEvaluateReturnPath(
      parsed.data.returnPath,
      ATTENTION_ROUTE,
    );

    const projectId = parsed.data.projectId ?? null;

    const result = await evaluateProjectAttentionRules({
      supabase,
      organizationId: org.context.organizationId,
      input: {
        organizationId: org.context.organizationId,
        projectId,
      },
    });

    if (!result.ok || !result.data) {
      return {
        ok: false,
        action: ATTENTION_EVALUATE_PROJECT_RULES_ACTION,
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

    for (const path of listProjectAttentionEvaluateRevalidationPaths(
      org.context.organizationId,
      projectId,
    )) {
      revalidatePath(path);
    }

    return {
      ok: true,
      action: ATTENTION_EVALUATE_PROJECT_RULES_ACTION,
      committed: true,
      refreshRequired: false,
      returnPath,
      result: result.data,
      scope: projectId ? "project" : "organization",
      projectId,
    };
  } catch {
    return unexpectedActionFailure(fallbackReturnPath);
  }
}
