import "server-only";

import {
  orgContextFail,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";
import {
  isOrgContextConfirmedMutationOperation,
} from "@/features/org-context/domain/confirmed-mutation-authority";
import type {
  OrgContextBqaMutationOperation,
  OrgContextMutationSuccess,
} from "@/features/org-context/domain/types";
import {
  invokeOrgContextBqaMutation,
  type OrgContextBqaMutationRpcClient,
} from "@/features/org-context/server/organization-context-rpc";

export type OrganizationContextConfirmedMutationServiceDeps = {
  mutate: OrgContextBqaMutationRpcClient;
};

/**
 * Named confirmed-admission mutation path.
 * Distinct from the platform-operator service. Does not accept source. Server-only.
 */
export class OrganizationContextConfirmedMutationService {
  constructor(private readonly deps: OrganizationContextConfirmedMutationServiceDeps) {}

  applyBqaConfirmedMutation(input: {
    organizationId: string;
    actorUserId: string;
    operation: OrgContextBqaMutationOperation;
    payload: Record<string, unknown>;
  }): Promise<OrgContextResult<OrgContextMutationSuccess>> {
    if (!input.actorUserId) {
      return Promise.resolve(
        orgContextFail(
          "ACTOR_NOT_AUTHORIZED",
          "Authenticated Owner or Admin actor is required",
        ),
      );
    }
    if (!isOrgContextConfirmedMutationOperation(input.operation)) {
      return Promise.resolve(
        orgContextFail(
          "FORBIDDEN_OPERATION",
          "Operation is not allowed for confirmed admission mutation",
          { operation: input.operation },
        ),
      );
    }
    const payload = { ...input.payload };
    delete payload.source;
    return invokeOrgContextBqaMutation(this.deps.mutate, {
      p_operation: input.operation,
      p_organization_id: input.organizationId,
      p_actor_user_id: input.actorUserId,
      p_payload: payload,
    });
  }
}

export function createOrganizationContextConfirmedMutationService(input: {
  mutate: OrgContextBqaMutationRpcClient;
}): OrganizationContextConfirmedMutationService {
  return new OrganizationContextConfirmedMutationService({
    mutate: input.mutate,
  });
}
