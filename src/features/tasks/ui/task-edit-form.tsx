"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateTaskAction } from "@/features/tasks/actions/editable-task-actions";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import { TASK_PRIORITIES, TASK_TYPES } from "@/features/tasks/domain/types";
import {
  fieldErrorMessage,
  formIsLocked,
  interpretTaskMutationResult,
  type TaskFormUiState,
} from "@/features/tasks/ui/task-form-state";
import { buildTaskDetailHref } from "@/features/tasks/ui/task-navigation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import styles from "./task-form.module.css";

type TaskEditFormProps = {
  organizationId: string;
  task: TaskReadModel;
  listState: TaskListUrlState;
  cancelHref: string;
};

const TYPE_LABELS: Record<(typeof TASK_TYPES)[number], string> = {
  follow_up: "Follow up",
  call_prep: "Call prep",
  onboarding: "Onboarding",
  general: "General",
};

export function TaskEditForm({
  organizationId,
  task,
  listState,
  cancelHref,
}: TaskEditFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<TaskFormUiState>({ kind: "idle" });
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [taskType, setTaskType] = useState(task.taskType);
  const [priority, setPriority] = useState(task.priority);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = formIsLocked(uiState);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await updateTaskAction({
      organizationId,
      taskId: task.id,
      title: title.trim(),
      description: description.trim() || null,
      taskType,
      priority,
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
      <h1>Edit task details</h1>

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
        <div className={styles.field}>
          <label htmlFor="edit-title">Title</label>
          <input
            id="edit-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            maxLength={200}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "title"))}
          />
          {fieldErrorMessage(fieldErrors, "title") ? (
            <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "title")}</p>
          ) : null}
        </div>
        <div className={styles.field}>
          <label htmlFor="edit-description">Description</label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={5000}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="edit-task-type">Task type</label>
          <select
            id="edit-task-type"
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
          <label htmlFor="edit-priority">Priority</label>
          <select
            id="edit-priority"
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
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || uiState.kind === "pending"}>
          {uiState.kind === "pending" ? "Saving…" : "Save changes"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
