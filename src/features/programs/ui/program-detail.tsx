import { Badge } from "@/components/ui/badge";
import type { ProgramDetailViewModel } from "@/features/programs/ui/load-program-detail-page";
import {
  formatProgramDate,
  formatOptionalProgramDate,
} from "@/features/programs/ui/program-presentation";
import { ProgramHistorySection } from "@/features/programs/ui/program-history";
import styles from "./program-detail.module.css";

export type ProgramWorkflowLinks = {
  edit?: string;
  status?: string;
  archive?: string;
  restore?: string;
};

export type ProgramEnrollmentLinks = {
  viewEnrollmentsHref: string;
  createEnrollmentHref?: string;
};

export type ProgramProgressLinks = {
  viewProgressHref: string;
};

type ProgramDetailProps = {
  viewModel: ProgramDetailViewModel;
  reloadHref?: string;
  workflowLinks?: ProgramWorkflowLinks;
  enrollmentLinks?: ProgramEnrollmentLinks;
  progressLinks?: ProgramProgressLinks;
};

function badgeVariantForStatus(
  label: string,
): "neutral" | "success" | "warning" | "danger" | "info" {
  if (label === "Active") return "success";
  if (label === "Retired") return "danger";
  if (label === "Paused") return "warning";
  return "neutral";
}

export function ProgramUnavailableDetail({ backHref }: { backHref: string }) {
  return (
    <section className={styles.statePanel} aria-labelledby="program-unavailable-title">
      <h1 id="program-unavailable-title">Program unavailable</h1>
      <p>This program is unavailable. It may have been removed or you may not have access.</p>
      <p>
        <a href={backHref}>Back to programs</a>
      </p>
    </section>
  );
}

export function ProgramDetail({
  viewModel,
  reloadHref,
  workflowLinks,
  enrollmentLinks,
  progressLinks,
}: ProgramDetailProps) {
  const { program, history, historyState, descriptionLabel, organizationTimezone, backHref } =
    viewModel;

  return (
    <article className={styles.programDetail}>
      <a className={styles.backLink} href={backHref}>
        Back to programs
      </a>

      <header className={styles.header}>
        <h1 className={styles.title}>{program.name}</h1>
        <div className={styles.badgeRow}>
          <Badge variant={badgeVariantForStatus(program.statusLabel)}>
            {program.statusLabel}
          </Badge>
          {program.derived.isArchived ? <Badge variant="info">Archived</Badge> : null}
        </div>
        {workflowLinks ? (
          <nav className={styles.workflowLinks} aria-label="Program actions">
            {workflowLinks.edit ? <a href={workflowLinks.edit}>Edit program</a> : null}
            {workflowLinks.status ? (
              <a href={workflowLinks.status}>Change program status</a>
            ) : null}
            {workflowLinks.archive ? <a href={workflowLinks.archive}>Archive program</a> : null}
            {workflowLinks.restore ? <a href={workflowLinks.restore}>Restore program</a> : null}
          </nav>
        ) : null}
      </header>

      <div className={styles.layout}>
        <section className={styles.identitySection} aria-labelledby="program-details-title">
          <h2 id="program-details-title">Program details</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Program name</dt>
              <dd>{program.name}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{descriptionLabel}</dd>
            </div>
            <div>
              <dt>Delivery mode</dt>
              <dd>{program.deliveryModeLabel}</dd>
            </div>
            <div>
              <dt>Lifecycle status</dt>
              <dd>{program.statusLabel}</dd>
            </div>
            <div>
              <dt>Archive status</dt>
              <dd>{program.derived.isArchived ? "Archived" : "Not archived"}</dd>
            </div>
            <div>
              <dt>Open enrollments</dt>
              <dd>{program.openEnrollmentCount}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatProgramDate(program.createdAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatProgramDate(program.updatedAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Archived at</dt>
              <dd>{formatOptionalProgramDate(program.archivedAt, organizationTimezone)}</dd>
            </div>
          </dl>
          <p className={styles.boundaryNote}>
            Enrollments are managed in the Enrollments workspace. The open enrollment count is shown
            for awareness. Progress for enrollments in this program is recorded and reviewed in the
            Progress workspace.
          </p>
          {enrollmentLinks ? (
            <nav className={styles.enrollmentLinks} aria-label="Enrollment actions">
              <a href={enrollmentLinks.viewEnrollmentsHref}>View enrollments</a>
              {enrollmentLinks.createEnrollmentHref ? (
                <a href={enrollmentLinks.createEnrollmentHref}>New enrollment</a>
              ) : null}
            </nav>
          ) : null}
          {progressLinks ? (
            <nav className={styles.progressLinks} aria-label="Progress actions">
              <a href={progressLinks.viewProgressHref}>View progress</a>
            </nav>
          ) : null}
        </section>

        <div className={styles.panels}>
          <ProgramHistorySection
            history={history}
            historyState={historyState}
            reloadHref={reloadHref}
          />
        </div>
      </div>
    </article>
  );
}
