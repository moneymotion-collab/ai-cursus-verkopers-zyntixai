"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  archiveProjectAction,
  restoreProjectAction,
  transitionProjectStatusAction,
} from "@/features/projects/actions/project-actions";
import type {
  ProjectPermissions,
  ProjectStatus,
} from "@/features/projects/domain/types";
import { projectStatusLabel } from "@/features/projects/domain/types";
import styles from "./projects.module.css";

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  planned: ["active", "cancelled"],
  active: ["on_hold", "completed", "cancelled"],
  on_hold: ["active", "completed", "cancelled"],
  completed: ["active"],
  cancelled: ["planned"],
};

type ProjectActionsProps = {
  organizationId: string;
  projectId: string;
  status: ProjectStatus;
  permissions: ProjectPermissions;
  singular: string;
};

export function ProjectActions({
  organizationId,
  projectId,
  status,
  permissions,
  singular,
}: ProjectActionsProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [toStatus, setToStatus] = useState<ProjectStatus>(TRANSITIONS[status][0] ?? status);

  async function transition(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const result = await transitionProjectStatusAction({
      organizationId,
      projectId,
      toStatus,
      reason: null,
    });
    if (!result.ok) {
      setMessage(result.message);
      setPending(false);
      return;
    }
    router.refresh();
  }

  async function archive(restore: boolean) {
    setPending(true);
    setMessage(null);
    const result = restore
      ? await restoreProjectAction({ organizationId, projectId })
      : await archiveProjectAction({ organizationId, projectId });
    if (!result.ok) {
      setMessage(result.message);
      setPending(false);
      return;
    }
    router.refresh();
  }

  if (!permissions.canTransition && !permissions.canArchive && !permissions.canRestore) return null;

  return (
    <section className={styles.panel} aria-labelledby="project-actions-title" aria-busy={pending}>
      <h2 id="project-actions-title">Manage {singular.toLowerCase()}</h2>
      {message ? <p className={styles.error} role="alert">{message}</p> : null}
      {permissions.canTransition ? (
        <form className={styles.inlineForm} onSubmit={transition}>
          <label htmlFor="project-next-status">Next status</label>
          <select
            id="project-next-status"
            value={toStatus}
            onChange={(event) => setToStatus(event.target.value as ProjectStatus)}
            disabled={pending}
          >
            {TRANSITIONS[status].map((next) => (
              <option key={next} value={next}>{projectStatusLabel(next)}</option>
            ))}
          </select>
          <button className={styles.secondaryButton} disabled={pending}>
            {pending ? "Updating…" : "Update status"}
          </button>
        </form>
      ) : null}
      {permissions.canArchive ? (
        <button
          type="button"
          className={styles.dangerButton}
          disabled={pending}
          onClick={() => archive(false)}
        >
          Archive {singular.toLowerCase()}
        </button>
      ) : null}
      {permissions.canRestore ? (
        <button
          type="button"
          className={styles.secondaryButton}
          disabled={pending}
          onClick={() => archive(true)}
        >
          Restore {singular.toLowerCase()}
        </button>
      ) : null}
    </section>
  );
}
