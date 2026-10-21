"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { completeTaskAction } from "@/features/tasks/actions/lifecycle-task-actions";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import {
  fieldErrorMessage,
  formIsLocked,
  interpretTaskMutationResult,
  type TaskFormUiState,
} from "@/features/tasks/ui/task-form-state";
import {
  TaskLifecycleFormShell,
  TaskLifecycleSummary,
} from "@/features/tasks/ui/task-lifecycle-confirmation";
import { buildTaskDetailHref } from "@/features/tasks/ui/task-navigation";
import type { TaskListUrlState } from "@/features/tasks/ui/task-list-search-params";
import formStyles from "./task-form.module.css";

type TaskCompleteFormProps = {
  organizationId: string;
  task: TaskReadModel;
  listState: TaskListUrlState;
  timeZone: string;
  assigneeLabel: string | null;
  backHref: string;
};

export function TaskCompleteForm({
  organizationId,
  task,
  listState,
  timeZone,
  assigneeLabel,
  backHref,
}: TaskCompleteFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<TaskFormUiState>({ kind: "idle" });
  const [completionNote, setCompletionNote] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = formIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await completeTaskAction({
      organizationId,
      taskId: task.id,
      completionNote: completionNote.trim() || null,
    });

    const next = interpretTaskMutationResult(result, { lifecycleOperation: "complete" });
    setUiState(next);

    if (next.kind === "success") {
      const href = buildTaskDetailHref(next.taskId, listState);
      if (next.refreshLists || next.refreshHistory) {
        router.refresh();
      }
      router.push(href);
      return;
    }

    pendingRef.current = false;
  }

  return (
    <TaskLifecycleFormShell
      heading="Complete task"
      description="Confirm that this task is finished. You may add an optional completion note."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Completing…" : undefined}
    >
      <TaskLifecycleSummary task={task} timeZone={timeZone} assigneeLabel={assigneeLabel} />

      <form
        className={formStyles.taskForm}
        onSubmit={handleSubmit}
        aria-busy={isPending}
        noValidate
      >
        {uiState.kind === "error" ? (
          <div className={formStyles.formError} role="alert">
            <p>{uiState.message}</p>
          </div>
        ) : null}

        {uiState.kind === "reload_required" ? (
          <div className={formStyles.formNotice} role="status">
            <p>{uiState.message}</p>
            <p>
              <a href={buildTaskDetailHref(task.id, listState)}>Reload task</a>
            </p>
          </div>
        ) : null}

        <div className={formStyles.field}>
          <label htmlFor="complete-note">Completion note (optional)</label>
          <textarea
            id="complete-note"
            value={completionNote}
            onChange={(event) => setCompletionNote(event.target.value)}
            maxLength={5000}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "completionNote"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "completionNote") ? "complete-note-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "completionNote") ? (
            <p id="complete-note-error" className={formStyles.fieldError}>
              {fieldErrorMessage(fieldErrors, "completionNote")}
            </p>
          ) : null}
        </div>

        <div className={formStyles.actions}>
          <button
            type="submit"
            className={formStyles.submitButton}
            disabled={locked || isPending}
          >
            {isPending ? "Completing…" : "Complete task"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to task
          </a>
        </div>
      </form>
    </TaskLifecycleFormShell>
  );
}
