import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadListReadResult } from "@/features/leads/domain/read-types";
import type { LeadApplicationError } from "@/features/leads/domain/types";
import type { LeadPipelineStageOption } from "@/features/leads/domain/pipeline-stage";
import {
  listLeadPipelineStageOptions,
  listLeads,
} from "@/features/leads/server/lead-read-queries";
import { resolveLeadPageOrganization } from "@/features/leads/server/resolve-lead-page-organization";
import {
  loadCustomerMemberFilterOptions,
  type CustomerMemberOption,
} from "@/features/customers/server/load-customer-member-filter-options";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildLeadListQueryString,
  parseLeadListSearchParams,
  type LeadListUrlState,
} from "@/features/leads/ui/lead-list-search-params";
import type { Database } from "@/types/database";

export type LeadsPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  organizationName: string;
  role: OrganizationOption["role"];
  timeZone: string;
  urlState: LeadListUrlState;
  list: LeadListReadResult;
  ownerOptions: CustomerMemberOption[];
  stageOptions: LeadPipelineStageOption[];
  filterWarning: string | null;
};

export type LeadsPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string; error?: LeadApplicationError; retryable?: boolean }
  | LeadsPageSuccess;

export async function loadLeadsPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadsPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveLeadPageOrganization(supabase, orgParam);

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

  const ownerOptions = await loadCustomerMemberFilterOptions(
    supabase,
    orgResult.organizationId,
  );

  const stageResult = await listLeadPipelineStageOptions({
    supabase,
    organizationId: orgResult.organizationId,
  });

  const stageOptions = stageResult.ok ? stageResult.data : [];

  const parsed = parseLeadListSearchParams(rawSearchParams, {
    role: orgResult.role,
    ownerOptions: ownerOptions.map((option) => option.value),
    stageOptions: stageOptions.map((option) => option.stageId),
  });

  const urlState: LeadListUrlState = {
    ...parsed.urlState,
    org: orgResult.organizationId,
  };

  const listResult = await listLeads({
    supabase,
    organizationId: orgResult.organizationId,
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
    timeZone: orgResult.timezone,
    urlState,
    list: listResult.data,
    ownerOptions,
    stageOptions,
    filterWarning,
  };
}

export function leadsPageRetryHref(urlState: LeadListUrlState): string {
  return `/leads${buildLeadListQueryString(urlState)}`;
}
