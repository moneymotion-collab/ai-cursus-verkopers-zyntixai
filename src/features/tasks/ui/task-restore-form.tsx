"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { restoreTaskAction } from "@/features/tasks/actions/lifecycle-task-actions";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import {
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

type TaskRestoreFormProps = {
  organizationId: string;
  task: TaskReadModel;
  listState: TaskListUrlState;
  timeZone: string;
  assigneeLabel: string | null;
  backHref: string;
};

export function TaskRestoreForm({
  organizationId,
  task,
  listState,
  timeZone,
  assigneeLabel,
  backHref,
}: TaskRestoreFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<TaskFormUiState>({ kind: "idle" });

  const locked = formIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await restoreTaskAction({
      organizationId,
      taskId: task.id,
    });

    const next = interpretTaskMutationResult(result, { lifecycleOperation: "restore" });
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

  const statusLabel = task.status === "completed" ? "completed" : "cancelled";

  return (
    <TaskLifecycleFormShell
      heading="Restore from archive"
      description="This task returns from the archive without reopening work."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Restoring…" : undefined}
    >
      <TaskLifecycleSummary task={task} timeZone={timeZone} assigneeLabel={assigneeLabel} />

      <section className={lifecycleStyles.summary} aria-labelledby="restore-explanation-title">
        <h2 id="restore-explanation-title">What restoring means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>The task returns from the archive.</li>
          <li>The task does not reopen and remains {statusLabel}.</li>
          <li>Owners and admins can manage the task in active terminal views again.</li>
        </ul>
      </section>

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

        <div className={formStyles.actions}>
          <button
            type="submit"
            className={formStyles.submitButton}
            disabled={locked || isPending}
          >
            {isPending ? "Restoring…" : "Restore from archive"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to task
          </a>
        </div>
      </form>
    </TaskLifecycleFormShell>
  );
}
