import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { AttentionApplicationError } from "@/features/attention/domain/types";

export async function evaluateAttentionModuleAccess(
  organizationId: string,
): Promise<{ allowed: true } | { allowed: false; error: AttentionApplicationError }> {
  const access = await loadProductModuleAccess(organizationId);
  const routeAccess = evaluateProductModuleRouteAccess({ moduleId: "attention", access });

  if (routeAccess.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    error: {
      code: "PERMISSION_DENIED",
      message: routeAccess.message,
      retryable: false,
      category: "permission",
    },
  };
}
