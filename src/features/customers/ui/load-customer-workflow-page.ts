import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import type { CustomerRole } from "@/features/customers/domain/types";
import { getCustomerById } from "@/features/customers/server/customer-read-queries";
import {
  loadCustomerMemberFilterOptions,
  MAX_CUSTOMER_MEMBER_OPTIONS,
  type CustomerMemberOption,
} from "@/features/customers/server/load-customer-member-filter-options";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildCustomerDetailHref,
  parseCustomerListReturnState,
} from "@/features/customers/ui/customer-navigation";
import type { CustomerListUrlState } from "@/features/customers/ui/customer-list-search-params";
import {
  canShowCreateWorkflow,
  canShowEditWorkflow,
} from "@/features/customers/ui/customer-workflow-visibility";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import type { Database } from "@/types/database";

const CUSTOMER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type WorkflowOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

type WorkflowOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: CustomerRole;
  timeZone: string;
  listState: CustomerListUrlState;
};

export type CustomerOwnerFormOptions = {
  members: CustomerMemberOption[];
  capped: boolean;
  loadError?: string;
};

async function resolveWorkflowOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<WorkflowOrgFailure | WorkflowOrgReady> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveCustomerPageOrganization(supabase, orgParam);

  if (orgResult.kind !== "ready") {
    return orgResult;
  }

  const listState: CustomerListUrlState = {
    ...parseCustomerListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };

  return {
    kind: "ready",
    organizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    timeZone: orgResult.timezone,
    listState,
  };
}

export async function loadCustomerOwnerFormOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<CustomerOwnerFormOptions> {
  try {
    const members = await loadCustomerMemberFilterOptions(supabase, organizationId);
    return {
      members,
      capped: members.length >= MAX_CUSTOMER_MEMBER_OPTIONS,
    };
  } catch {
    return {
      members: [],
      capped: false,
      loadError: "Owner options could not be loaded. You can still save the customer without an owner.",
    };
  }
}

export type CustomerCreatePageResult =
  | WorkflowOrgFailure
  | { kind: "action_unavailable"; listState: CustomerListUrlState }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: CustomerRole;
      timeZone: string;
      listState: CustomerListUrlState;
      ownerOptions: CustomerOwnerFormOptions;
    };

export async function loadCustomerCreatePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CustomerCreatePageResult> {
  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  if (!canShowCreateWorkflow(org.role)) {
    return { kind: "action_unavailable", listState: org.listState };
  }

  const ownerOptions = await loadCustomerOwnerFormOptions(supabase, org.organizationId);

  return {
    kind: "ready",
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    ownerOptions,
  };
}

export type CustomerEditPageResult =
  | WorkflowOrgFailure
  | { kind: "invalid_customer" }
  | { kind: "customer_unavailable"; listState: CustomerListUrlState }
  | { kind: "action_unavailable"; message: string; backHref: string }
  | {
      kind: "ready";
      customer: CustomerDetailReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: CustomerRole;
      timeZone: string;
      listState: CustomerListUrlState;
      backHref: string;
      ownerOptions: CustomerOwnerFormOptions;
    };

export async function loadCustomerEditPage(
  supabase: SupabaseClient<Database>,
  customerId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CustomerEditPageResult> {
  if (!CUSTOMER_ID_PATTERN.test(customerId)) {
    return { kind: "invalid_customer" };
  }

  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  const customerResult = await getCustomerById({
    supabase,
    organizationId: org.organizationId,
    customerId,
  });

  const backHref = buildCustomerDetailHref(customerId, org.listState);

  if (!customerResult.ok) {
    return { kind: "customer_unavailable", listState: org.listState };
  }

  const customer = customerResult.data;

  if (!canShowEditWorkflow(customer, org.role)) {
    const permissions = resolveCustomerPermissions(org.role, {
      isArchived: customer.derived.isArchived,
    });
    const message = customer.derived.isArchived
      ? "Archived customers cannot be edited."
      : !permissions.canEditCustomer
        ? "You do not have permission to edit this customer."
        : "This customer cannot be edited in its current state.";
    return { kind: "action_unavailable", message, backHref };
  }

  const ownerOptions = await loadCustomerOwnerFormOptions(supabase, org.organizationId);

  return {
    kind: "ready",
    customer,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    backHref,
    ownerOptions,
  };
}
