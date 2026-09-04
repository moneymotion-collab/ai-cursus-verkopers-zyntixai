import "server-only";

import { canAccessModule } from "@/features/product-access/domain/module-access";
import type { ProductModuleAccessState, ProductModuleId } from "@/features/product-access/domain/types";

export const PRODUCT_MODULE_ACCESS_DENIED_MESSAGE =
  "This area is not available for your organization." as const;

export function evaluateProductModuleRouteAccess(input: {
  moduleId: ProductModuleId;
  access: ProductModuleAccessState;
}): { allowed: true } | { allowed: false; message: string } {
  if (canAccessModule({ moduleId: input.moduleId, access: input.access })) {
    return { allowed: true };
  }
  return {
    allowed: false,
    message: PRODUCT_MODULE_ACCESS_DENIED_MESSAGE,
  };
}
