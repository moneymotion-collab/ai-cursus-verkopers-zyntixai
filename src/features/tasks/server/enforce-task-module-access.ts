import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { TaskMutationFailure } from "@/features/tasks/domain/types";

export async function evaluateTaskModuleAccess(
  organizationId: string,
): Promise<{ allowed: true } | { allowed: false; failure: TaskMutationFailure }> {
  const access = await loadProductModuleAccess(organizationId);
  const routeAccess = evaluateProductModuleRouteAccess({ moduleId: "tasks", access });

  if (routeAccess.allowed) {
    return { allowed: true };
  }

  return {
    allowed: false,
    failure: {
      ok: false,
      committed: false,
      error: {
        code: "PERMISSION_DENIED",
        message: routeAccess.message,
        retryable: false,
        category: "permission",
      },
    },
  };
}
