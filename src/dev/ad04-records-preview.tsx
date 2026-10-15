import { Alert } from "@/components/ui/alert";
import { AppShellChrome } from "@/components/app-shell-chrome";
import { Pagination } from "@/components/ui/pagination";
import attentionErrorStyles from "@/app/(authenticated)/attention/error.module.css";
import attentionLoadingStyles from "@/app/(authenticated)/attention/loading.module.css";
import attentionPageStyles from "@/app/(authenticated)/attention/page.module.css";
import taskErrorStyles from "@/app/(authenticated)/tasks/error.module.css";
import taskLoadingStyles from "@/app/(authenticated)/tasks/loading.module.css";
import taskPageStyles from "@/app/(authenticated)/tasks/page.module.css";
import { AttentionDetail } from "@/features/attention/ui/attention-detail";
import { AttentionListFilters } from "@/features/attention/ui/attention-list-filters";
import { AttentionListPresentation } from "@/features/attention/ui/attention-list";
import type { AttentionListWorkspaceRow } from "@/features/attention/ui/load-attention-list-page";
import {
  ATTENTION_LIST_DEFAULT_SORT_DIRECTION,
  ATTENTION_LIST_DEFAULT_SORT_FIELD,
  type AttentionListUrlState,
} from "@/features/attention/ui/attention-list-search-params";
import { courseSellerPreviewHref } from "@/dev/ad02-preview-access";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import { emptyTaskFormOptions } from "@/features/tasks/ui/load-task-form-options";
import { TaskArchiveForm } from "@/features/tasks/ui/task-archive-form";
import { TaskCancelForm } from "@/features/tasks/ui/task-cancel-form";
import { TaskCompleteForm } from "@/features/tasks/ui/task-complete-form";
import { TaskCreateForm } from "@/features/tasks/ui/task-create-form";
import { TaskDetail } from "@/features/tasks/ui/task-detail";
import { TaskEditForm } from "@/features/tasks/ui/task-edit-form";
import { TaskReassignForm } from "@/features/tasks/ui/task-reassign-form";
import { TaskRescheduleForm } from "@/features/tasks/ui/task-reschedule-form";
import { TaskRestoreForm } from "@/features/tasks/ui/task-restore-form";
import { TaskListFilters } from "@/features/tasks/ui/task-list-filters";
import { TaskListPresentation } from "@/features/tasks/ui/task-list";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";

const ORG = "11111111-1111-4111-8111-111111111111";
const LONG_NAME = "Example task with a title that wraps across a narrow screen";
const LONG_LABEL = "Example owner with a long assignment label for a narrow screen";

const taskListState: TaskListUrlState = {
  org: ORG,
  status: "open",
  archived: false,
  page: 1,
  pageSize: 25,
};

const attentionListState: AttentionListUrlState = {
  org: ORG,
  includeArchived: false,
  sort: ATTENTION_LIST_DEFAULT_SORT_FIELD,
  direction: ATTENTION_LIST_DEFAULT_SORT_DIRECTION,
  page: 1,
  pageSize: 25,
};

const labels = {
  members: { "example-owner": "Example owner" },
  leads: {},
  customers: { "example-customer": "Example north client" },
  programs: {},
  projects: {},
};

function taskRow(long: boolean): TaskReadModel {
  return {
    id: "example-task-1",
    organizationId: ORG,
    title: long ? LONG_NAME : "Example follow-up",
    description: "Example task note for a synthetic workspace.",
    status: "open",
    taskType: "follow_up",
    priority: "normal",
    source: "manual",
    dueAt: "2026-10-08T09:00:00.000Z",
    assigneeMemberId: "example-owner",
    createdByMemberId: "example-owner",
    linkedContext: { kind: "customer", customerId: "example-customer" },
    predecessorTaskId: null,
    archivedAt: null,
    completedAt: null,
    cancelledAt: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
    derived: {
      terminal: false,
      archived: false,
      overdue: long,
      dueToday: false,
      upcoming: !long,
      dueState: long ? "overdue" : "upcoming",
    },
  };
}

