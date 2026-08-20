import { Badge } from "@/components/ui/badge";
import { AttentionEvaluateRulesActions } from "@/features/attention/ui/attention-evaluate-rules-actions";
import type { EnrollmentDetailViewModel } from "@/features/enrollments/ui/load-enrollment-detail-page";
import {
  formatEnrollmentDate,
  formatOptionalEnrollmentDate,
} from "@/features/enrollments/ui/enrollment-presentation";
import { EnrollmentHistorySection } from "@/features/enrollments/ui/enrollment-history";
import type { AttentionSeverity } from "@/features/attention/domain/types";
import styles from "./enrollment-detail.module.css";

export type EnrollmentWorkflowLinks = {
  edit?: string;
  status?: string;
  archive?: string;
  restore?: string;
};

export type EnrollmentProgressLinks = {
  viewProgressHref: string;
  recordProgressHref?: string;
};

export type EnrollmentAttentionLinks = {
  viewAttentionHref: string;
  /** Owner/Admin only — gated by canEvaluateRules before render. */
  evaluateRules?: {
    organizationId: string;
    enrollmentId: string;
    returnPath: string;
  };
};

type EnrollmentDetailProps = {
  viewModel: EnrollmentDetailViewModel;
  reloadHref?: string;
  workflowLinks?: EnrollmentWorkflowLinks;
  progressLinks?: EnrollmentProgressLinks;
  attentionLinks?: EnrollmentAttentionLinks;
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

function badgeVariantForHealth(
  health: EnrollmentDetailViewModel["operational"]["progress"]["health"],
): "neutral" | "success" | "warning" | "danger" | "info" {
  if (health === "healthy") return "success";
  if (health === "no_recent_progress") return "warning";
  if (health === "no_progress_yet") return "info";
  return "neutral";
}

function badgeVariantForSeverity(
  severity: AttentionSeverity,
): "neutral" | "info" | "warning" | "danger" {
  switch (severity) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "neutral";
  }
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

export function EnrollmentDetail({
  viewModel,
  reloadHref,
  workflowLinks,
  progressLinks,
  attentionLinks,
}: EnrollmentDetailProps) {
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
    operational,
  } = viewModel;

  const { progress, attention, nextAction } = operational;

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
          <Badge variant={badgeVariantForHealth(progress.health)}>
            {progress.healthLabel}
          </Badge>
        </div>
        {nextAction ? (
          <div className={styles.nextAction} role="region" aria-labelledby="enrollment-next-action-title">
            <h2 id="enrollment-next-action-title" className={styles.nextActionTitle}>
              Next action
            </h2>
            <p className={styles.nextActionReason}>{nextAction.reason}</p>
            <a className={styles.nextActionLink} href={nextAction.href}>
              {nextAction.label}
            </a>
          </div>
        ) : null}
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
        </section>

        <section className={styles.opsSection} aria-labelledby="enrollment-progress-title">
          <h2 id="enrollment-progress-title">Progress</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Progress health</dt>
              <dd>
                <Badge variant={badgeVariantForHealth(progress.health)}>
                  {progress.healthLabel}
                </Badge>
              </dd>
            </div>
            <div>
              <dt>Recorded progress facts</dt>
              <dd>{progress.nonVoidedFactCount}</dd>
            </div>
            <div>
              <dt>Last meaningful progress</dt>
              <dd>
                {progress.latest
                  ? formatEnrollmentDate(progress.latest.occurredAt, organizationTimezone)
                  : "No progress recorded yet"}
              </dd>
            </div>
            {progress.latest ? (
              <>
                <div>
                  <dt>Last progress type</dt>
                  <dd>{progress.latest.factTypeLabel}</dd>
                </div>
                <div>
                  <dt>Last progress title</dt>
                  <dd>{progress.latest.title}</dd>
                </div>
              </>
            ) : null}
            {progress.staleEligible && progress.ageCalendarDays != null ? (
              <div>
                <dt>Days since progress reference (UTC)</dt>
                <dd>
                  {progress.ageCalendarDays}
                  {progress.stale ? " — exceeds 14-day stale threshold" : ""}
                </dd>
              </div>
            ) : null}
          </dl>
          {progressLinks ? (
            <nav className={styles.progressLinks} aria-label="Progress actions">
              <a href={progressLinks.viewProgressHref}>View progress</a>
              {progressLinks.recordProgressHref ? (
                <a href={progressLinks.recordProgressHref}>Record progress</a>
              ) : null}
            </nav>
          ) : null}
        </section>

        {attentionLinks ? (
          <section className={styles.opsSection} aria-labelledby="enrollment-attention-title">
            <h2 id="enrollment-attention-title">Attention</h2>
            {attention.openCount === 0 ? (
              <p className={styles.boundaryNote}>
                No open Attention for this enrollment.
              </p>
            ) : (
              <ul className={styles.attentionSummaryList}>
                {attention.items.map((item) => (
                  <li key={item.id} className={styles.attentionSummaryItem}>
                    <a href={item.href}>{item.title}</a>
                    <div className={styles.badgeRow}>
                      <Badge variant={badgeVariantForSeverity(item.severity)}>
                        {item.severity}
                      </Badge>
                      <Badge variant="neutral">{item.status}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.boundaryNote}>
              Lifecycle actions (acknowledge, resolve, dismiss) remain in the Attention
              workspace.
            </p>
            <nav className={styles.attentionLinks} aria-label="Attention actions">
              <a href={attentionLinks.viewAttentionHref}>View all attention</a>
            </nav>
            {attentionLinks.evaluateRules ? (
              <AttentionEvaluateRulesActions
                organizationId={attentionLinks.evaluateRules.organizationId}
                enrollmentId={attentionLinks.evaluateRules.enrollmentId}
                returnPath={attentionLinks.evaluateRules.returnPath}
                heading="Refresh this enrollment’s Attention"
                description="Re-evaluates no-recent-progress for this enrollment only (14 UTC calendar days). Creates or updates one Attention item when stale; expires it when progress resumes."
                buttonLabel="Evaluate this enrollment"
              />
            ) : null}
          </section>
        ) : null}

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
