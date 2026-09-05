import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listActiveOrganizationMemberships,
  resolveOrganizationContext,
} from "@/features/organizations/server/resolve-organization-context";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { ProductModuleId } from "@/features/product-access/domain/types";
import type { FieldPageContext, FieldRole } from "@/features/field-operations/domain/types";
import {
  buildOrganizationOptions,
  resolveSelectedOrganization,
  type OrganizationOption,
} from "@/features/tasks/ui/resolve-task-organization-selection";
import type { Database } from "@/types/database";

type FieldModuleId = Extract<ProductModuleId, "sites" | "workOrders" | "dispatch">;
export type FieldContextResult =
  | { kind: "ready"; context: FieldPageContext }
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "forbidden"; message: string; moduleAccess: FieldPageContext["moduleAccess"] }
  | { kind: "error"; message: string };

export async function resolveFieldPageContext(
  supabase: SupabaseClient<Database>,
  moduleId: FieldModuleId,
  orgParam?: string,
): Promise<FieldContextResult> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { kind: "auth_required" };
  const memberships = await listActiveOrganizationMemberships(supabase);
  if (!memberships.ok) return { kind: "error", message: "Unable to verify organization access." };
  if (memberships.memberships.length === 0) return { kind: "organization_unavailable" };

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
  const access = evaluateProductModuleRouteAccess({ moduleId, access: moduleAccess });
  if (!access.allowed) return { kind: "forbidden", message: access.message, moduleAccess };

  return {
    kind: "ready",
    context: {
      organizationId: selection.organizationId,
      organizationName: names[selection.organizationId]?.trim() || "Organization",
      organizationOptions,
      role: organization.context.role as FieldRole,
      terminology: moduleAccess.terminology,
      moduleAccess,
      moduleId,
    },
  };
}
