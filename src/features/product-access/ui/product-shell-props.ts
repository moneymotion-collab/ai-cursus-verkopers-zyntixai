import type { AppShellProps } from "@/components/app-shell";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";

export function moduleNavVisibilityForAccess(
  moduleAccess?: ProductModuleAccessState,
): AppShellProps["moduleNavVisibility"] {
  return moduleAccess?.navVisibility ?? FAIL_CLOSED_MODULE_NAV_VISIBILITY;
}
