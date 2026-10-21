import type { EnrollmentDetailReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentOperationalSnapshot } from "@/features/enrollments/domain/operational-metadata";
import type {
  EnrollmentPermissionSet,
  EnrollmentRole,
} from "@/features/enrollments/domain/types";
import { loadEnrollmentDetailFoundation } from "@/features/enrollments/server/load-enrollment-foundations";
import { loadEnrollmentOperationalSnapshot } from "@/features/enrollments/server/load-enrollment-operational-metadata";
import { resolveEnrollmentPageOrganization } from "@/features/enrollments/server/resolve-enrollment-page-organization";
import {
  resolveMemberLabel,
  resolveMemberLabels,
} from "@/features/enrollments/server/resolve-enrollment-labels";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildBackToEnrollmentsHref,
  parseEnrollmentListReturnState,
} from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import {
  formatEnrollmentDate,
  formatEnrollmentHistoryTransition,
  formatEnrollmentSourceLabel,
} from "@/features/enrollments/ui/enrollment-presentation";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  EnrollmentHistoryLoadState,
  EnrollmentStatusHistoryEntry,
} from "@/features/enrollments/domain/read-types";

const ENROLLMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type EnrollmentHistoryPresentationItem = {
  id: string;
  transitionLabel: string;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  sourceLabel: string;
  reason: string | null;
  actorLabel: string;
  timestampLabel: string;
};

export type EnrollmentDetailViewModel = {
  enrollment: EnrollmentDetailReadModel;
  permissions: EnrollmentPermissionSet;
  history: EnrollmentHistoryPresentationItem[];
  historyState: EnrollmentHistoryLoadState;
  ownerLabel: string;
  sourceLabel: string;
  organizationTimezone: string;
  backHref: string;
  customerLabel: string;
  programLabel: string;
  customerHref?: string;
  programHref?: string;
  operational: EnrollmentOperationalSnapshot;
};

export type EnrollmentDetailPageResult =
  | {
      kind: "ready";
      data: EnrollmentDetailViewModel;
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: EnrollmentRole;
      moduleAccess: ProductModuleAccessState;
    }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState }
  | { kind: "auth_required" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "organization_unavailable" }
  | { kind: "org_context_missing"; message: string }
  | { kind: "enrollment_unavailable"; backHref: string }
  | { kind: "query_error"; message: string };

function isValidEnrollmentId(enrollmentId: string): boolean {
  return ENROLLMENT_ID_PATTERN.test(enrollmentId);
}

function mapHistory(
  entries: EnrollmentStatusHistoryEntry[],
  timeZone: string,
  actorLabels: Record<string, string>,
): EnrollmentHistoryPresentationItem[] {
  return entries.map((entry) => ({
    id: entry.id,
    transitionLabel: formatEnrollmentHistoryTransition(entry),
    fromStatusLabel: entry.fromStatusLabel,
    toStatusLabel: entry.toStatusLabel,
    sourceLabel: formatEnrollmentSourceLabel(entry.source),
    reason: entry.reason,
    actorLabel: resolveMemberLabel(entry.changedByMemberId, actorLabels),
    timestampLabel: formatEnrollmentDate(entry.changedAt, timeZone),
  }));
}

export async function loadEnrollmentDetailPage(
  supabase: SupabaseClient<Database>,
  enrollmentId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<EnrollmentDetailPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveEnrollmentPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }
  if (orgResult.kind === "organization_unavailable") {
    return { kind: "organization_unavailable" };
  }
  if (orgResult.kind === "organization_required") {
    return { kind: "organization_required", organizations: orgResult.organizations };
  }
  if (orgResult.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: orgResult.message };
  }
  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message };
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
  const backHref = buildBackToEnrollmentsHref(listState);

  if (!isValidEnrollmentId(enrollmentId)) {
    return { kind: "enrollment_unavailable", backHref };
  }

  const detailResult = await loadEnrollmentDetailFoundation({
    supabase,
    organizationId: orgResult.organizationId,
    role: orgResult.role,
    enrollmentId,
  });

  if (!detailResult.ok) {
    if (
      detailResult.error.code === "ENROLLMENT_UNAVAILABLE" ||
      detailResult.error.category === "not_found" ||
      detailResult.error.category === "permission"
    ) {
      return { kind: "enrollment_unavailable", backHref };
    }
    return { kind: "query_error", message: detailResult.error.message };
  }

  const { enrollment, capabilities, history, historyState } = detailResult.data;

  const actorLabels = await resolveMemberLabels(
    supabase,
    orgResult.organizationId,
    history.map((entry) => entry.changedByMemberId),
  );
  const ownerLabels = await resolveMemberLabels(supabase, orgResult.organizationId, [
    enrollment.ownerMemberId,
  ]);

  const customerLabel = enrollment.customer?.displayName ?? "Unavailable customer";
  const programLabel = enrollment.program?.name ?? "Unavailable program";
  const customerHref = enrollment.customer
    ? `/customers/${encodeURIComponent(enrollment.customer.id)}?org=${encodeURIComponent(orgResult.organizationId)}`
    : undefined;
  const programHref = enrollment.program
    ? `/programs/${encodeURIComponent(enrollment.program.id)}?org=${encodeURIComponent(orgResult.organizationId)}`
    : undefined;

  const operational = await loadEnrollmentOperationalSnapshot({
    supabase,
    organizationId: orgResult.organizationId,
    enrollmentId: enrollment.id,
    enrollmentStatus: enrollment.status,
    enrollmentCreatedAt: enrollment.createdAt,
    enrollmentArchivedAt: enrollment.archivedAt,
    role: orgResult.role,
  });

  return {
    kind: "ready",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    role: orgResult.role,
    moduleAccess: orgResult.moduleAccess,
    data: {
      enrollment,
      permissions: capabilities,
      history: mapHistory(history, orgResult.timezone, actorLabels),
      historyState,
      ownerLabel: resolveMemberLabel(enrollment.ownerMemberId, ownerLabels),
      sourceLabel: formatEnrollmentSourceLabel(enrollment.source),
      organizationTimezone: orgResult.timezone,
      backHref,
      customerLabel,
      programLabel,
      customerHref,
      programHref,
      operational,
    },
  };
}
