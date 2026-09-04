import "server-only";

import { resolvePrimaryBusinessActivityContext } from "@/features/context-resolver/server/context-resolver";
import {
  buildResolvedProductModuleAccess,
  buildUnresolvedProductModuleAccess,
} from "@/features/product-access/domain/module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import { PRODUCT_MODULE_ACCESS_RESOLUTION_MODE } from "@/features/product-access/server/product-module-access-mode";

export async function loadProductModuleAccess(
  organizationId: string,
): Promise<ProductModuleAccessState> {
  if (!organizationId) {
    return buildUnresolvedProductModuleAccess();
  }

  const resolved = await resolvePrimaryBusinessActivityContext({
    organizationId,
    mode: PRODUCT_MODULE_ACCESS_RESOLUTION_MODE,
  });

  if (!resolved.ok) {
    return buildUnresolvedProductModuleAccess();
  }

  return buildResolvedProductModuleAccess(resolved.value.relevantCapabilities);
}
