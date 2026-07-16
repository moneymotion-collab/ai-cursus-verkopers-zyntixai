import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type {
  LeadStageHistoryEntry,
  LeadStatusHistoryEntry,
} from "@/features/leads/domain/read-types";
import type { LeadApplicationError, LeadPermissionSet, LeadRole } from "@/features/leads/domain/types";
import { resolveLeadPermissions } from "@/features/leads/domain/permissions";
import {
  getLeadById,
  listLeadRelatedTasks,
  listLeadStageHistory,
  listLeadStatusHistory,
} from "@/features/leads/server/lead-read-queries";
import { resolveLeadPageOrganization } from "@/features/leads/server/resolve-lead-page-organization";
import type { TaskListItemReadModel } from "@/features/tasks/domain/read-types";
import type { OrganizationOption } from "@/features/tasks/ui/resolve-task-organization-selection";
import {
  collectLabelReferencesFromListItems,
  emptyLabelBundle,
  resolveMemberLabel,
  resolveTaskDisplayLabels,
  type TaskDisplayLabelBundle,
} from "@/features/tasks/ui/resolve-task-display-labels";
import {
  buildBackToLeadsHref,
  buildCustomerDetailHrefFromLead,
  buildTaskDetailHrefFromLead,
  parseLeadListReturnState,
} from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import { formatLeadDate } from "@/features/leads/ui/lead-presentation";
import type { Database } from "@/types/database";

const LEAD_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type LeadStatusHistoryPresentationItem = {
  id: string;
  transitionLabel: string;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  actorLabel: string;
  sourceLabel: string;
  reason: string | null;
  timestampLabel: string;
};

export type LeadStageHistoryPresentationItem = {
  id: string;
  transitionLabel: string;
  fromStageLabel: string | null;
  toStageLabel: string;
  actorLabel: string;
  sourceLabel: string;
  reason: string | null;
  timestampLabel: string;
};

export type LeadRelatedTaskRow = {
  id: string;
  title: string;
  statusLabel: string;
  dueStateLabel: string | null;
  dueAtLabel: string;
  assigneeLabel: string;
  detailHref: string;
};

export type LeadDetailPanelErrors = {
  statusHistory?: string;
  stageHistory?: string;
  relatedTasks?: string;
};

export type LeadDetailViewModel = {
  lead: LeadDetailReadModel;
  permissions: LeadPermissionSet;
  statusHistory: LeadStatusHistoryPresentationItem[];
  statusHistoryState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  stageHistory: LeadStageHistoryPresentationItem[];
  stageHistoryState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  relatedTasks: LeadRelatedTaskRow[];
  relatedTasksState:
    | { kind: "ready" }
    | { kind: "empty" }
    | { kind: "error"; message: string }
    | { kind: "hidden" };
  convertedCustomerHref?: string;
  organizationTimezone: string;
  backHref: string;
  panelErrors: LeadDetailPanelErrors;
};

export type LeadDetailPageResult =
  | {
      kind: "ready";
      data: LeadDetailViewModel;
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: LeadRole;
    }
  | { kind: "auth_required" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "organization_unavailable" }
  | { kind: "lead_unavailable"; backHref: string }
  | { kind: "query_error"; message: string };

function isValidLeadId(leadId: string): boolean {
  return LEAD_ID_PATTERN.test(leadId);
}

function isLeadUnavailableError(error: LeadApplicationError): boolean {
  return (
    error.code === "LEAD_UNAVAILABLE" ||
    error.code === "PERMISSION_DENIED" ||
    error.code === "INVALID_INPUT"
  );
}

function buildStatusHistoryItems(
  history: LeadStatusHistoryEntry[],
  timeZone: string,
): LeadStatusHistoryPresentationItem[] {
  return history.map((entry) => {
    const fromLabel = entry.fromStatusLabel;
    const toLabel = entry.toStatusLabel;
    const transitionLabel = fromLabel
      ? `Status changed from ${fromLabel} to ${toLabel}`
      : `Status set to ${toLabel}`;

    return {
      id: entry.id,
      transitionLabel,
      fromStatusLabel: fromLabel,
      toStatusLabel: toLabel,
      actorLabel: entry.changedByLabel,
      sourceLabel: entry.source,
      reason: entry.reason,
      timestampLabel: formatLeadDate(entry.changedAt, timeZone),
    };
  });
}

function buildStageHistoryItems(
  history: LeadStageHistoryEntry[],
  timeZone: string,
): LeadStageHistoryPresentationItem[] {
  return history.map((entry) => {
    const fromLabel = entry.fromStageName;
    const toLabel = entry.toStageName;
    const transitionLabel = fromLabel
      ? `Stage changed from ${fromLabel} to ${toLabel}`
      : `Stage set to ${toLabel}`;

    return {
      id: entry.id,
      transitionLabel,
      fromStageLabel: fromLabel,
      toStageLabel: toLabel,
      actorLabel: entry.changedByLabel,
      sourceLabel: entry.source,
      reason: entry.reason,
      timestampLabel: formatLeadDate(entry.changedAt, timeZone),
    };
  });
}

