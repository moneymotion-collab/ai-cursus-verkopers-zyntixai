import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listActiveOrganizationMemberships,
  resolveOrganizationContext,
} from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationTimezone } from "@/features/organizations/server/resolve-organization-timezone";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import {
  buildOrganizationOptions,
  resolveSelectedOrganization,
  type OrganizationOption,
} from "@/features/tasks/ui/resolve-task-organization-selection";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

export type TaskPageOrganizationResult =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      timeZone: string;
      moduleAccess: ProductModuleAccessState;
    };

export async function resolveTaskPageOrganization(
  supabase: SupabaseClient<Database>,
  orgParam: string | undefined,
): Promise<TaskPageOrganizationResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { kind: "auth_required" };
  }

  const membershipsResult = await listActiveOrganizationMemberships(supabase);
  if (!membershipsResult.ok) {
    return {
      kind: "query_error",
      message: "Unable to verify organization access. Please try again.",
    };
  }

  if (membershipsResult.memberships.length === 0) {
    return { kind: "organization_unavailable" };
  }

  const selection = resolveSelectedOrganization(
    membershipsResult.memberships,
    orgParam,
  );

  const orgIds = membershipsResult.memberships.map((m) => m.organizationId);
  const { data: orgRows } = await supabase
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);

  const namesById = Object.fromEntries(
    (orgRows ?? []).map((row) => [row.id, row.name]),
  );
  const organizationOptions = buildOrganizationOptions(
    membershipsResult.memberships,
    namesById,
  );

  if (selection.requiresSelection || !selection.organizationId) {
    return { kind: "organization_required", organizations: organizationOptions };
  }

  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId: selection.organizationId,
  });

  if (!orgContext.ok) {
    return {
      kind: "org_context_missing",
      message: orgContext.error.message,
    };
  }

  const timezoneResult = await resolveOrganizationTimezone(
    supabase,
    selection.organizationId,
  );
  const timeZone = timezoneResult.ok ? timezoneResult.timezone : "UTC";

  await redirectIfOrganizationOnboardingIncomplete(
    supabase,
    selection.organizationId,
    orgContext.context.role,
  );

  const moduleAccess = await loadProductModuleAccess(selection.organizationId);

  return {
    kind: "ready",
    organizationId: selection.organizationId,
    organizationOptions,
    role: orgContext.context.role,
    timeZone,
    moduleAccess,
  };
}
