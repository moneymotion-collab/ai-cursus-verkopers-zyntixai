import "server-only";

import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import type { OrgContextQueryClient } from "@/features/org-context/server/org-context-query";
import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type { ExistingContextPinObservation } from "@/features/business-qualification/domain/types";

export type BqaAssignmentObserver = {
  getActivePin(
    organizationId: string,
    businessActivityId: string,
  ): Promise<BqaResult<ExistingContextPinObservation | null>>;
};

export function createOrgContextAssignmentObserver(
  queryClient: OrgContextQueryClient,
): BqaAssignmentObserver {
  const repository = new OrganizationContextRepository(queryClient);
  return {
    async getActivePin(organizationId, businessActivityId) {
      const pin = await repository.getPinnedContextVersion(
        organizationId,
        businessActivityId,
      );
      if (!pin.ok) {
        if (pin.error.code === "DATABASE_READ_ERROR") {
          return bqaFail("DATABASE_READ_ERROR", pin.error.message);
        }
        if (pin.error.code === "CATALOG_INTEGRITY_ERROR") {
          return bqaFail("CATALOG_INTEGRITY_ERROR", pin.error.message);
        }
        return bqaOk(null);
      }
      if (!pin.value) {
        return bqaOk(null);
      }
      return bqaOk({
        assignmentId: pin.value.assignmentId,
        contextPackVersionId: pin.value.contextPackVersionId,
      });
    },
  };
}
