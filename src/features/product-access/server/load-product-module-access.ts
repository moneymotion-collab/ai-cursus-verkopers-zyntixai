import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { operatingModelFromTenantActivity } from "@/features/onboarding/domain/operating-model";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import type { OrgContextQueryClient } from "@/features/org-context/server/org-context-query";
import { OrganizationContextRepository } from "@/features/org-context/server/organization-context.repository";
import {
  buildOperatingModelProductModuleAccess,
} from "@/features/product-access/domain/operating-model-module-access";
import { buildUnresolvedProductModuleAccess } from "@/features/product-access/domain/module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export type ProductModuleAccessClient = SupabaseClient<Database>;

export async function loadProductModuleAccess(
  organizationId: string,
  authenticatedClient?: ProductModuleAccessClient,
): Promise<ProductModuleAccessState> {
  if (!organizationId) {
    return buildUnresolvedProductModuleAccess();
  }

  const client = authenticatedClient ?? (await createSupabaseServerClient());
  const membership = await resolveOrganizationContext({
    supabase: client,
    organizationId,
  });
  if (!membership.ok) {
    return buildUnresolvedProductModuleAccess();
  }
  if (membership.context.organizationId !== organizationId) {
    return buildUnresolvedProductModuleAccess();
  }

  const repository = new OrganizationContextRepository(
    client as unknown as OrgContextQueryClient,
  );
  const primary = await repository.getPrimaryBusinessActivity(
    membership.context.organizationId,
  );
  if (!primary.ok || !primary.value) {
    return buildUnresolvedProductModuleAccess();
  }
  if (primary.value.organizationId !== membership.context.organizationId) {
    return buildUnresolvedProductModuleAccess();
  }

  const model = operatingModelFromTenantActivity({
    displayName: primary.value.displayName,
    classificationKind: primary.value.classification?.kind,
  });
  if (!model) {
    return buildUnresolvedProductModuleAccess();
  }

  return buildOperatingModelProductModuleAccess(model);
}
