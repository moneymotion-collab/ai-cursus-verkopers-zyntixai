/**
 * Bounded confirmed-admission mutation authority.
 * Distinct from platform-operator identity. Not support, admission, or readiness policy.
 */

import type { OrgContextBqaMutationOperation } from "@/features/org-context/domain/types";
import { ORG_CONTEXT_CONFIRMED_MUTATION_OPERATIONS } from "@/features/org-context/domain/types";

export const ORG_CONTEXT_CONFIRMED_ACTOR_ROLES = ["owner", "admin"] as const;

export type OrgContextConfirmedActorRole =
  (typeof ORG_CONTEXT_CONFIRMED_ACTOR_ROLES)[number];

export function isOrgContextConfirmedMutationOperation(
  value: string,
): value is OrgContextBqaMutationOperation {
  return (ORG_CONTEXT_CONFIRMED_MUTATION_OPERATIONS as readonly string[]).includes(
    value,
  );
}

export function isOrgContextConfirmedActorRole(
  value: string,
): value is OrgContextConfirmedActorRole {
  return value === "owner" || value === "admin";
}

export function isActiveConfirmedActorMembership(input: {
  status: string;
  role: string;
  organizationId: string;
  expectedOrganizationId: string;
}): boolean {
  return (
    input.status === "active" &&
    isOrgContextConfirmedActorRole(input.role) &&
    input.organizationId === input.expectedOrganizationId
  );
}
