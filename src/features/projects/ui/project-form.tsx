"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createProjectAction,
  updateProjectAction,
  type ProjectActionResult,
} from "@/features/projects/actions/project-actions";
import { buildProjectDetailHref } from "@/features/projects/domain/projects-navigation";
import type {
  ProjectFormOptions,
  ProjectRecord,
} from "@/features/projects/domain/types";
import type { ProductTerminology } from "@/features/product-access/domain/terminology";
import styles from "./projects.module.css";

type ProjectFormProps = {
  organizationId: string;
  options: ProjectFormOptions;
  terminology: ProductTerminology;
  project?: ProjectRecord;
  initialCustomerId?: string;
};

export function ProjectForm({
  organizationId,
  options,
  terminology,
  project,
  initialCustomerId,
}: ProjectFormProps) {
  const router = useRouter();
  const singular = terminology.project.singular;
  const customer = terminology.customer.singular;
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ProjectActionResult | null>(null);
  const [customerId, setCustomerId] = useState(project?.customerId ?? initialCustomerId ?? "");
  const [name, setName] = useState(project?.name ?? "");
  const [summary, setSummary] = useState(project?.summary ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState(project?.ownerMemberId ?? "");
  const [plannedStart, setPlannedStart] = useState(project?.plannedStart ?? "");
  const [plannedEnd, setPlannedEnd] = useState(project?.plannedEnd ?? "");
  const fieldErrors = result && !result.ok ? result.fieldErrors : undefined;
  const listHref = `/projects?org=${encodeURIComponent(organizationId)}`;
  const cancelHref = project ? buildProjectDetailHref(project.id, organizationId) : listHref;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setResult(null);
    const payload = {
      organizationId,
      customerId,
      name,
      summary,
      ownerMemberId,
      plannedStart,
      plannedEnd,
    };
    const next = project
      ? await updateProjectAction({ ...payload, projectId: project.id })
      : await createProjectAction(payload);
    setResult(next);
    if (next.ok) {
      router.push(buildProjectDetailHref(next.projectId, organizationId));
      router.refresh();
      return;
    }
    setPending(false);
  }

  const error = (field: string) => fieldErrors?.[field];
  return (
    <form className={styles.form} onSubmit={submit} aria-busy={pending} noValidate>
      <a href={cancelHref} className={styles.backLink}>
        Back to {project ? singular.toLowerCase() : terminology.project.plural.toLowerCase()}
      </a>
      <header>
        <h1>{project ? `Edit ${singular.toLowerCase()}` : `Create ${singular.toLowerCase()}`}</h1>
        <p className={styles.muted}>
          Keep delivery ownership, customer context, and planned dates together.
        </p>
      </header>

      {options.warning ? <p className={styles.warning} role="alert">{options.warning}</p> : null}
      {result && !result.ok ? <p className={styles.error} role="alert">{result.message}</p> : null}

      <section className={styles.panel} aria-labelledby="project-fields-title">
        <h2 id="project-fields-title">{singular} details</h2>
        <div className={styles.field}>
          <label htmlFor="project-customer">{customer} (required)</label>
          <select
            id="project-customer"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            required
            disabled={pending || Boolean(options.warning)}
            aria-invalid={Boolean(error("customerId"))}
          >
            <option value="">Select a {customer.toLowerCase()}</option>
            {options.customers.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          {error("customerId") ? <p className={styles.fieldError}>{error("customerId")}</p> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="project-name">{singular} name (required)</label>
          <input
            id="project-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={200}
            disabled={pending}
            aria-invalid={Boolean(error("name"))}
          />
          {error("name") ? <p className={styles.fieldError}>{error("name")}</p> : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="project-summary">Summary</label>
          <textarea
            id="project-summary"
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            maxLength={4000}
            disabled={pending}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="project-owner">Owner</label>
          <select
            id="project-owner"
            value={ownerMemberId}
            onChange={(event) => setOwnerMemberId(event.target.value)}
            disabled={pending}
          >
            <option value="">Unassigned</option>
            {options.members.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className={styles.dateRow}>
          <div className={styles.field}>
            <label htmlFor="project-start">Planned start</label>
            <input
              id="project-start"
              type="date"
              value={plannedStart}
              onChange={(event) => setPlannedStart(event.target.value)}
              disabled={pending}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="project-end">Planned end</label>
            <input
              id="project-end"
              type="date"
              value={plannedEnd}
              onChange={(event) => setPlannedEnd(event.target.value)}
              disabled={pending}
              aria-invalid={Boolean(error("plannedEnd"))}
            />
            {error("plannedEnd") ? <p className={styles.fieldError}>{error("plannedEnd")}</p> : null}
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button className={styles.primaryButton} disabled={pending || Boolean(options.warning)}>
          {pending ? "Saving…" : project ? `Save ${singular.toLowerCase()}` : `Create ${singular.toLowerCase()}`}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>Cancel</a>
      </div>
    </form>
  );
}
