import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listActiveOrganizationMemberships,
  resolveOrganizationContext,
} from "@/features/organizations/server/resolve-organization-context";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type {
  ProductOperationsModuleId,
  ProductOperationsPageContext,
  ProductOperationsRole,
} from "@/features/product-operations/domain/types";
import {
  buildOrganizationOptions,
  resolveSelectedOrganization,
  type OrganizationOption,
} from "@/features/tasks/ui/resolve-task-organization-selection";
import type { Database } from "@/types/database";

export type ProductOperationsContextResult =
  | { kind: "ready"; context: ProductOperationsPageContext }
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "forbidden"; message: string; moduleAccess: ProductOperationsPageContext["moduleAccess"] }
  | { kind: "error"; message: string };

export async function resolveProductOperationsContext(
  supabase: SupabaseClient<Database>,
  moduleId: ProductOperationsModuleId,
  orgParam?: string,
): Promise<ProductOperationsContextResult> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { kind: "auth_required" };
  const memberships = await listActiveOrganizationMemberships(supabase);
  if (!memberships.ok) return { kind: "error", message: "Unable to verify organization access." };
  if (!memberships.memberships.length) return { kind: "organization_unavailable" };
  const selection = resolveSelectedOrganization(memberships.memberships, orgParam);
  const organizationIds = memberships.memberships.map((item) => item.organizationId);
  const { data: organizations } = await supabase.from("organizations").select("id, name").in("id", organizationIds);
  const names = Object.fromEntries((organizations ?? []).map((row) => [row.id, row.name]));
  const organizationOptions = buildOrganizationOptions(memberships.memberships, names);
  if (selection.requiresSelection || !selection.organizationId) {
    return { kind: "organization_required", organizations: organizationOptions };
  }
  const organization = await resolveOrganizationContext({
    supabase,
    organizationId: selection.organizationId,
  });
  if (!organization.ok) return { kind: "error", message: organization.error.message };
  await redirectIfOrganizationOnboardingIncomplete(
    supabase,
    selection.organizationId,
    organization.context.role,
  );
  const moduleAccess = await loadProductModuleAccess(selection.organizationId);
  const routeAccess = evaluateProductModuleRouteAccess({ moduleId, access: moduleAccess });
  if (!routeAccess.allowed) return { kind: "forbidden", message: routeAccess.message, moduleAccess };
  return {
    kind: "ready",
    context: {
      organizationId: selection.organizationId,
      organizationName: names[selection.organizationId]?.trim() || "Organization",
      organizationOptions,
      role: organization.context.role as ProductOperationsRole,
      terminology: moduleAccess.terminology,
      moduleAccess,
      moduleId,
    },
  };
}
