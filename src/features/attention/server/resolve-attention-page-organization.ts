import type { SupabaseClient } from "@supabase/supabase-js";
import {
  listActiveOrganizationMemberships,
  resolveOrganizationContext,
} from "@/features/organizations/server/resolve-organization-context";
import { resolveOrganizationTimezone } from "@/features/organizations/server/resolve-organization-timezone";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import type { AttentionRole } from "@/features/attention/domain/types";
import { isKnownAttentionRole } from "@/features/attention/domain/permissions";
import {
  buildOrganizationOptions,
  resolveSelectedOrganization,
  type OrganizationOption,
} from "@/features/tasks/ui/resolve-task-organization-selection";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

export type AttentionPageOrganizationResult =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string }
  | {
      kind: "ready";
      organizationId: string;
      organizationName: string;
      organizationOptions: OrganizationOption[];
      role: AttentionRole;
      timezone: string;
      isMultiOrganization: boolean;
      moduleAccess: ProductModuleAccessState;
    };

/**
 * Progress-shaped organization resolution for Attention page shells.
 * Never trusts client organization ids without membership verification.
 */
export async function resolveAttentionPageOrganization(
  supabase: SupabaseClient<Database>,
  orgParam: string | undefined,
): Promise<AttentionPageOrganizationResult> {
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

  const isMultiOrganization = membershipsResult.memberships.length > 1;

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

  if (!isKnownAttentionRole(orgContext.context.role)) {
    return {
      kind: "org_context_missing",
      message: "Organization membership is unavailable for Attention.",
    };
  }

  const timezoneResult = await resolveOrganizationTimezone(
    supabase,
    selection.organizationId,
  );
  const timezone = timezoneResult.ok ? timezoneResult.timezone : "UTC";

  const organizationName =
    namesById[selection.organizationId]?.trim() ||
    organizationOptions.find((o) => o.organizationId === selection.organizationId)
      ?.displayName ||
    "Organization";

  await redirectIfOrganizationOnboardingIncomplete(
    supabase,
    selection.organizationId,
    orgContext.context.role,
  );

  const moduleAccess = await loadProductModuleAccess(selection.organizationId);

  return {
    kind: "ready",
    organizationId: selection.organizationId,
    organizationName,
    organizationOptions,
    role: orgContext.context.role,
    timezone,
    isMultiOrganization,
    moduleAccess,
  };
}
