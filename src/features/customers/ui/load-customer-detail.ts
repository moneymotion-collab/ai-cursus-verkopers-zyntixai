import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import type {
  CustomerEnrollmentSummary,
  CustomerStatusHistoryEntry,
} from "@/features/customers/domain/read-types";
import type { CustomerApplicationError, CustomerPermissionSet, CustomerRole } from "@/features/customers/domain/types";
import { resolveCustomerPermissions } from "@/features/customers/domain/permissions";
import {
  getCustomerById,
  listCustomerEnrollmentSummaries,
  listCustomerStatusHistory,
} from "@/features/customers/server/customer-read-queries";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import { listTasksForCustomer } from "@/features/tasks/server/task-read-queries";
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
  buildBackToCustomersHref,
  parseCustomerListReturnState,
} from "@/features/customers/ui/customer-navigation";
import type { CustomerListUrlState } from "@/features/customers/ui/customer-list-search-params";
import {
  formatCustomerDate,
  formatCustomerHistorySourceLabel,
  formatOptionalCustomerDate,
} from "@/features/customers/ui/customer-presentation";
import { getCustomerStatusLabel } from "@/features/customers/domain/status";
import type { Database } from "@/types/database";

const CUSTOMER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const MAX_RELATED_TASKS = 10;

export type CustomerHistoryPresentationItem = {
  id: string;
  transitionLabel: string;
  fromStatusLabel: string | null;
  toStatusLabel: string;
  actorLabel: string;
  sourceLabel: string;
  reason: string | null;
  timestampLabel: string;
};

export type CustomerRelatedTaskRow = {
  id: string;
  title: string;
  statusLabel: string;
  dueStateLabel: string | null;
  dueAtLabel: string;
  assigneeLabel: string;
  detailHref: string;
};

export type CustomerDetailPanelErrors = {
  history?: string;
  enrollments?: string;
  relatedTasks?: string;
};

export type CustomerDetailViewModel = {
  customer: CustomerDetailReadModel;
  permissions: CustomerPermissionSet;
  history: CustomerHistoryPresentationItem[];
  historyState: { kind: "ready" } | { kind: "empty" } | { kind: "error"; message: string } | { kind: "hidden" };
  enrollments: CustomerEnrollmentSummary[];
  enrollmentState: { kind: "ready" } | { kind: "empty" } | { kind: "error"; message: string } | { kind: "hidden" };
  relatedTasks: CustomerRelatedTaskRow[];
  relatedTasksState: { kind: "ready" } | { kind: "empty" } | { kind: "error"; message: string } | { kind: "hidden" };
  organizationTimezone: string;
  backHref: string;
  panelErrors: CustomerDetailPanelErrors;
};

export type CustomerDetailPageResult =
  | {
      kind: "ready";
      data: CustomerDetailViewModel;
      organizationOptions: OrganizationOption[];
      selectedOrganizationId: string;
      role: CustomerRole;
    }
  | { kind: "auth_required" }
  | { kind: "organization_required"; organizations: OrganizationOption[] }
  | { kind: "organization_unavailable" }
  | { kind: "customer_unavailable"; backHref: string }
  | { kind: "query_error"; message: string };

function isValidCustomerId(customerId: string): boolean {
  return CUSTOMER_ID_PATTERN.test(customerId);
}

function isCustomerUnavailableError(error: CustomerApplicationError): boolean {
  return (
    error.code === "CUSTOMER_UNAVAILABLE" ||
    error.code === "PERMISSION_DENIED" ||
    error.code === "INVALID_INPUT"
  );
}

function buildHistoryItems(
  history: CustomerStatusHistoryEntry[],
  timeZone: string,
): CustomerHistoryPresentationItem[] {
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
      sourceLabel: formatCustomerHistorySourceLabel(entry.source),
      reason: entry.reason,
      timestampLabel: formatCustomerDate(entry.changedAt, timeZone),
    };
  });
}

function buildRelatedTaskRows(
  tasks: TaskListItemReadModel[],
  labelBundle: TaskDisplayLabelBundle,
  organizationId: string,
  timeZone: string,
): CustomerRelatedTaskRow[] {
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

    const params = new URLSearchParams();
    params.set("org", organizationId);

    return {
      id: task.id,
      title: task.title,
      statusLabel,
      dueStateLabel,
      dueAtLabel: formatCustomerDate(task.dueAt, timeZone),
      assigneeLabel,
      detailHref: `/tasks/${task.id}?${params.toString()}`,
    };
  });
}

