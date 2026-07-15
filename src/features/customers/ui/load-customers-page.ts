import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerListReadResult } from "@/features/customers/domain/read-types";
import type { CustomerApplicationError } from "@/features/customers/domain/types";
import { listCustomers } from "@/features/customers/server/customer-read-queries";
import { loadCustomerMemberFilterOptions } from "@/features/customers/server/load-customer-member-filter-options";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildCustomerListQueryString,
  parseCustomerListSearchParams,
  type CustomerListUrlState,
} from "@/features/customers/ui/customer-list-search-params";
import type { CustomerMemberOption } from "@/features/customers/server/load-customer-member-filter-options";
import type { Database } from "@/types/database";

export type CustomersPageSuccess = {
  kind: "success";
  organizationOptions: OrganizationOption[];
  selectedOrganizationId: string;
  organizationName: string;
  role: OrganizationOption["role"];
  timeZone: string;
  urlState: CustomerListUrlState;
  list: CustomerListReadResult;
  ownerOptions: CustomerMemberOption[];
  filterWarning: string | null;
};

export type CustomersPageResult =
  | { kind: "auth_required" }
  | { kind: "no_organizations" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string; error?: CustomerApplicationError; retryable?: boolean }
  | CustomersPageSuccess;

export async function loadCustomersPage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CustomersPageResult> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveCustomerPageOrganization(supabase, orgParam);

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

  const parsed = parseCustomerListSearchParams(rawSearchParams, {
    role: orgResult.role,
    ownerOptions: ownerOptions.map((option) => option.value),
  });

  const urlState: CustomerListUrlState = {
    ...parsed.urlState,
    org: orgResult.organizationId,
  };

  const listResult = await listCustomers({
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
    filterWarning,
  };
}

export function customersPageRetryHref(urlState: CustomerListUrlState): string {
  return `/customers${buildCustomerListQueryString(urlState)}`;
}
