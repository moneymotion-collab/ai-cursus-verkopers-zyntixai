"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { archiveTaskAction } from "@/features/tasks/actions/lifecycle-task-actions";
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

type TaskArchiveFormProps = {
  organizationId: string;
  task: TaskReadModel;
  listState: TaskListUrlState;
  timeZone: string;
  assigneeLabel: string | null;
  backHref: string;
};

export function TaskArchiveForm({
  organizationId,
  task,
  listState,
  timeZone,
  assigneeLabel,
  backHref,
}: TaskArchiveFormProps) {
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

    const result = await archiveTaskAction({
      organizationId,
      taskId: task.id,
    });

    const next = interpretTaskMutationResult(result, { lifecycleOperation: "archive" });
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
    <TaskLifecycleFormShell
      heading="Archive task"
      description="Archiving hides this task from staff and viewers while keeping its completed or cancelled status unchanged."
      backHref={backHref}
      isPending={isPending}
      pendingLabel={isPending ? "Archiving…" : undefined}
    >
      <TaskLifecycleSummary task={task} timeZone={timeZone} assigneeLabel={assigneeLabel} />

      <section className={lifecycleStyles.summary} aria-labelledby="archive-explanation-title">
        <h2 id="archive-explanation-title">What archiving means</h2>
        <ul className={lifecycleStyles.explanationList}>
          <li>Archiving is not deletion.</li>
          <li>The task status remains {task.status === "completed" ? "completed" : "cancelled"}.</li>
          <li>Staff and viewers will no longer see this task.</li>
          <li>Owners and admins can find it in archived task views.</li>
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
            className={`${formStyles.submitButton} ${lifecycleStyles.destructiveButton}`}
            disabled={locked || isPending}
          >
            {isPending ? "Archiving…" : "Archive task"}
          </button>
          <a className={formStyles.secondaryButton} href={backHref}>
            Back to task
          </a>
        </div>
      </form>
    </TaskLifecycleFormShell>
  );
}
