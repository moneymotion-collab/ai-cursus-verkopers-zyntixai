import type { AppShellProps } from "@/components/app-shell";
import { FAIL_CLOSED_MODULE_NAV_VISIBILITY } from "@/features/product-access/domain/module-access";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";

export function moduleNavVisibilityForAccess(
  moduleAccess?: ProductModuleAccessState,
): AppShellProps["moduleNavVisibility"] {
  return moduleAccess?.navVisibility ?? FAIL_CLOSED_MODULE_NAV_VISIBILITY;
}

/** Sanitized terminology props for AppShell. Fails closed to generic system wording. */
export function terminologyForAccess(
  moduleAccess?: ProductModuleAccessState,
): AppShellProps["terminology"] {
  return moduleAccess?.terminology ?? DEFAULT_PRODUCT_TERMINOLOGY;
}
