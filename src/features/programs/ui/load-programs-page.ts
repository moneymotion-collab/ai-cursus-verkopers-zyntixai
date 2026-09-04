import type { SupabaseClient } from "@supabase/supabase-js";
import type { ProgramListReadResult } from "@/features/programs/domain/read-types";
import type { ProgramApplicationError } from "@/features/programs/domain/types";
import { loadProgramsListFoundation } from "@/features/programs/server/load-program-foundations";
import { resolveProgramPageOrganization } from "@/features/programs/server/resolve-program-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildProgramListQueryString,
  parseProgramListSearchParams,
  type ProgramListUrlState,
} from "@/features/programs/ui/program-list-search-params";
import { evaluateProductModuleRouteAccess } from "@/features/product-access/server/enforce-product-module-access";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { Database } from "@/types/database";
import type { ProgramPermissionSet, ProgramRole } from "@/features/programs/domain/types";

export type ProgramsPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  organizationName: string;
  role: ProgramRole;
  capabilities: ProgramPermissionSet;
  timeZone: string;
  urlState: ProgramListUrlState;
  list: ProgramListReadResult;
  filterWarning: string | null;
};

export type ProgramsPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "forbidden"; message: string; moduleAccess: ProductModuleAccessState }
  | { kind: "query_error"; message: string; error?: ProgramApplicationError; retryable?: boolean }
  | (ProgramsPageSuccess & { moduleAccess: ProductModuleAccessState });

export async function loadProgramsPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<ProgramsPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveProgramPageOrganization(supabase, orgParam);

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
    return { kind: "query_error", message: orgResult.message };
  }

  const routeAccess = evaluateProductModuleRouteAccess({
    moduleId: "programs",
    access: orgResult.moduleAccess,
  });
  if (!routeAccess.allowed) {
    return {
      kind: "forbidden",
      message: routeAccess.message,
      moduleAccess: orgResult.moduleAccess,
    };
  }

  const parsed = parseProgramListSearchParams(rawSearchParams, {
    role: orgResult.role,
  });

  const urlState: ProgramListUrlState = {
    ...parsed.urlState,
    org: orgResult.organizationId,
  };

  const listResult = await loadProgramsListFoundation({
    supabase,
    organizationId: orgResult.organizationId,
    role: orgResult.role,
    filters: parsed.listInput.filters,
    pagination: parsed.listInput.pagination,
    sort: parsed.listInput.sort,
  });

  if (!listResult.ok) {
    return {
      kind: "query_error",
      message: listResult.error.message,
      error: listResult.error,
      retryable: listResult.error.retryable,
    };
  }

  const filterWarning =
    parsed.warnings.length > 0
      ? "Some filters were reset because they were invalid."
      : null;

  return {
    kind: "success",
    organizationOptions: orgResult.organizationOptions,
    selectedOrganizationId: orgResult.organizationId,
    organizationName: orgResult.organizationName,
    role: orgResult.role,
    capabilities: listResult.data.capabilities,
    timeZone: orgResult.timezone,
    urlState,
    list: listResult.data.result,
    filterWarning,
    moduleAccess: orgResult.moduleAccess,
  };
}

export function programsPageRetryHref(urlState: ProgramListUrlState): string {
  return `/programs${buildProgramListQueryString(urlState)}`;
}