function buildRelatedTaskRows(
  tasks: TaskListItemReadModel[],
  labelBundle: TaskDisplayLabelBundle,
  organizationId: string,
  timeZone: string,
): LeadRelatedTaskRow[] {
  return tasks.map((task) => {
    const assigneeLabel = resolveMemberLabel(task.assigneeMemberId, labelBundle);

    const dueStateLabel =
      task.status === "open" && !task.derived.terminal && task.derived.dueState !== "none"
        ? task.derived.dueState === "overdue"
          ? "Overdue"
          : task.derived.dueState === "due_today"
            ? "Due today"
            : task.derived.dueState === "upcoming"
              ? "Upcoming"
              : null
        : null;

    const statusLabel =
      task.status === "open" ? "Open" : task.status === "completed" ? "Completed" : "Cancelled";

    return {
      id: task.id,
      title: task.title,
      statusLabel,
      dueStateLabel,
      dueAtLabel: formatLeadDate(task.dueAt, timeZone),
      assigneeLabel,
      detailHref: buildTaskDetailHrefFromLead(task.id, organizationId),
    };
  });
}

export async function loadLeadDetailPage(
  supabase: SupabaseClient<Database>,
  leadId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<LeadDetailPageResult> {
  const provisionalState = parseLeadListReturnState(rawSearchParams, "staff");

  if (!isValidLeadId(leadId)) {
    return {
      kind: "lead_unavailable",
      backHref: buildBackToLeadsHref(provisionalState),
    };
  }

  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveLeadPageOrganization(supabase, orgParam);

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
    return {
      kind: "query_error",
      message: "Unable to verify organization access. Please try again.",
    };
  }

  if (orgResult.kind === "query_error") {
    return { kind: "query_error", message: orgResult.message };
  }

  const listReturnState: LeadListUrlState = {
    ...parseLeadListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };
  const backHref = buildBackToLeadsHref(listReturnState);

  const leadResult = await getLeadById({
    supabase,
    organizationId: orgResult.organizationId,
    leadId,
  });

  if (!leadResult.ok) {
    if (isLeadUnavailableError(leadResult.error)) {
      return { kind: "lead_unavailable", backHref };
    }
    return {
      kind: "query_error",
      message: "Unable to load lead details right now. Please try again.",
    };
  }

  const lead = leadResult.data;
  const permissions = resolveLeadPermissions(orgResult.role, {
    isArchived: lead.derived.isArchived,
    status: lead.status,
  });

  if (!permissions.canViewLead) {
    return { kind: "lead_unavailable", backHref };
  }

  const panelErrors: LeadDetailPanelErrors = {};
  let statusHistory: LeadStatusHistoryPresentationItem[] = [];
  let statusHistoryState: LeadDetailViewModel["statusHistoryState"] = { kind: "hidden" };
  let stageHistory: LeadStageHistoryPresentationItem[] = [];
  let stageHistoryState: LeadDetailViewModel["stageHistoryState"] = { kind: "hidden" };
  let relatedTasks: LeadRelatedTaskRow[] = [];
  let relatedTasksState: LeadDetailViewModel["relatedTasksState"] = { kind: "hidden" };

  if (permissions.canViewStatusHistory) {
    const historyResult = await listLeadStatusHistory({
      supabase,
      organizationId: orgResult.organizationId,
      leadId,
    });

    if (!historyResult.ok) {
      statusHistoryState = {
        kind: "error",
        message: "Status history could not be loaded. Reload the page to try again.",
      };
      panelErrors.statusHistory = statusHistoryState.message;
    } else if (historyResult.data.length === 0) {
      statusHistoryState = { kind: "empty" };
    } else {
      statusHistory = buildStatusHistoryItems(historyResult.data, orgResult.timezone);
      statusHistoryState = { kind: "ready" };
    }
  }

  if (permissions.canViewStageHistory) {
    const historyResult = await listLeadStageHistory({
      supabase,
      organizationId: orgResult.organizationId,
      leadId,
    });

    if (!historyResult.ok) {
      stageHistoryState = {
        kind: "error",
        message: "Pipeline stage history could not be loaded. Reload the page to try again.",
      };
      panelErrors.stageHistory = stageHistoryState.message;
    } else if (historyResult.data.length === 0) {
      stageHistoryState = { kind: "empty" };
    } else {
      stageHistory = buildStageHistoryItems(historyResult.data, orgResult.timezone);
      stageHistoryState = { kind: "ready" };
    }
  }

  if (permissions.canViewRelatedTasks) {
    const tasksResult = await listLeadRelatedTasks({
      supabase,
      organizationId: orgResult.organizationId,
      leadId,
    });

    if (!tasksResult.ok) {
      relatedTasksState = {
        kind: "error",
        message: "Related tasks could not be loaded.",
      };
      panelErrors.relatedTasks = relatedTasksState.message;
    } else if (tasksResult.data.items.length === 0) {
      relatedTasksState = { kind: "empty" };
    } else {
      const labelRefs = collectLabelReferencesFromListItems(tasksResult.data.items);
      const labelBundle = await resolveTaskDisplayLabels(
        supabase,
        orgResult.organizationId,
        labelRefs,
      ).catch(() => emptyLabelBundle());

      relatedTasks = buildRelatedTaskRows(
        tasksResult.data.items,
        labelBundle,
        orgResult.organizationId,
        orgResult.timezone,
      );
      relatedTasksState = { kind: "ready" };
    }
  }

  const convertedCustomerHref = lead.convertedCustomer
    ? buildCustomerDetailHrefFromLead(
        lead.convertedCustomer.customerId,
        orgResult.organizationId,
      )
    : undefined;

  return {
    kind: "ready",
    selectedOrganizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    data: {
      lead,
      permissions,
      statusHistory,
      statusHistoryState,
      stageHistory,
      stageHistoryState,
      relatedTasks,
      relatedTasksState,
      convertedCustomerHref,
      organizationTimezone: orgResult.timezone,
      backHref,
      panelErrors,
    },
  };
}
