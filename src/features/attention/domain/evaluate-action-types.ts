import type { AttentionApplicationError } from "@/features/attention/domain/types";
import type { AttentionEvaluateRulesResult } from "@/features/attention/server/attention-rpc-adapters";

/**
 * B1-C3 evaluate-rules action identifier.
 * Distinct from lifecycle mutations; Owner/Admin only via existing RPC gate.
 */
export const ATTENTION_EVALUATE_RULES_ACTION = "evaluate_rules" as const;

export type AttentionEvaluateRulesAction =
  typeof ATTENTION_EVALUATE_RULES_ACTION;

export type AttentionEvaluateRulesMutationSuccess = {
  ok: true;
  action: AttentionEvaluateRulesAction;
  committed: true;
  refreshRequired: false;
  returnPath: string;
  result: AttentionEvaluateRulesResult;
  scope: "organization" | "enrollment";
  enrollmentId: string | null;
};

export type AttentionEvaluateRulesMutationFailure = {
  ok: false;
  action: AttentionEvaluateRulesAction;
  committed: false;
  error: AttentionApplicationError;
  returnPath: string;
};

export type AttentionEvaluateRulesMutationResult =
  | AttentionEvaluateRulesMutationSuccess
  | AttentionEvaluateRulesMutationFailure;

/**
 * TG2-AGENCY-SLICE evaluate-rules action identifier for project-sourced signals.
 * Distinct action id from the enrollment evaluate action; same Owner/Admin RPC gate.
 */
export const ATTENTION_EVALUATE_PROJECT_RULES_ACTION = "evaluate_project_rules" as const;

export type AttentionEvaluateProjectRulesAction =
  typeof ATTENTION_EVALUATE_PROJECT_RULES_ACTION;

export type AttentionEvaluateProjectRulesMutationSuccess = {
  ok: true;
  action: AttentionEvaluateProjectRulesAction;
  committed: true;
  refreshRequired: false;
  returnPath: string;
  result: AttentionEvaluateRulesResult;
  scope: "organization" | "project";
  projectId: string | null;
};

export type AttentionEvaluateProjectRulesMutationFailure = {
  ok: false;
  action: AttentionEvaluateProjectRulesAction;
  committed: false;
  error: AttentionApplicationError;
  returnPath: string;
};

export type AttentionEvaluateProjectRulesMutationResult =
  | AttentionEvaluateProjectRulesMutationSuccess
  | AttentionEvaluateProjectRulesMutationFailure;

export function summarizeAttentionEvaluateRulesResult(
  result: AttentionEvaluateRulesResult,
): string {
  const parts: string[] = [];
  if (result.created > 0) {
    parts.push(
      `${result.created} new item${result.created === 1 ? "" : "s"} created`,
    );
  }
  if (result.updated > 0) {
    parts.push(
      `${result.updated} open item${result.updated === 1 ? "" : "s"} updated`,
    );
  }
  if (result.expired > 0) {
    parts.push(
      `${result.expired} item${result.expired === 1 ? "" : "s"} expired`,
    );
  }
  if (parts.length === 0) {
    return "No enrollment Attention changes. Eligible enrollments are within the progress threshold.";
  }
  return parts.join("; ") + ".";
}
