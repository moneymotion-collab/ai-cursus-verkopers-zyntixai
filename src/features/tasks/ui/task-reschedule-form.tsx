"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { rescheduleTaskAction } from "@/features/tasks/actions/editable-task-actions";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import { combineDueAtFromForm } from "@/features/tasks/ui/task-form-datetime";
import {
  fieldErrorMessage,
  formIsLocked,
  interpretTaskMutationResult,
  type TaskFormUiState,
} from "@/features/tasks/ui/task-form-state";
import { buildTaskDetailHref } from "@/features/tasks/ui/task-navigation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import styles from "./task-form.module.css";

type TaskRescheduleFormProps = {
  organizationId: string;
  task: TaskReadModel;
  timeZone: string;
  dueDate: string;
  dueTime: string;
  listState: TaskListUrlState;
  cancelHref: string;
};

export function TaskRescheduleForm({
  organizationId,
  task,
  timeZone,
  dueDate: initialDueDate,
  dueTime: initialDueTime,
  listState,
  cancelHref,
}: TaskRescheduleFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<TaskFormUiState>({ kind: "idle" });
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [dueTime, setDueTime] = useState(initialDueTime);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = formIsLocked(uiState);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const dueAt = combineDueAtFromForm(dueDate, dueTime, timeZone);
    const result = await rescheduleTaskAction({
      organizationId,
      taskId: task.id,
      dueAt,
    });

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

  return (
    <form className={styles.taskForm} onSubmit={handleSubmit} aria-busy={uiState.kind === "pending"} noValidate>
      <h1>Reschedule task</h1>
      <p>Due date and time use the {timeZone} organization timezone.</p>

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "reload_required" ? (
        <div className={styles.formNotice} role="status">
          <p>{uiState.message}</p>
          <p>
            <a href={buildTaskDetailHref(task.id, listState)}>Reload task</a>
          </p>
        </div>
      ) : null}

      <section className={styles.section}>
        <div className={styles.dueFields}>
          <div className={styles.field}>
            <label htmlFor="reschedule-due-date">Due date</label>
            <input
              id="reschedule-due-date"
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
              aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "dueAt"))}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="reschedule-due-time">Due time</label>
            <input
              id="reschedule-due-time"
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
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || uiState.kind === "pending"}>
          {uiState.kind === "pending" ? "Saving…" : "Save schedule"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
