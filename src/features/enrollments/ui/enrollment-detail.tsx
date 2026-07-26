import { Badge } from "@/components/ui/badge";
import type { EnrollmentDetailViewModel } from "@/features/enrollments/ui/load-enrollment-detail-page";
import {
  formatEnrollmentDate,
  formatOptionalEnrollmentDate,
} from "@/features/enrollments/ui/enrollment-presentation";
import { EnrollmentHistorySection } from "@/features/enrollments/ui/enrollment-history";
import styles from "./enrollment-detail.module.css";

export type EnrollmentWorkflowLinks = {
  edit?: string;
  status?: string;
  archive?: string;
  restore?: string;
};

type EnrollmentDetailProps = {
  viewModel: EnrollmentDetailViewModel;
  reloadHref?: string;
  workflowLinks?: EnrollmentWorkflowLinks;
};

function badgeVariantForStatus(
  label: string,
): "neutral" | "success" | "warning" | "danger" | "info" {
  if (label === "Active") return "success";
  if (label === "Cancelled") return "danger";
  if (label === "Paused") return "warning";
  if (label === "Completed") return "info";
  return "neutral";
}

export function EnrollmentUnavailableDetail({ backHref }: { backHref: string }) {
  return (
    <section className={styles.statePanel} aria-labelledby="enrollment-unavailable-title">
      <h1 id="enrollment-unavailable-title">Enrollment unavailable</h1>
      <p>This enrollment is unavailable. It may have been removed or you may not have access.</p>
      <p>
        <a href={backHref}>Back to enrollments</a>
      </p>
    </section>
  );
}

export function EnrollmentDetail({ viewModel, reloadHref, workflowLinks }: EnrollmentDetailProps) {
  const {
    enrollment,
    history,
    historyState,
    ownerLabel,
    sourceLabel,
    organizationTimezone,
    backHref,
    customerLabel,
    programLabel,
    customerHref,
    programHref,
  } = viewModel;

  return (
    <article className={styles.enrollmentDetail}>
      <a className={styles.backLink} href={backHref}>
        Back to enrollments
      </a>

      <header className={styles.header}>
        <h1 className={styles.title}>
          {customerLabel} · {programLabel}
        </h1>
        <div className={styles.badgeRow}>
          <Badge variant={badgeVariantForStatus(enrollment.statusLabel)}>
            {enrollment.statusLabel}
          </Badge>
          {enrollment.derived.isArchived ? <Badge variant="info">Archived</Badge> : null}
        </div>
        {workflowLinks ? (
          <nav className={styles.workflowLinks} aria-label="Enrollment actions">
            {workflowLinks.edit ? <a href={workflowLinks.edit}>Edit owner</a> : null}
            {workflowLinks.status ? <a href={workflowLinks.status}>Change status</a> : null}
            {workflowLinks.archive ? (
              <a href={workflowLinks.archive}>Archive enrollment</a>
            ) : null}
            {workflowLinks.restore ? (
              <a href={workflowLinks.restore}>Restore enrollment</a>
            ) : null}
          </nav>
        ) : null}
      </header>

      <div className={styles.layout}>
        <section className={styles.identitySection} aria-labelledby="enrollment-details-title">
          <h2 id="enrollment-details-title">Enrollment details</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Status</dt>
              <dd>{enrollment.statusLabel}</dd>
            </div>
            <div>
              <dt>Archive status</dt>
              <dd>{enrollment.derived.isArchived ? "Archived" : "Not archived"}</dd>
            </div>
            <div>
              <dt>Customer</dt>
              <dd>{customerHref ? <a href={customerHref}>{customerLabel}</a> : customerLabel}</dd>
            </div>
            <div>
              <dt>Program</dt>
              <dd>{programHref ? <a href={programHref}>{programLabel}</a> : programLabel}</dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{ownerLabel}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{sourceLabel}</dd>
            </div>
            <div>
              <dt>Enrolled</dt>
              <dd>{formatEnrollmentDate(enrollment.enrolledAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Started</dt>
              <dd>{formatOptionalEnrollmentDate(enrollment.startedAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Completed</dt>
              <dd>{formatOptionalEnrollmentDate(enrollment.completedAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Cancelled</dt>
              <dd>{formatOptionalEnrollmentDate(enrollment.cancelledAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatEnrollmentDate(enrollment.createdAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatEnrollmentDate(enrollment.updatedAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Archived at</dt>
              <dd>{formatOptionalEnrollmentDate(enrollment.archivedAt, organizationTimezone)}</dd>
            </div>
          </dl>
          <p className={styles.boundaryNote}>
            Progress tracking within this enrollment is deferred to a later phase.
          </p>
        </section>

        <div className={styles.panels}>
          <EnrollmentHistorySection
            history={history}
            historyState={historyState}
            reloadHref={reloadHref}
          />
        </div>
      </div>
    </article>
  );
}
