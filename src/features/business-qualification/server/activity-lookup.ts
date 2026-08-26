import "server-only";

import {
  bqaFail,
  bqaOk,
  type BqaResult,
} from "@/features/business-qualification/domain/errors";
import type { BqaActivityRef } from "@/features/business-qualification/domain/types";
import { isBqaUuid } from "@/features/business-qualification/domain/classification";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import type { OrgContextQueryClient } from "@/features/org-context/server/org-context-query";

export type BqaActivityLookup = {
  getActivity(
    organizationId: string,
    businessActivityId: string,
  ): Promise<BqaResult<BqaActivityRef>>;
};

export function createOrgContextActivityLookup(
  queryClient: OrgContextQueryClient,
): BqaActivityLookup {
  const repository = new OrganizationContextRepository(queryClient);
  return {
    async getActivity(organizationId, businessActivityId) {
      if (!isBqaUuid(organizationId) || !isBqaUuid(businessActivityId)) {
        return bqaFail("ACTIVITY_NOT_FOUND", "Business Activity not found or access denied");
      }
      const activity = await repository.getBusinessActivity(
        organizationId,
        businessActivityId,
      );
      if (!activity.ok) {
        return bqaFail(
          "ACTIVITY_NOT_FOUND",
          "Business Activity not found or access denied",
        );
      }
      return bqaOk({
        activityId: activity.value.activityId,
        organizationId: activity.value.organizationId,
        status: activity.value.status,
      });
    },
  };
}
