import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgressListReadResult } from "@/features/progress/domain/read-types";
import type {
  ProgressApplicationError,
  ProgressPermissionSet,
  ProgressRole,
} from "@/features/progress/domain/types";
import { loadProgressListFoundation } from "@/features/progress/server/load-progress-foundations";
import { resolveProgressPageOrganization } from "@/features/progress/server/resolve-progress-page-organization";
import {
  resolveMemberLabels,
} from "@/features/enrollments/server/resolve-enrollment-labels";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildProgressListQueryString,
  parseProgressListSearchParams,
  type ProgressListUrlState,
} from "@/features/progress/ui/progress-list-search-params";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";

export type ProgressListRelationshipContext = {
  enrollmentId?: string;
  customerId?: string;
  programId?: string;
};

export type ProgressListPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  organizationName: string;
  role: ProgressRole;
  capabilities: ProgressPermissionSet;
  timeZone: string;
  urlState: ProgressListUrlState;
  list: ProgressListReadResult;
  recorderLabels: Record<string, string>;
  filterWarning: string | null;
  context: ProgressListRelationshipContext | null;
};

export type ProgressListPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | {
      kind: "query_error";
      message: string;
      error?: ProgressApplicationError;
      retryable?: boolean;
    }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState }
  | (ProgressListPageSuccess & { moduleAccess: ProductModuleAccessState });

function filterWarningMessage(warnings: string[]): string | null {
  if (warnings.includes("include_voided_not_allowed")) {
    return "Voided progress records are only available to owners and admins. That filter was ignored.";
  }
  if (warnings.length > 0) {
    return "Some filters were adjusted because they were invalid or not allowed for your role.";
  }
  return null;
}

export function progressListPageRetryHref(urlState: ProgressListUrlState): string {
  return `/progress${buildProgressListQueryString(urlState)}`;
}

export async function loadProgressListPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgressListPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveProgressPageOrganization(supabase, orgParam);

  if (orgResult.kind === "auth_required") {
    return { kind: "auth_required" };
  }

  if (orgResult.kind === "organization_unavailable") {
    return { kind: "no_organizations" };
  }

  if (orgResult.kind === "organization_required") {
    return { kind: "organization_required", organizations: orgResult.organizations };
  }

  if (orgResult.kind === "org_context_missing") {
    return { kind: "org_context_missing", message: orgResult.message };
  }

  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message, retryable: true };
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

  const parsed = parseProgressListSearchParams(rawSearchParams, {
    role: orgResult.role,
  });

  const urlState: ProgressListUrlState = {
    ...parsed.urlState,
    org: orgResult.organizationId,
  };

  const foundation = await loadProgressListFoundation({
    supabase,
    organizationId: orgResult.organizationId,
    role: orgResult.role,
    filters: parsed.listInput.filters,
    pagination: parsed.listInput.pagination,
    sort: parsed.listInput.sort,
  });

  if (!foundation.ok) {
    return {
      kind: "query_error",
      message: foundation.error.message,
      error: foundation.error,
      retryable: foundation.error.retryable,
    };
  }

  const recorderLabels = await resolveMemberLabels(
    supabase,
    orgResult.organizationId,
    foundation.data.result.items.map((item) => item.recordedByMemberId),
  );

  const context: ProgressListRelationshipContext | null =
    urlState.enrollmentId || urlState.customerId || urlState.programId
      ? {
          enrollmentId: urlState.enrollmentId,
          customerId: urlState.customerId,
          programId: urlState.programId,
        }
      : null;

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    organizationName: orgResult.organizationName,
    role: orgResult.role,
    capabilities: foundation.data.capabilities,
    timeZone: orgResult.timezone,
    urlState,
    list: foundation.data.result,
    recorderLabels,
    filterWarning: filterWarningMessage(parsed.warnings),
    context,
    moduleAccess: orgResult.moduleAccess,
  };
}
