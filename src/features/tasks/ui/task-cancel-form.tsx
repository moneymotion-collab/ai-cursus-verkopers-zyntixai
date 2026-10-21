"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cancelTaskAction } from "@/features/tasks/actions/lifecycle-task-actions";
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
import lifecycleStyles from "./task-lifecycle.module.css";

type TaskCancelFormProps = {
  organizationId: string;
  task: TaskReadModel;
  listState: TaskListUrlState;
  timeZone: string;
  assigneeLabel: string | null;
  backHref: string;
};

export function TaskCancelForm({
  organizationId,
  task,
  listState,
  timeZone,
  assigneeLabel,
  backHref,
}: TaskCancelFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const [uiState, setUiState] = useState<TaskFormUiState>({ kind: "idle" });
  const [cancelReason, setCancelReason] = useState("");

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = formIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  useEffect(() => {
    if (uiState.kind === "field_error" && fieldErrorMessage(uiState.fieldErrors, "cancelReason")) {
      reasonRef.current?.focus();
    }
  }, [uiState]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    const trimmedReason = cancelReason.trim();
    if (!trimmedReason) {
      setUiState({
        kind: "field_error",
        fieldErrors: { cancelReason: ["Cancel reason is required"] },
        message: "Please correct the highlighted fields and try again.",
      });
      reasonRef.current?.focus();
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await cancelTaskAction({
      organizationId,
      taskId: task.id,
      cancelReason: trimmedReason,
    });

    const next = interpretTaskMutationResult(result, { lifecycleOperation: "cancel" });
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
      heading="Cancel task"
      description="This action marks the task as cancelled. Provide a reason so the team understands why work stopped."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Cancelling…" : undefined}
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

        {uiState.kind === "field_error" && uiState.message ? (
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
          <label htmlFor="cancel-reason">Cancellation reason</label>
          <textarea
            id="cancel-reason"
            ref={reasonRef}
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            required
            maxLength={5000}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "cancelReason"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "cancelReason") ? "cancel-reason-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "cancelReason") ? (
            <p id="cancel-reason-error" className={formStyles.fieldError}>
              {fieldErrorMessage(fieldErrors, "cancelReason")}
            </p>
          ) : null}
        </div>

        <div className={formStyles.actions}>
          <button
            type="submit"
            className={`${formStyles.submitButton} ${lifecycleStyles.destructiveButton}`}
            disabled={locked || isPending}
          >
            {isPending ? "Cancelling…" : "Cancel task"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to task
          </a>
        </div>
      </form>
    </TaskLifecycleFormShell>
  );
}
