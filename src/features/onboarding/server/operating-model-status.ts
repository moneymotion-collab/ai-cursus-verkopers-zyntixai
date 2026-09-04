import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canAssignOperatingModel,
  type OperatingModelSetupStatus,
} from "@/features/onboarding/domain/operating-model";
import {
  resolveProductContextSummary,
  type ProductContextSummaryResolver,
} from "@/features/product-access/server/resolve-product-context-summary";
import { organizationHasBusinessActivities } from "@/features/org-context/server/organization-context-status";
import type { Database } from "@/types/database";

export async function resolveOperatingModelSetupStatus(input: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: string;
  resolveContext?: ProductContextSummaryResolver;
  hasActivities?: typeof organizationHasBusinessActivities;
}): Promise<OperatingModelSetupStatus> {
  const resolveContext =
    input.resolveContext ?? resolveProductContextSummary;
  const resolved = await resolveContext({
    organizationId: input.organizationId,
    authenticatedClient: input.supabase,
  });

  if (resolved.ok) {
    return {
      kind: "configured",
      organizationId: input.organizationId,
      role: input.role,
      packKey: resolved.packKey,
    };
  }

  if (resolved.errorCode !== "NO_PRIMARY_ACTIVITY") {
    return {
      kind: "configuration_review_required",
      organizationId: input.organizationId,
      role: input.role,
      canAssign: false,
    };
  }

  const hasActivities =
    input.hasActivities ?? organizationHasBusinessActivities;
  const activities = await hasActivities({
    supabase: input.supabase,
    organizationId: input.organizationId,
  });
  if (!activities.ok || activities.hasActivities) {
    return {
      kind: "configuration_review_required",
      organizationId: input.organizationId,
      role: input.role,
      canAssign: false,
    };
  }

  return {
    kind: "requires_assignment",
    organizationId: input.organizationId,
    role: input.role,
    canAssign: canAssignOperatingModel(input.role),
  };
}

export function isCourseSellerContextPack(packKey: string): boolean {
  return (
    packKey === "foundation.knowledge" ||
    packKey === "niche.online-course-business"
  );
}
