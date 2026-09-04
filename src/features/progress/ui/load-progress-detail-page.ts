import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressFactDetailReadModel } from "@/features/progress/domain/read-types";
import type {
  ProgressPermissionSet,
  ProgressRole,
} from "@/features/progress/domain/types";
import { loadProgressDetailFoundation } from "@/features/progress/server/load-progress-foundations";
import { resolveProgressPageOrganization } from "@/features/progress/server/resolve-progress-page-organization";
import {
  resolveMemberLabel,
  resolveMemberLabels,
} from "@/features/enrollments/server/resolve-enrollment-labels";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildProgressListQueryString,
  parseProgressListReturnState,
  type ProgressListUrlState,
} from "@/features/progress/ui/progress-list-search-params";
import {
  formatOptionalProgressDate,
  formatProgressDate,
  resolveProgressCustomerLabel,
  resolveProgressEnrollmentStatusLabel,
  resolveProgressFactTitle,
  resolveProgressProgramLabel,
} from "@/features/progress/ui/progress-presentation";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

const FACT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ProgressDetailViewModel = {
  fact: ProgressFactDetailReadModel;
  titleLabel: string;
  customerLabel: string;
  programLabel: string;
  enrollmentStatusLabel: string;
  enrollmentArchived: boolean;
  recorderLabel: string;
  voidedByLabel: string | null;
  occurredAtLabel: string;
  recordedAtLabel: string;
  voidedAtLabel: string | null;
  customerHref: string | null;
  programHref: string | null;
  enrollmentHref: string | null;
  correctedFromHref: string | null;
  backHref: string;
  organizationTimezone: string;
};

export type ProgressDetailPageResult =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string }
  | { kind: "progress_unavailable"; backHref: string }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState }
  | {
      kind: "success";
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: ProgressRole;
      capabilities: ProgressPermissionSet;
      data: ProgressDetailViewModel;
      moduleAccess: ProductModuleAccessState;
    };

function buildBackHref(listState: ProgressListUrlState): string {
  return `/progress${buildProgressListQueryString(listState)}`;
}

export async function loadProgressDetailPage(
  supabase: SupabaseClient<Database>,
  factId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgressDetailPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveProgressPageOrganization(supabase, orgParam);

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
    moduleId: "progress",
    access: orgResult.moduleAccess,
  });
  if (!routeAccess.allowed) {
    return {
      kind: "forbidden",
      message: routeAccess.message,
      moduleAccess: orgResult.moduleAccess,
    };
  }

  const listState = {
    ...parseProgressListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };
  const backHref = buildBackHref(listState);

  if (!FACT_ID_PATTERN.test(factId)) {
    return { kind: "progress_unavailable", backHref };
  }

  const foundation = await loadProgressDetailFoundation({
    supabase,
    organizationId: orgResult.organizationId,
    role: orgResult.role,
    progressFactId: factId,
  });

  if (!foundation.ok) {
    if (
      foundation.error.code === "PROGRESS_FACT_UNAVAILABLE" ||
      foundation.error.code === "PERMISSION_DENIED" ||
      foundation.error.code === "INSUFFICIENT_ROLE"
    ) {
      return { kind: "progress_unavailable", backHref };
    }
    return { kind: "query_error", message: foundation.error.message };
  }

  const fact = foundation.data.fact;
  const memberLabels = await resolveMemberLabels(
    supabase,
    orgResult.organizationId,
    [fact.recordedByMemberId, fact.voidedByMemberId],
  );

  const customerLabel = resolveProgressCustomerLabel(fact.customer?.displayName);
  const programLabel = resolveProgressProgramLabel(fact.program?.name);

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    role: orgResult.role,
    capabilities: foundation.data.capabilities,
    moduleAccess: orgResult.moduleAccess,
    data: {
      fact,
      titleLabel: resolveProgressFactTitle(fact),
      customerLabel,
      programLabel,
      enrollmentStatusLabel: resolveProgressEnrollmentStatusLabel(
        fact.enrollment?.status,
      ),
      enrollmentArchived: fact.enrollment?.archivedAt != null,
      recorderLabel: resolveMemberLabel(fact.recordedByMemberId, memberLabels),
      voidedByLabel: fact.voidedByMemberId
        ? resolveMemberLabel(fact.voidedByMemberId, memberLabels)
        : null,
      occurredAtLabel: formatProgressDate(fact.occurredAt, orgResult.timezone),
      recordedAtLabel: formatProgressDate(fact.recordedAt, orgResult.timezone),
      voidedAtLabel: formatOptionalProgressDate(fact.voidedAt, orgResult.timezone),
      customerHref: fact.customer
        ? `/customers/${fact.customer.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      programHref: fact.program
        ? `/programs/${fact.program.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      enrollmentHref: fact.enrollment
        ? `/enrollments/${fact.enrollment.id}?org=${encodeURIComponent(orgResult.organizationId)}`
        : null,
      correctedFromHref: fact.correctedFromFactId
        ? `/progress/${fact.correctedFromFactId}${buildProgressListQueryString(listState)}`
        : null,
      backHref,
      organizationTimezone: orgResult.timezone,
    },
  };
}
