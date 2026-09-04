import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentRole } from "@/features/enrollments/domain/types";
import { resolveEnrollmentPermissions } from "@/features/enrollments/domain/permissions";
import { getEnrollmentById } from "@/features/enrollments/server/enrollment-read-queries";
import { resolveEnrollmentPageOrganization } from "@/features/enrollments/server/resolve-enrollment-page-organization";
import {
  loadEligibleEnrollmentMembers,
  type EnrollmentMemberOption,
} from "@/features/enrollments/server/load-enrollment-create-options";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildEnrollmentDetailHref,
  parseEnrollmentListReturnState,
} from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import { canShowEditEnrollmentWorkflow } from "@/features/enrollments/ui/enrollment-workflow-visibility";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

const ENROLLMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState };

type WorkflowOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: EnrollmentRole;
  timeZone: string;
  listState: EnrollmentListUrlState;
  moduleAccess: ProductModuleAccessState;
};

async function resolveWorkflowOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<WorkflowOrgFailure | WorkflowOrgReady> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveEnrollmentPageOrganization(supabase, orgParam);

  if (orgResult.kind !== "ready") {
    return orgResult;
  }

  const routeAccess = evaluateProductModuleRouteAccess({
    moduleId: "enrollments",
    access: orgResult.moduleAccess,
  });
  if (!routeAccess.allowed) {
    return {
      kind: "forbidden",
      message: routeAccess.message,
      moduleAccess: orgResult.moduleAccess,
    };
  }

  const listState: EnrollmentListUrlState = {
    ...parseEnrollmentListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };

  return {
    kind: "ready",
    organizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    timeZone: orgResult.timezone,
    listState,
    moduleAccess: orgResult.moduleAccess,
  };
}

export type EnrollmentEditPageResult =
  | WorkflowOrgFailure
  | { kind: "invalid_enrollment" }
  | { kind: "enrollment_unavailable"; listState: EnrollmentListUrlState }
  | { kind: "action_unavailable"; message: string; backHref: string }
  | {
      kind: "ready";
      enrollment: EnrollmentDetailReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: EnrollmentRole;
      timeZone: string;
      listState: EnrollmentListUrlState;
      backHref: string;
      members: EnrollmentMemberOption[];
      membersError?: string;
      moduleAccess: ProductModuleAccessState;
    };

/**
 * Owner reassignment only. No metadata editor exists here — the product has no
 * approved metadata fields, and the contract prefers owner-only edit for now.
 */
export async function loadEnrollmentEditPage(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<EnrollmentEditPageResult> {
  if (!ENROLLMENT_ID_PATTERN.test(enrollmentId)) {
    return { kind: "invalid_enrollment" };
  }

  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  const enrollmentResult = await getEnrollmentById({
    supabase,
    organizationId: org.organizationId,
    enrollmentId,
  });

  const backHref = buildEnrollmentDetailHref(enrollmentId, org.listState);

  if (!enrollmentResult.ok) {
    return { kind: "enrollment_unavailable", listState: org.listState };
  }

  const enrollment = enrollmentResult.data;

  if (!canShowEditEnrollmentWorkflow(enrollment, org.role)) {
    const permissions = resolveEnrollmentPermissions(org.role, {
      isArchived: enrollment.derived.isArchived,
    });
    const message = enrollment.derived.isArchived
      ? "Archived enrollments cannot be edited."
      : !permissions.canUpdateOwnerOrMetadata
        ? "You do not have permission to edit this enrollment."
        : "This enrollment cannot be edited in its current state.";
    return { kind: "action_unavailable", message, backHref };
  }

  const membersResult = await loadEligibleEnrollmentMembers(supabase, org.organizationId);

  return {
    kind: "ready",
    enrollment,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    backHref,
    members: membersResult.options,
    membersError: membersResult.failed
      ? "Some organization members could not be loaded. Please try again."
      : undefined,
    moduleAccess: org.moduleAccess,
  };
}
