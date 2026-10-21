import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentRole, EnrollmentStatus } from "@/features/enrollments/domain/types";
import { getAllowedEnrollmentStatusTransitions } from "@/features/enrollments/domain/status";
import { resolveEnrollmentPermissions } from "@/features/enrollments/domain/permissions";
import { getEnrollmentById } from "@/features/enrollments/server/enrollment-read-queries";
import { resolveEnrollmentPageOrganization } from "@/features/enrollments/server/resolve-enrollment-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildEnrollmentDetailHref,
  parseEnrollmentListReturnState,
} from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import {
  canShowArchiveEnrollmentWorkflow,
  canShowRestoreEnrollmentWorkflow,
  canShowStatusEnrollmentWorkflow,
} from "@/features/enrollments/ui/enrollment-workflow-visibility";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

const ENROLLMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LifecycleOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState };

type LifecycleOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: EnrollmentRole;
  timeZone: string;
  listState: EnrollmentListUrlState;
  moduleAccess: ProductModuleAccessState;
};

export type EnrollmentLifecycleWorkflowPageResult =
  | LifecycleOrgFailure
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
      moduleAccess: ProductModuleAccessState;
    };

const ACTION_UNAVAILABLE_MESSAGES = {
  status: "This enrollment status cannot be changed in its current state.",
  archive: "This enrollment cannot be archived in its current state.",
  restore: "This enrollment cannot be restored in its current state.",
} as const;

type LifecycleAction = keyof typeof ACTION_UNAVAILABLE_MESSAGES;

async function resolveLifecycleOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LifecycleOrgFailure | LifecycleOrgReady> {
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

async function loadEnrollmentLifecycleWorkflowPage(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  action: LifecycleAction,
  canShow: (enrollment: EnrollmentDetailReadModel, role: EnrollmentRole) => boolean,
): Promise<EnrollmentLifecycleWorkflowPageResult> {
  if (!ENROLLMENT_ID_PATTERN.test(enrollmentId)) {
    return { kind: "invalid_enrollment" };
  }

  const org = await resolveLifecycleOrganization(supabase, rawSearchParams);
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
  const permissions = resolveEnrollmentPermissions(org.role, {
    isArchived: enrollment.derived.isArchived,
  });

  if (!permissions.canViewEnrollment) {
    return { kind: "enrollment_unavailable", listState: org.listState };
  }

  if (!canShow(enrollment, org.role)) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES[action],
      backHref,
    };
  }

  return {
    kind: "ready",
    enrollment,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    backHref,
    moduleAccess: org.moduleAccess,
  };
}

export type EnrollmentStatusPageResult = EnrollmentLifecycleWorkflowPageResult & {
  allowedTargets?: EnrollmentStatus[];
};

export async function loadEnrollmentStatusPage(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<EnrollmentStatusPageResult> {
  const result = await loadEnrollmentLifecycleWorkflowPage(
    supabase,
    enrollmentId,
    rawSearchParams,
    "status",
    canShowStatusEnrollmentWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const allowedTargets = getAllowedEnrollmentStatusTransitions(result.enrollment.status);

  if (allowedTargets.length === 0) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES.status,
      backHref: result.backHref,
    };
  }

  return {
    ...result,
    allowedTargets,
  };
}

export function loadEnrollmentArchivePage(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<EnrollmentLifecycleWorkflowPageResult> {
  return loadEnrollmentLifecycleWorkflowPage(
    supabase,
    enrollmentId,
    rawSearchParams,
    "archive",
    canShowArchiveEnrollmentWorkflow,
  );
}

export function loadEnrollmentRestorePage(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<EnrollmentLifecycleWorkflowPageResult> {
  return loadEnrollmentLifecycleWorkflowPage(
    supabase,
    enrollmentId,
    rawSearchParams,
    "restore",
    canShowRestoreEnrollmentWorkflow,
  );
}
