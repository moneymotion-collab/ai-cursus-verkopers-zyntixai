import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadPipelineStageOption } from "@/features/leads/domain/pipeline-stage";
import type { LeadRole, LeadStatus } from "@/features/leads/domain/types";
import { getAllowedLeadStatusTransitions } from "@/features/leads/domain/status";
import { resolveLeadPermissions } from "@/features/leads/domain/permissions";
import { getLeadById, listLeadPipelineStageOptions } from "@/features/leads/server/lead-read-queries";
import { resolveLeadPageOrganization } from "@/features/leads/server/resolve-lead-page-organization";
import {
  loadCustomerMemberFilterOptions,
  MAX_CUSTOMER_MEMBER_OPTIONS,
  type CustomerMemberOption,
} from "@/features/customers/server/load-customer-member-filter-options";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  buildLeadDetailHref,
  parseLeadListReturnState,
} from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import {
  canShowArchiveLeadWorkflow,
  canShowConvertLeadWorkflow,
  canShowCreateLeadWorkflow,
  canShowEditLeadWorkflow,
  canShowRestoreLeadWorkflow,
  canShowStageLeadWorkflow,
  canShowStatusLeadWorkflow,
} from "@/features/leads/ui/lead-workflow-visibility";
import type { Database } from "@/types/database";

const LEAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_CONVERT_CUSTOMER_OPTIONS = 100;

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
  role: LeadRole;
  timeZone: string;
  listState: LeadListUrlState;
};

export type LeadOwnerFormOptions = {
  members: CustomerMemberOption[];
  capped: boolean;
  loadError?: string;
};

export type LeadConvertCustomerOption = {
  value: string;
  label: string;
};

export type LeadConvertCustomerOptions = {
  customers: LeadConvertCustomerOption[];
  capped: boolean;
  loadError?: string;
};

export type LeadWorkflowPageBase =
  | WorkflowOrgFailure
  | { kind: "invalid_lead" }
  | { kind: "lead_unavailable"; listState: LeadListUrlState }
  | { kind: "action_unavailable"; message: string; backHref: string }
  | {
      kind: "ready";
      lead: LeadDetailReadModel;
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: LeadRole;
      timeZone: string;
      listState: LeadListUrlState;
      backHref: string;
    };

const ACTION_UNAVAILABLE_MESSAGES = {
  edit: "This lead cannot be edited in its current state.",
  stage: "This lead's pipeline stage cannot be changed in its current state.",
  status: "This lead's status cannot be changed in its current state.",
  convert: "This lead cannot be converted in its current state.",
  archive: "This lead cannot be archived in its current state.",
  restore: "This lead cannot be restored in its current state.",
} as const;

type LifecycleAction = keyof typeof ACTION_UNAVAILABLE_MESSAGES;

async function resolveWorkflowOrganization(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<WorkflowOrgFailure | WorkflowOrgReady> {
  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveLeadPageOrganization(supabase, orgParam);

  if (orgResult.kind !== "ready") {
    return orgResult;
  }

  const listState: LeadListUrlState = {
    ...parseLeadListReturnState(rawSearchParams, orgResult.role),
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

export async function loadLeadOwnerFormOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<LeadOwnerFormOptions> {
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
      loadError: "Owner options could not be loaded. You can still save the lead without an owner.",
    };
  }
}

export async function loadLeadConvertCustomerOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<LeadConvertCustomerOptions> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("id, display_name")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("display_name", { ascending: true })
      .limit(MAX_CONVERT_CUSTOMER_OPTIONS + 1);

    if (error) {
      return {
        customers: [],
        capped: false,
        loadError: "Customer options could not be loaded. You can still create a new customer from this lead.",
      };
    }

    const rows = data ?? [];
    return {
      customers: rows.slice(0, MAX_CONVERT_CUSTOMER_OPTIONS).map((row) => ({
        value: row.id,
        label: row.display_name?.trim() || "Customer",
      })),
      capped: rows.length > MAX_CONVERT_CUSTOMER_OPTIONS,
    };
  } catch {
    return {
      customers: [],
      capped: false,
      loadError: "Customer options could not be loaded. You can still create a new customer from this lead.",
    };
  }
}