function terminalTask(status: "completed" | "cancelled", archived: boolean): TaskReadModel {
  const row = taskRow(true);
  return {
    ...row,
    status,
    archivedAt: archived ? "2026-10-03T09:00:00.000Z" : null,
    completedAt: status === "completed" ? "2026-10-03T09:00:00.000Z" : null,
    cancelledAt: status === "cancelled" ? "2026-10-03T09:00:00.000Z" : null,
    derived: {
      terminal: true,
      archived,
      overdue: false,
      dueToday: false,
      upcoming: false,
      dueState: "none",
    },
  };
}

function attentionRow(
  severity: AttentionListWorkspaceRow["severityKey"],
  label: string,
  long: boolean,
  detailHref = "/ad02-preview?state=attention-detail",
): AttentionListWorkspaceRow {
  return {
    id: `example-attention-${severity}`,
    detailHref,
    titleLabel: long ? LONG_NAME : `Example ${label.toLowerCase()} item`,
    summaryLabel: long
      ? "Example context for a customer with a long display name that wraps on a narrow screen"
      : "Example enrollment context",
    statusLabel: "Open",
    severityLabel: label,
    customerLabel: long ? LONG_LABEL : "Example north client",
    programLabel: "Example program",
    assigneeLabel: long ? LONG_LABEL : "Example owner",
    acknowledgementLabel: "Not acknowledged",
    lastDetectedAtLabel: "Oct 2, 2026, 9:00 AM",
    isArchived: false,
    isTerminal: false,
    attentionTypeLabel: "Example signal",
    createdAtLabel: "Oct 1, 2026, 9:00 AM",
    severityKey: severity,
    statusKey: "open",
  };
}

