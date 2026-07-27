import type { SupabaseClient } from "@supabase/supabase-js";
import type { EnrollmentListReadResult } from "@/features/enrollments/domain/read-types";
import type { EnrollmentApplicationError } from "@/features/enrollments/domain/types";
import { loadEnrollmentsListFoundation } from "@/features/enrollments/server/load-enrollment-foundations";
import { resolveEnrollmentPageOrganization } from "@/features/enrollments/server/resolve-enrollment-page-organization";
import { resolveMemberLabels } from "@/features/enrollments/server/resolve-enrollment-labels";
import { resolveEnrollmentListContext } from "@/features/enrollments/server/resolve-enrollment-list-context";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildEnrollmentListQueryString,
  parseEnrollmentListSearchParams,
  type EnrollmentListUrlState,
} from "@/features/enrollments/ui/enrollment-list-search-params";
import type { Database } from "@/types/database";
import type {
  EnrollmentPermissionSet,
  EnrollmentRole,
} from "@/features/enrollments/domain/types";

export type EnrollmentListRelationshipContext = {
  customerLabel?: string;
  programLabel?: string;
  customerId?: string;
  programId?: string;
};

export type EnrollmentsPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  organizationName: string;
  role: EnrollmentRole;
  capabilities: EnrollmentPermissionSet;
  timeZone: string;
  urlState: EnrollmentListUrlState;
  list: EnrollmentListReadResult;
  ownerLabels: Record<string, string>;
  filterWarning: string | null;
  context: EnrollmentListRelationshipContext | null;
};

export type EnrollmentsPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | {
      kind: "query_error";
      message: string;
      error?: EnrollmentApplicationError;
      retryable?: boolean;
    }
  | { kind: "context_unavailable"; message: string; backHref: string }
  | EnrollmentsPageSuccess;

const CONTEXT_UNAVAILABLE_MESSAGE =
  "This enrollment context is unavailable. It may have been removed or you may not have access.";

export async function loadEnrollmentsPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<EnrollmentsPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveEnrollmentPageOrganization(supabase, orgParam);

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

  const parsed = parseEnrollmentListSearchParams(rawSearchParams, {
    role: orgResult.role,
  });

  const urlState: EnrollmentListUrlState = {
    ...parsed.urlState,
    org: orgResult.organizationId,
  };

  let context: EnrollmentListRelationshipContext | null = null;
  if (urlState.customerId || urlState.programId) {
    const contextResult = await resolveEnrollmentListContext(supabase, orgResult.organizationId, {
      customerId: urlState.customerId,
      programId: urlState.programId,
    });

    if (contextResult.kind === "unavailable") {
      return {
        kind: "context_unavailable",
        message: CONTEXT_UNAVAILABLE_MESSAGE,
        backHref: `/enrollments${buildEnrollmentListQueryString({
          org: orgResult.organizationId,
          archived: false,
          sort: urlState.sort,
          direction: urlState.direction,
          page: 1,
          pageSize: urlState.pageSize,
        })}`,
      };
    }

    context = {
      customerLabel: contextResult.customerLabel,
      programLabel: contextResult.programLabel,
      customerId: urlState.customerId,
      programId: urlState.programId,
    };
  }

  const listResult = await loadEnrollmentsListFoundation({
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

  const ownerLabels = await resolveMemberLabels(
    supabase,
    orgResult.organizationId,
    listResult.data.result.items.map((item) => item.ownerMemberId),
  );

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
    ownerLabels,
    filterWarning,
    context,
  };
}

export function enrollmentsPageRetryHref(urlState: EnrollmentListUrlState): string {
  return `/enrollments${buildEnrollmentListQueryString(urlState)}`;
}
