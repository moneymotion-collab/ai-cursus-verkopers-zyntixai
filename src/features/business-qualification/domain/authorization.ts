/**
 * Pure BQA role matrix. Caller identity is proven by the server, not by this module.
 */

import type { BqaMutationOperation, BqaOrganizationRole } from "./types";

export const BQA_READ_ROLES: readonly BqaOrganizationRole[] = [
  "owner",
  "admin",
  "staff",
  "viewer",
];

export const BQA_ANSWER_WRITE_ROLES: readonly BqaOrganizationRole[] = [
  "owner",
  "admin",
  "staff",
];

export const BQA_CLASSIFICATION_COMMAND_ROLES: readonly BqaOrganizationRole[] = [
  "owner",
  "admin",
];

export const BQA_SUPPORT_ADMISSION_COMMAND_ROLES: readonly BqaOrganizationRole[] = [
  "owner",
  "admin",
];

const OPERATION_ROLES: Record<BqaMutationOperation, readonly BqaOrganizationRole[]> = {
  ensure_qualification: BQA_ANSWER_WRITE_ROLES,
  save_answer: BQA_ANSWER_WRITE_ROLES,
  record_proposal: BQA_CLASSIFICATION_COMMAND_ROLES,
  confirm_classification: BQA_CLASSIFICATION_COMMAND_ROLES,
  begin_requalification: BQA_CLASSIFICATION_COMMAND_ROLES,
  request_review: BQA_CLASSIFICATION_COMMAND_ROLES,
  record_support_assessment: BQA_SUPPORT_ADMISSION_COMMAND_ROLES,
  record_admission_decision: BQA_SUPPORT_ADMISSION_COMMAND_ROLES,
  join_demand_waitlist: BQA_SUPPORT_ADMISSION_COMMAND_ROLES,
  withdraw_demand_waitlist: BQA_SUPPORT_ADMISSION_COMMAND_ROLES,
};

export function canReadQualificationEvents(role: BqaOrganizationRole): boolean {
  return role === "owner" || role === "admin";
}

export function canPerformBqaOperation(
  role: BqaOrganizationRole,
  operation: BqaMutationOperation,
): boolean {
  return OPERATION_ROLES[operation].includes(role);
}

export function answerSourceForRole(
  role: BqaOrganizationRole,
): "user_self" | "organization_admin" {
  return role === "admin" ? "organization_admin" : "user_self";
}

export function confirmationDecisionSourceForRole(
  role: Extract<BqaOrganizationRole, "owner" | "admin">,
): "user_self" | "organization_admin" {
  return role === "admin" ? "organization_admin" : "user_self";
}

export function proposalSourceForRole(
  role: Extract<BqaOrganizationRole, "owner" | "admin">,
  requested?: string | null,
): "ai_proposal" | "user_self" | "organization_admin" {
  if (requested === "ai_proposal") {
    return "ai_proposal";
  }
  return role === "admin" ? "organization_admin" : "user_self";
}

export function isKnownBqaRole(value: string): value is BqaOrganizationRole {
  return (
    value === "owner" || value === "admin" || value === "staff" || value === "viewer"
  );
}
