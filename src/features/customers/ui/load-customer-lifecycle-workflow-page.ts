import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import type { CustomerRole, CustomerStatus } from "@/features/customers/domain/types";
import { getAllowedCustomerStatusTransitions } from "@/features/customers/domain/status";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import { getCustomerById } from "@/features/customers/server/customer-read-queries";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildCustomerDetailHref,
  parseCustomerListReturnState,
} from "@/features/customers/ui/customer-navigation";
import type { CustomerListUrlState } from "@/features/customers/ui/customer-list-search-params";
import {
  canShowArchiveWorkflow,
  canShowRestoreWorkflow,
  canShowStatusWorkflow,
} from "@/features/customers/ui/customer-workflow-visibility";
import { lifecycleActionUnavailableMessage } from "@/features/customers/ui/customer-lifecycle-workflow-copy";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import type { ProductTerminology } from "@/features/product-access/domain/terminology";
import type { Database } from "@/types/database";

const CUSTOMER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type LifecycleOrgFailure =
  | { kind: "auth_required" }
  | { kind: "organization_unavailable" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "org_context_missing"; message: string }
  | { kind: "query_error"; message: string };

type LifecycleOrgReady = {
  kind: "ready";
  organizationId: string;
  organizationOptions: OrganizationOption[];
  role: CustomerRole;
  timeZone: string;
  listState: CustomerListUrlState;
  moduleAccess: ProductModuleAccessState;
};

export type CustomerLifecycleWorkflowPageResult =
  | LifecycleOrgFailure
  | { kind: "invalid_customer" }
  | {
      kind: "customer_unavailable";
      listState: CustomerListUrlState;
      terminology: ProductTerminology;
    }
  | {
      kind: "action_unavailable";
      message: string;
      backHref: string;
      terminology: ProductTerminology;
    }
  | {
      kind: "ready";
      customer: CustomerDetailReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: CustomerRole;
      timeZone: string;
      listState: CustomerListUrlState;
      backHref: string;
      moduleAccess: ProductModuleAccessState;
    };

type LifecycleAction = "archive" | "restore" | "status";

async function resolveLifecycleOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LifecycleOrgFailure | LifecycleOrgReady> {
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
    moduleAccess: orgResult.moduleAccess,
  };
}

async function loadCustomerLifecycleWorkflowPage(
  supabase: SupabaseClient<Database>,
  customerId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  action: LifecycleAction,
  canShow: (customer: CustomerDetailReadModel, role: CustomerRole) => boolean,
): Promise<CustomerLifecycleWorkflowPageResult> {
  if (!CUSTOMER_ID_PATTERN.test(customerId)) {
    return { kind: "invalid_customer" };
  }

  const org = await resolveLifecycleOrganization(supabase, rawSearchParams);
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
    return {
      kind: "customer_unavailable",
      listState: org.listState,
      terminology: org.moduleAccess.terminology,
    };
  }

  const customer = customerResult.data;
  const permissions = resolveCustomerPermissions(org.role, {
    isArchived: customer.derived.isArchived,
  });

  if (!permissions.canViewCustomer) {
    return {
      kind: "customer_unavailable",
      listState: org.listState,
      terminology: org.moduleAccess.terminology,
    };
  }

  if (!canShow(customer, org.role)) {
    return {
      kind: "action_unavailable",
      message: lifecycleActionUnavailableMessage(action, org.moduleAccess.terminology),
      backHref,
      terminology: org.moduleAccess.terminology,
    };
  }

  return {
    kind: "ready",
    customer,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    backHref,
    moduleAccess: org.moduleAccess,
  };
}

export type CustomerStatusPageResult = CustomerLifecycleWorkflowPageResult & {
  allowedTargets?: CustomerStatus[];
};

export async function loadCustomerStatusPage(
  supabase: SupabaseClient<Database>,
  customerId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CustomerStatusPageResult> {
  const result = await loadCustomerLifecycleWorkflowPage(
    supabase,
    customerId,
    rawSearchParams,
    "status",
    canShowStatusWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const allowedTargets = getAllowedCustomerStatusTransitions(result.customer.status);

  if (allowedTargets.length === 0) {
    return {
      kind: "action_unavailable",
      message: lifecycleActionUnavailableMessage("status", result.moduleAccess.terminology),
      backHref: result.backHref,
      terminology: result.moduleAccess.terminology,
    };
  }

  return {
    ...result,
    allowedTargets,
  };
}

export function loadCustomerArchivePage(
  supabase: SupabaseClient<Database>,
  customerId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CustomerLifecycleWorkflowPageResult> {
  return loadCustomerLifecycleWorkflowPage(
    supabase,
    customerId,
    rawSearchParams,
    "archive",
    canShowArchiveWorkflow,
  );
}

export function loadCustomerRestorePage(
  supabase: SupabaseClient<Database>,
  customerId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CustomerLifecycleWorkflowPageResult> {
  return loadCustomerLifecycleWorkflowPage(
    supabase,
    customerId,
    rawSearchParams,
    "restore",
    canShowRestoreWorkflow,
  );
}