export async function loadCustomerDetailPage(
  supabase: SupabaseClient<Database>,
  customerId: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CustomerDetailPageResult> {
  const provisionalState = parseCustomerListReturnState(rawSearchParams, "staff");

  if (!isValidCustomerId(customerId)) {
    return {
      kind: "customer_unavailable",
      backHref: buildBackToCustomersHref(provisionalState),
    };
  }

  const orgParam = Array.isArray(rawSearchParams.org)
    ? rawSearchParams.org[0]
    : rawSearchParams.org;

  const orgResult = await resolveCustomerPageOrganization(supabase, orgParam);

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

  const listReturnState: CustomerListUrlState = {
    ...parseCustomerListReturnState(rawSearchParams, orgResult.role),
    org: orgResult.organizationId,
  };
  const backHref = buildBackToCustomersHref(listReturnState);

  const customerResult = await getCustomerById({
    supabase,
    organizationId: orgResult.organizationId,
    customerId,
  });

  if (!customerResult.ok) {
    if (isCustomerUnavailableError(customerResult.error)) {
      return { kind: "customer_unavailable", backHref };
    }
    return {
      kind: "query_error",
      message: "Unable to load customer details right now. Please try again.",
    };
  }

  const customer = customerResult.data;
  const permissions = resolveCustomerPermissions(orgResult.role, {
    isArchived: customer.derived.isArchived,
  });

  if (!permissions.canViewCustomer) {
    return { kind: "customer_unavailable", backHref };
  }

  const panelErrors: CustomerDetailPanelErrors = {};
  let history: CustomerHistoryPresentationItem[] = [];
  let historyState: CustomerDetailViewModel["historyState"] = { kind: "hidden" };
  let enrollments: CustomerEnrollmentSummary[] = [];
  let enrollmentState: CustomerDetailViewModel["enrollmentState"] = { kind: "hidden" };
  let relatedTasks: CustomerRelatedTaskRow[] = [];
  let relatedTasksState: CustomerDetailViewModel["relatedTasksState"] = { kind: "hidden" };

  if (permissions.canViewStatusHistory) {
    const historyResult = await listCustomerStatusHistory({
      supabase,
      organizationId: orgResult.organizationId,
      customerId,
    });

    if (!historyResult.ok) {
      historyState = {
        kind: "error",
        message: "Status history could not be loaded. Reload the page to try again.",
      };
      panelErrors.history = historyState.message;
    } else if (historyResult.data.length === 0) {
      historyState = { kind: "empty" };
    } else {
      history = buildHistoryItems(historyResult.data, orgResult.timezone);
      historyState = { kind: "ready" };
    }
  }

  if (permissions.canViewEnrollmentSummary) {
    const enrollmentResult = await listCustomerEnrollmentSummaries({
      supabase,
      organizationId: orgResult.organizationId,
      customerId,
    });

    if (!enrollmentResult.ok) {
      enrollmentState = {
        kind: "error",
        message: "Enrollment summaries could not be loaded.",
      };
      panelErrors.enrollments = enrollmentState.message;
    } else if (enrollmentResult.data.length === 0) {
      enrollmentState = { kind: "empty" };
    } else {
      enrollments = enrollmentResult.data.map((entry) => ({
        ...entry,
        detailHref: `/enrollments/${encodeURIComponent(entry.enrollmentId)}?org=${encodeURIComponent(orgResult.organizationId)}`,
      }));
      enrollmentState = { kind: "ready" };
    }
  }

  if (permissions.canViewRelatedTasks) {
    const tasksResult = await listTasksForCustomer({
      supabase,
      organizationId: orgResult.organizationId,
      customerId,
      filters: { status: "open", includeArchived: false },
      pagination: { page: 1, pageSize: MAX_RELATED_TASKS },
      sort: { field: "due_at", direction: "asc" },
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

  return {
    kind: "ready",
    selectedOrganizationId: orgResult.organizationId,
    organizationOptions: orgResult.organizationOptions,
    role: orgResult.role,
    data: {
      customer,
      permissions,
      history,
      historyState,
      enrollments,
      enrollmentState,
      relatedTasks,
      relatedTasksState,
      organizationTimezone: orgResult.timezone,
      backHref,
      panelErrors,
    },
  };
}

export function buildCustomerIdentitySummary(customer: CustomerDetailReadModel): {
  lifecycleStatusLabel: string;
  archivedLabel: string | null;
  startedAtLabel: string;
  endedAtLabel: string;
  createdAtLabel: string;
  updatedAtLabel: string;
} {
  return {
    lifecycleStatusLabel: getCustomerStatusLabel(customer.status),
    archivedLabel: customer.derived.isArchived ? "Archived" : null,
    startedAtLabel: formatCustomerDate(customer.startedAt, "UTC"),
    endedAtLabel: formatOptionalCustomerDate(customer.endedAt, "UTC"),
    createdAtLabel: formatCustomerDate(customer.createdAt, "UTC"),
    updatedAtLabel: formatCustomerDate(customer.updatedAt, "UTC"),
  };
}
