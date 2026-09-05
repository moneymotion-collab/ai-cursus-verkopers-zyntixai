import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  listActiveOrganizationMemberships,
  resolveOrganizationContext,
} from "@/features/organizations/server/resolve-organization-context";
import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";
import {
  buildOrganizationOptions,
  resolveSelectedOrganization,
  type OrganizationOption,
} from "@/features/tasks/ui/resolve-task-organization-selection";
import type { OrganizationRole } from "@/features/tasks/domain/permissions";
import { canAccessMemberAdministration } from "@/features/invitations/domain/member-administration-access";
import type {
  MemberAdminMember,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";
import { loadActiveOrganizationMembers } from "@/features/invitations/server/load-active-organization-members";
import { loadPendingOrganizationInvitations } from "@/features/invitations/server/load-pending-organization-invitations";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";

function firstSearchParam(
  value: string | string[] | undefined,
): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export type MemberAdministrationPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "forbidden"; message: string; role: OrganizationRole }
  | {
      kind: "query_error";
      message: string;
      retryable: true;
      organizationId?: string;
    }
  | {
      kind: "success";
      organizationId: string;
      organizationName: string;
      organizationOptions: OrganizationOption[];
      role: OrganizationRole;
      isMultiOrganization: boolean;
      members: MemberAdminMember[];
      pendingInvitations: PendingInvitationListItem[];
      membersLoadFailed: boolean;
      invitationsLoadFailed: boolean;
      membersErrorMessage?: string;
      invitationsErrorMessage?: string;
      moduleAccess: ProductModuleAccessState;
    };

/**
 * Page loader for /settings/members.
 * Organization comes from verified active membership context only.
 * Owner/Admin gate runs before privileged member/invitation content is assembled.
 */
export async function loadMemberAdministrationPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<MemberAdministrationPageResult> {
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
      retryable: true,
    };
  }

  if (membershipsResult.memberships.length === 0) {
    return { kind: "no_organizations" };
  }

  const orgParam = firstSearchParam(rawSearchParams.org);
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

  const { role, organizationId } = orgContext.context;

  // Fail closed: Staff / Viewer / unknown never receive privileged lists.
  if (!canAccessMemberAdministration(role, "active")) {
    return {
      kind: "forbidden",
      message:
        "You do not have permission to manage members for this organization.",
      role,
    };
  }

  await redirectIfOrganizationOnboardingIncomplete(
    supabase,
    organizationId,
    role,
  );

  const moduleAccess = await loadProductModuleAccess(organizationId);
  const routeAccess = evaluateProductModuleRouteAccess({
    moduleId: "members",
    access: moduleAccess,
  });
  if (!routeAccess.allowed) {
    return {
      kind: "forbidden",
      message: routeAccess.message,
      role,
    };
  }

  const [membersResult, invitationsResult] = await Promise.all([
    loadActiveOrganizationMembers(supabase, organizationId),
    loadPendingOrganizationInvitations(supabase, organizationId),
  ]);

  const membersLoadFailed = !membersResult.ok;
  const invitationsLoadFailed = !invitationsResult.ok;

  if (membersLoadFailed && invitationsLoadFailed) {
    return {
      kind: "query_error",
      message: "Unable to load member administration data. Please try again.",
      retryable: true,
      organizationId,
    };
  }

  const organizationName =
    namesById[organizationId]?.trim() ||
    organizationOptions.find((o) => o.organizationId === organizationId)
      ?.displayName ||
    "Organization";

  return {
    kind: "success",
    organizationId,
    organizationName,
    organizationOptions,
    role,
    isMultiOrganization,
    members: membersResult.ok ? membersResult.members : [],
    pendingInvitations: invitationsResult.ok
      ? invitationsResult.invitations
      : [],
    membersLoadFailed,
    invitationsLoadFailed,
    membersErrorMessage: membersResult.ok
      ? undefined
      : membersResult.error.message,
    invitationsErrorMessage: invitationsResult.ok
      ? undefined
      : invitationsResult.error.message,
    moduleAccess,
  };
}