export function Ad04RecordsPreview({
  state,
  orgName,
  model,
  statePrefix = "",
}: {
  state: string;
  orgName: string;
  model: OperatingModelId;
  statePrefix?: string;
}) {
  const attention = state.startsWith("attention");
  const long = state.endsWith("long");
  const previewHref = (name: string) => courseSellerPreviewHref(name, statePrefix);
  const options = emptyTaskFormOptions();
  options.members = [{ value: "example-owner", label: LONG_LABEL }];
  options.customers = [{ value: "example-customer", label: LONG_LABEL }];

  return (
    <AppShellChrome
      activeNav={attention ? "attention" : "tasks"}
      moduleNavVisibility={operatingModelNavVisibility(model)}
      organizationOptions={[
        { organizationId: ORG, role: "owner", displayName: orgName },
        { organizationId: "22222222-2222-4222-8222-222222222222", role: "admin", displayName: "Example second workspace" },
      ]}
      selectedOrganizationId={ORG}
      organizationSelectorAction="/ad02-preview"
    >
      {state === "tasks-loading" ? (
        <section className={taskLoadingStyles.loading} aria-busy="true">
          <h1 className={taskLoadingStyles.title}>Tasks</h1>
          <p className={taskLoadingStyles.message}>Loading tasks…</p>
          <div className={taskLoadingStyles.tableSkeleton} aria-hidden="true">
            <div className={taskLoadingStyles.row} />
          </div>
        </section>
      ) : null}
      {state === "tasks-error" ? (
        <section className={taskErrorStyles.errorPanel}>
          <h1>Something went wrong</h1>
          <Alert title="Unable to display tasks" variant="error">
            An unexpected error occurred while loading the tasks page. Please try again.
          </Alert>
          <button type="button" className={taskErrorStyles.retryButton}>
            Try again
          </button>
        </section>
      ) : null}
      {state === "tasks" || state === "tasks-long" || state === "tasks-empty" ? (
        <section className={taskPageStyles.page}>
          <header className={taskPageStyles.pageHeader}>
            <div className={taskPageStyles.pageHeaderRow}>
              <h1>Tasks</h1>
              <a className={taskPageStyles.newTaskLink} href={previewHref("task-form")}>
                New task
              </a>
            </div>
            <p className={taskPageStyles.subtitle}>
              Operational task list for {orgName}. Times shown in Europe/Amsterdam.
            </p>
          </header>
          <TaskListFilters urlState={taskListState} role="owner" assigneeOptions={options.members} />
          <TaskListPresentation
            tasks={state === "tasks-empty" ? [] : [taskRow(long)]}
            timeZone="Europe/Amsterdam"
            listState={taskListState}
            labels={labels}
            emptyTitle="No tasks are available."
            emptyDescription="Tasks will appear here when they exist for your organization."
          />
          {state === "tasks-empty" ? null : (
            <Pagination page={1} totalPages={2} nextHref={previewHref("tasks")} ariaLabel="Task list pagination" />
          )}
        </section>
      ) : null}
      {state === "task-detail" ? (
        <TaskDetail
          viewModel={{
            task: taskRow(true),
            labels: {
              assignee: LONG_LABEL,
              creator: "Example owner",
              linkedContext: LONG_LABEL,
              linkedContextKind: "Customer",
              customer: LONG_LABEL,
            },
            history: [],
            historyState: { kind: "empty" },
            organizationTimezone: "Europe/Amsterdam",
            backHref: "/ad02-preview?state=tasks",
          }}
          workflowLinks={{ edit: "/ad02-preview?state=task-form", complete: "/ad02-preview?state=task-complete" }}
        />
      ) : null}
      {state === "task-form" || state === "task-form-pending" ? (
        <section className={taskPageStyles.page}>
          <TaskCreateForm
            organizationId={ORG}
            timeZone="Europe/Amsterdam"
            listState={taskListState}
            options={options}
            cancelHref={previewHref("tasks")}
            initialUiState={
              state === "task-form-pending"
                ? { kind: "pending" }
                : {
                    kind: "field_error",
                    message: "Please correct the highlighted fields and try again.",
                    fieldErrors: { title: ["Title is required"] },
                  }
            }
          />
        </section>
      ) : null}
      {state === "task-complete" ? (
        <section className={taskPageStyles.page}>
          <TaskCompleteForm
            organizationId={ORG}
            task={taskRow(true)}
            listState={taskListState}
            timeZone="Europe/Amsterdam"
            assigneeLabel={LONG_LABEL}
            backHref="/ad02-preview?state=task-detail"
          />
        </section>
      ) : null}
      {state === "task-edit" ? (
        <section className={taskPageStyles.page}>
          <TaskEditForm
            organizationId={ORG}
            task={taskRow(true)}
            listState={taskListState}
            cancelHref="/ad02-preview?state=task-detail"
          />
        </section>
      ) : null}
      {state === "task-edit-error" || state === "task-edit-pending" ? (
        <section className={taskPageStyles.page}>
          <h1>Edit task</h1>
          <p role="status">
            {state === "task-edit-pending"
              ? "Saving is shown as pending."
              : "Title is required."}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "task-reschedule" ? (
        <section className={taskPageStyles.page}>
          <TaskRescheduleForm
            organizationId={ORG}
            task={taskRow(true)}
            timeZone="Europe/Amsterdam"
            dueDate="2026-10-08"
            dueTime="11:00"
            listState={taskListState}
            cancelHref="/ad02-preview?state=task-detail"
          />
        </section>
      ) : null}
      {state === "task-reschedule-error" || state === "task-reschedule-pending" ? (
        <section className={taskPageStyles.page}>
          <h1>Reschedule task</h1>
          <p role="status">
            {state === "task-reschedule-pending"
              ? "Saving is shown as pending."
              : "Due date is required."}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "task-reassign" ? (
        <section className={taskPageStyles.page}>
          <TaskReassignForm
            organizationId={ORG}
            task={taskRow(true)}
            listState={taskListState}
            options={options}
            cancelHref="/ad02-preview?state=task-detail"
          />
        </section>
      ) : null}
      {state === "task-reassign-error" || state === "task-reassign-pending" ? (
        <section className={taskPageStyles.page}>
          <h1>Reassign task</h1>
          <p role="status">
            {state === "task-reassign-pending"
              ? "Saving is shown as pending."
              : "Select a valid team member for this organization."}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "task-cancel" ? (
        <section className={taskPageStyles.page}>
          <TaskCancelForm
            organizationId={ORG}
            task={taskRow(true)}
            listState={taskListState}
            timeZone="Europe/Amsterdam"
            assigneeLabel={LONG_LABEL}
            backHref="/ad02-preview?state=task-detail"
          />
        </section>
      ) : null}
      {state === "task-cancel-pending" ? (
        <section className={taskPageStyles.page}>
          <h1>Cancel task</h1>
          <p role="status">Cancellation is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "task-archive" ? (
        <section className={taskPageStyles.page}>
          <TaskArchiveForm
            organizationId={ORG}
            task={terminalTask("completed", false)}
            listState={taskListState}
            timeZone="Europe/Amsterdam"
            assigneeLabel={LONG_LABEL}
            backHref="/ad02-preview?state=task-detail"
          />
        </section>
      ) : null}
      {state === "task-archive-pending" ? (
        <section className={taskPageStyles.page}>
          <h1>Archive task</h1>
          <p role="status">Archive is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "task-restore" ? (
        <section className={taskPageStyles.page}>
          <TaskRestoreForm
            organizationId={ORG}
            task={terminalTask("cancelled", true)}
            listState={taskListState}
            timeZone="Europe/Amsterdam"
            assigneeLabel={LONG_LABEL}
            backHref="/ad02-preview?state=task-detail"
          />
        </section>
      ) : null}
      {state === "task-restore-pending" ? (
        <section className={taskPageStyles.page}>
          <h1>Restore task</h1>
          <p role="status">Restore is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "attention-loading" ? (
        <section className={attentionLoadingStyles.loading} aria-busy="true">
          <h1 className={attentionLoadingStyles.title}>Attention</h1>
          <p className={attentionLoadingStyles.message}>Loading Attention…</p>
          <div className={attentionLoadingStyles.skeleton} aria-hidden="true">
            <div className={attentionLoadingStyles.block} />
          </div>
        </section>
      ) : null}
      {state === "attention-error" ? (
        <section className={attentionErrorStyles.errorPanel}>
          <h1>Something went wrong</h1>
          <Alert title="Unable to display Attention" variant="error">
            An unexpected error occurred while loading the Attention page. Please try again.
          </Alert>
          <button type="button" className={attentionErrorStyles.retryButton}>
            Try again
          </button>
        </section>
      ) : null}
      {state === "attention" || state === "attention-long" || state === "attention-empty" ? (
        <section className={attentionPageStyles.page}>
          <header className={attentionPageStyles.pageHeader}>
            <h1>Attention</h1>
            <p className={attentionPageStyles.subtitle}>Attention items for {orgName}.</p>
          </header>
          <AttentionListFilters urlState={attentionListState} role="owner" />
          <AttentionListPresentation
            rows={
              state === "attention-empty"
                ? []
                : [
                    attentionRow("critical", "Critical", long, previewHref("attention-detail")),
                    attentionRow("high", "High", false, previewHref("attention-detail")),
                    attentionRow("medium", "Medium", false, previewHref("attention-detail")),
                    attentionRow("low", "Low", false, previewHref("attention-detail")),
                  ]
            }
            organizationName={orgName}
          />
        </section>
      ) : null}
      {state === "attention-detail" ? (
        <AttentionDetail
          organizationId={ORG}
          role="owner"
          viewModel={{
            detail: {
              id: "example-attention-high",
              titleLabel: LONG_NAME,
              summaryLabel: "Example context for a customer with a long display name",
              statusLabel: "Open",
              severityLabel: "High",
              attentionTypeLabel: "Example signal",
              customerLabel: LONG_LABEL,
              programLabel: "Example program",
              enrollmentStatusLabel: "Active",
              assigneeLabel: "Example owner",
              acknowledgementLabel: "Not acknowledged",
              firstDetectedAtLabel: "Oct 1, 2026, 9:00 AM",
              lastDetectedAtLabel: "Oct 2, 2026, 9:00 AM",
              createdAtLabel: "Oct 1, 2026, 9:00 AM",
              updatedAtLabel: "Oct 2, 2026, 9:00 AM",
              resolvedAtLabel: null,
              dismissedAtLabel: null,
              expiredAtLabel: null,
              archivedAtLabel: null,
              resolutionReasonLabel: null,
              dismissalReasonLabel: null,
              detectionCountLabel: "1",
              isArchived: false,
              isTerminal: false,
              severityKey: "high",
              statusKey: "open",
            },
            signals: [],
            timeline: [],
            timelineEmpty: true,
            customerHref: previewHref("attention"),
            programHref: null,
            enrollmentHref: null,
            projectHref: null,
            taskHref: null,
            backHref: previewHref("attention"),
            organizationTimezone: "Europe/Amsterdam",
            assigneeMemberId: null,
            assigneeOptions: [{ value: "example-owner", label: LONG_LABEL }],
            assigneeOptionsFailed: false,
            nextBestAction: null,
          }}
        />
      ) : null}
    </AppShellChrome>
  );
}
