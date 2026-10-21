"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { reassignTaskAction } from "@/features/tasks/actions/editable-task-actions";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { TaskFormOptions } from "@/features/tasks/ui/load-task-form-options";
import {
  fieldErrorMessage,
  formIsLocked,
  interpretTaskMutationResult,
  type TaskFormUiState,
} from "@/features/tasks/ui/task-form-state";
import { buildTaskDetailHref } from "@/features/tasks/ui/task-navigation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import styles from "./task-form.module.css";

type TaskReassignFormProps = {
  organizationId: string;
  task: TaskReadModel;
  listState: TaskListUrlState;
  options: TaskFormOptions;
  cancelHref: string;
};

export function TaskReassignForm({
  organizationId,
  task,
  listState,
  options,
  cancelHref,
}: TaskReassignFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<TaskFormUiState>({ kind: "idle" });
  const [assigneeMemberId, setAssigneeMemberId] = useState(task.assigneeMemberId ?? "");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = formIsLocked(uiState);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await reassignTaskAction({
      organizationId,
      taskId: task.id,
      assigneeMemberId: assigneeMemberId || null,
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
      <h1>Reassign task</h1>

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
          <label htmlFor="reassign-assignee">Assignee</label>
          <select
            id="reassign-assignee"
            value={assigneeMemberId}
            onChange={(event) => setAssigneeMemberId(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "assigneeMemberId"))}
          >
            <option value="">Unassigned</option>
            {options.members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </select>
          {fieldErrorMessage(fieldErrors, "assigneeMemberId") ? (
            <p className={styles.fieldError}>{fieldErrorMessage(fieldErrors, "assigneeMemberId")}</p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || uiState.kind === "pending"}>
          {uiState.kind === "pending" ? "Saving…" : "Save assignment"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