async function loadLeadWorkflowPage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
  action: LifecycleAction,
  canShow: (lead: LeadDetailReadModel, role: LeadRole) => boolean,
): Promise<LeadWorkflowPageBase> {
  if (!LEAD_ID_PATTERN.test(leadId)) {
    return { kind: "invalid_lead" };
  }

  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  const leadResult = await getLeadById({
    supabase,
    organizationId: org.organizationId,
    leadId,
  });

  const backHref = buildLeadDetailHref(leadId, org.listState);

  if (!leadResult.ok) {
    return { kind: "lead_unavailable", listState: org.listState };
  }

  const lead = leadResult.data;
  const permissions = resolveLeadPermissions(org.role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });

  if (!permissions.canViewLead) {
    return { kind: "lead_unavailable", listState: org.listState };
  }

  if (!canShow(lead, org.role)) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES[action],
      backHref,
    };
  }

  return {
    kind: "ready",
    lead,
    organizationId: org.organizationId,
    organizationOptions: org.organizationOptions,
    role: org.role,
    timeZone: org.timeZone,
    listState: org.listState,
    backHref,
  };
}

export type LeadCreatePageResult =
  | WorkflowOrgFailure
  | { kind: "action_unavailable"; listState: LeadListUrlState }
  | {
      kind: "ready";
      organizationId: string;
      organizationOptions: OrganizationOption[];
      role: LeadRole;
      timeZone: string;
      listState: LeadListUrlState;
      ownerOptions: LeadOwnerFormOptions;
    };

export async function loadLeadCreatePage(
  supabase: SupabaseClient<Database>,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadCreatePageResult> {
  const org = await resolveWorkflowOrganization(supabase, rawSearchParams);
  if (org.kind !== "ready") {
    return org;
  }

  if (!canShowCreateLeadWorkflow(org.role)) {
    return { kind: "action_unavailable", listState: org.listState };
  }

  const ownerOptions = await loadLeadOwnerFormOptions(supabase, org.organizationId);

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

export type LeadEditPageResult = LeadWorkflowPageBase & {
  ownerOptions?: LeadOwnerFormOptions;
};

export async function loadLeadEditPage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadEditPageResult> {
  const result = await loadLeadWorkflowPage(
    supabase,
    leadId,
    rawSearchParams,
    "edit",
    canShowEditLeadWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const ownerOptions = await loadLeadOwnerFormOptions(supabase, result.organizationId);
  return { ...result, ownerOptions };
}

export type LeadStagePageResult = LeadWorkflowPageBase & {
  stageOptions?: LeadPipelineStageOption[];
};

export async function loadLeadStagePage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadStagePageResult> {
  const result = await loadLeadWorkflowPage(
    supabase,
    leadId,
    rawSearchParams,
    "stage",
    canShowStageLeadWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const stageResult = await listLeadPipelineStageOptions({
    supabase,
    organizationId: result.organizationId,
  });

  const stageOptions = stageResult.ok
    ? stageResult.data.filter((option) => option.stageId !== result.lead.stage.stageId)
    : [];

  if (stageOptions.length === 0) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES.stage,
      backHref: result.backHref,
    };
  }

  return { ...result, stageOptions };
}

export type LeadStatusPageResult = LeadWorkflowPageBase & {
  allowedTargets?: LeadStatus[];
};

export async function loadLeadStatusPage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadStatusPageResult> {
  const result = await loadLeadWorkflowPage(
    supabase,
    leadId,
    rawSearchParams,
    "status",
    canShowStatusLeadWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const allowedTargets = getAllowedLeadStatusTransitions(result.lead.status);

  if (allowedTargets.length === 0) {
    return {
      kind: "action_unavailable",
      message: ACTION_UNAVAILABLE_MESSAGES.status,
      backHref: result.backHref,
    };
  }

  return { ...result, allowedTargets };
}

export type LeadConvertPageResult = LeadWorkflowPageBase & {
  customerOptions?: LeadConvertCustomerOptions;
};

export async function loadLeadConvertPage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadConvertPageResult> {
  const result = await loadLeadWorkflowPage(
    supabase,
    leadId,
    rawSearchParams,
    "convert",
    canShowConvertLeadWorkflow,
  );

  if (result.kind !== "ready") {
    return result;
  }

  const customerOptions = await loadLeadConvertCustomerOptions(supabase, result.organizationId);
  return { ...result, customerOptions };
}

export type LeadArchivePageResult = LeadWorkflowPageBase;

export function loadLeadArchivePage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadArchivePageResult> {
  return loadLeadWorkflowPage(
    supabase,
    leadId,
    rawSearchParams,
    "archive",
    canShowArchiveLeadWorkflow,
  );
}

export type LeadRestorePageResult = LeadWorkflowPageBase;

export function loadLeadRestorePage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadRestorePageResult> {
  return loadLeadWorkflowPage(
    supabase,
    leadId,
    rawSearchParams,
    "restore",
    canShowRestoreLeadWorkflow,
  );
}
