"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createTaskAction } from "@/features/tasks/actions/editable-task-actions";
import { TASK_PRIORITIES, TASK_TYPES } from "@/features/tasks/domain/types";
import type { TaskFormOptions } from "@/features/tasks/ui/load-task-form-options";
import { combineDueAtFromForm } from "@/features/tasks/ui/task-form-datetime";
import {
  fieldErrorMessage,
  formIsLocked,
  interpretTaskMutationResult,
  type TaskFormUiState,
} from "@/features/tasks/ui/task-form-state";
import {
  buildTaskDetailHref,
} from "@/features/tasks/ui/task-navigation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import styles from "./task-form.module.css";

type ContextType = "lead" | "customer" | "enrollment";

type TaskCreateFormProps = {
  organizationId: string;
  timeZone: string;
  listState: TaskListUrlState;
  options: TaskFormOptions;
  cancelHref: string;
};

const TYPE_LABELS: Record<(typeof TASK_TYPES)[number], string> = {
  follow_up: "Follow up",
  call_prep: "Call prep",
  onboarding: "Onboarding",
  general: "General",
};

export function TaskCreateForm({
  organizationId,
  timeZone,
  listState,
  options,
  cancelHref,
}: TaskCreateFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<TaskFormUiState>({ kind: "idle" });
  const [contextType, setContextType] = useState<ContextType>(
    options.leads.length > 0 ? "lead" : options.customers.length > 0 ? "customer" : "enrollment",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [taskType, setTaskType] = useState<(typeof TASK_TYPES)[number]>("general");
  const [priority, setPriority] = useState<(typeof TASK_PRIORITIES)[number]>("normal");
  const [assigneeMemberId, setAssigneeMemberId] = useState("");
  const [contextEntityId, setContextEntityId] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = formIsLocked(uiState);
  const showCapNotice =
    options.capped.leads || options.capped.customers || options.capped.enrollments || options.capped.members;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const dueAt = combineDueAtFromForm(dueDate, dueTime, timeZone);
    const payload: Record<string, unknown> = {
      organizationId,
      title: title.trim(),
      description: description.trim() || null,
      dueAt,
      taskType,
      priority,
      assigneeMemberId: assigneeMemberId || null,
    };

    if (contextType === "lead") {
      payload.leadId = contextEntityId;
    } else if (contextType === "customer") {
      payload.customerId = contextEntityId;
    } else {
      const enrollment = options.enrollments.find((item) => item.value === contextEntityId);
      if (enrollment) {
        payload.enrollmentId = enrollment.value;
        payload.customerId = enrollment.customerId;
        payload.programId = enrollment.programId;
      }
    }

    const result = await createTaskAction(payload);
    const next = interpretTaskMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      const href = buildTaskDetailHref(next.taskId, listState);
      if (next.refreshLists) {
        router.refresh();
      }
      router.push(href);
      return;
    }

    pendingRef.current = false;
  }

  const contextOptions =
    contextType === "lead"
      ? options.leads
      : contextType === "customer"
        ? options.customers
        : options.enrollments;

  return (
    <form className={styles.taskForm} onSubmit={handleSubmit} aria-busy={uiState.kind === "pending"} noValidate>
      <h1>Create task</h1>
      <p>Times are interpreted in {timeZone}.</p>

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "reload_required" ? (
        <div className={styles.formNotice} role="status">
          <p>{uiState.message}</p>
          {uiState.taskId ? (
            <p>
              <a href={buildTaskDetailHref(uiState.taskId, listState)}>Open saved task</a>
            </p>
          ) : null}
        </div>
      ) : null}

      {showCapNotice ? (
        <p className={styles.formNotice}>Only the first available records are shown.</p>
      ) : null}

      <section className={styles.section} aria-labelledby="create-details-title">
        <h2 id="create-details-title">Task details</h2>
        <div className={styles.field}>
          <label htmlFor="create-title">Title</label>
          <input
            id="create-title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "title"))}
            aria-describedby={fieldErrorMessage(fieldErrors, "title") ? "create-title-error" : undefined}
          />
          {fieldErrorMessage(fieldErrors, "title") ? (
            <p id="create-title-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "title")}
            </p>
          ) : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="create-description">Description</label>
          <textarea
            id="create-description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
          />
        </div>
        <div className={styles.dueFields}>
          <div className={styles.field}>
            <label htmlFor="create-due-date">Due date</label>
            <input
              id="create-due-date"
              name="dueDate"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "dueAt"))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="create-due-time">Due time</label>
            <input
              id="create-due-time"
              name="dueTime"
              type="time"
              value={dueTime}
              onChange={(event) => setDueTime(event.target.value)}
              required
            />
          </div>
        </div>
        {fieldErrorMessage(fieldErrors, "dueAt") ? (
          <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "dueAt")}</p>
        ) : null}
        <div className={styles.field}>
          <label htmlFor="create-task-type">Task type</label>
          <select
            id="create-task-type"
            name="taskType"
            value={taskType}
            onChange={(event) => setTaskType(event.target.value as (typeof TASK_TYPES)[number])}
          >
            {TASK_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABELS[value]}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="create-priority">Priority</label>
          <select
            id="create-priority"
            name="priority"
            value={priority}
            onChange={(event) => setPriority(event.target.value as (typeof TASK_PRIORITIES)[number])}
          >
            {TASK_PRIORITIES.map((value) => (
              <option key={value} value={value}>
                {value.charAt(0).toUpperCase() + value.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="create-assignee">Assignee</label>
          <select
            id="create-assignee"
            name="assigneeMemberId"
            value={assigneeMemberId}
            onChange={(event) => setAssigneeMemberId(event.target.value)}
          >
            <option value="">Unassigned</option>
            {options.members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <fieldset className={styles.section}>
        <legend className={styles.legend}>Linked context</legend>
        <div className={styles.field}>
          <label htmlFor="create-context-type">Context type</label>
          <select
            id="create-context-type"
            name="contextType"
            value={contextType}
            onChange={(event) => {
              setContextType(event.target.value as ContextType);
              setContextEntityId("");
            }}
          >
            <option value="lead" disabled={options.leads.length === 0}>
              Lead
            </option>
            <option value="customer" disabled={options.customers.length === 0}>
              Customer
            </option>
            <option value="enrollment" disabled={options.enrollments.length === 0}>
              Enrollment
            </option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="create-context-entity">
            {contextType === "lead" ? "Lead" : contextType === "customer" ? "Customer" : "Enrollment"}
          </label>
          <select
            id="create-context-entity"
            name="contextEntityId"
            value={contextEntityId}
            onChange={(event) => setContextEntityId(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "linkedContext"))}
          >
            <option value="">Select a record</option>
            {contextOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {contextOptions.length === 0 ? (
            <p className={styles.fieldError}>No available records for this context type.</p>
          ) : null}
          {fieldErrorMessage(fieldErrors, "linkedContext") ? (
            <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "linkedContext")}</p>
          ) : null}
        </div>
      </fieldset>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || uiState.kind === "pending"}>
          {uiState.kind === "pending" ? "Creating…" : "Create task"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
      {uiState.kind === "pending" ? (
        <p role="status" aria-live="polite">
          Creating task…
        </p>
      ) : null}
    </form>
  );
}
