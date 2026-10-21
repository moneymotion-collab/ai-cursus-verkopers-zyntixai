import { Badge } from "@/components/ui/badge";
import type { ProgressDetailViewModel } from "@/features/progress/ui/load-progress-detail-page";
import styles from "./progress-detail.module.css";

export type ProgressDetailWorkflowLinks = {
  record?: string;
  void?: string;
  correct?: string;
};

type ProgressDetailProps = {
  viewModel: ProgressDetailViewModel;
  workflowLinks?: ProgressDetailWorkflowLinks;
};

export function ProgressUnavailableDetail({ backHref }: { backHref: string }) {
  return (
    <section className={styles.statePanel} aria-labelledby="progress-unavailable-title">
      <h1 id="progress-unavailable-title">Progress unavailable</h1>
      <p>
        This progress record is unavailable. It may have been removed or you may not have
        access.
      </p>
      <p>
        <a href={backHref}>Back to progress</a>
      </p>
    </section>
  );
}

export function ProgressDetail({ viewModel, workflowLinks }: ProgressDetailProps) {
  const {
    fact,
    titleLabel,
    customerLabel,
    programLabel,
    enrollmentStatusLabel,
    enrollmentArchived,
    recorderLabel,
    voidedByLabel,
    occurredAtLabel,
    recordedAtLabel,
    voidedAtLabel,
    customerHref,
    programHref,
    enrollmentHref,
    correctedFromHref,
    backHref,
    organizationTimezone,
  } = viewModel;

  const hasWorkflowActions = Boolean(
    workflowLinks?.record || workflowLinks?.void || workflowLinks?.correct,
  );

  return (
    <article className={styles.progressDetail}>
      <a className={styles.backLink} href={backHref}>
        Back to progress
      </a>

      <header className={styles.header}>
        <h1 className={styles.title}>{titleLabel}</h1>
        <div className={styles.badgeRow}>
          <Badge variant="neutral">{fact.factTypeLabel}</Badge>
          <Badge variant="info">{fact.sourceLabel}</Badge>
          {fact.derived.isVoided ? <Badge variant="danger">Voided</Badge> : null}
          {fact.derived.isCorrection ? <Badge variant="warning">Correction</Badge> : null}
        </div>
        <p className={styles.subtitle}>Times shown in {organizationTimezone}.</p>
        {hasWorkflowActions ? (
          <div className={styles.actionRow}>
            {workflowLinks?.record ? (
              <a className={styles.actionLink} href={workflowLinks.record}>
                Record progress
              </a>
            ) : null}
            {workflowLinks?.correct ? (
              <a className={styles.actionLink} href={workflowLinks.correct}>
                Correct
              </a>
            ) : null}
            {workflowLinks?.void ? (
              <a className={styles.destructiveActionLink} href={workflowLinks.void}>
                Void
              </a>
            ) : null}
          </div>
        ) : null}
      </header>

      <div className={styles.layout}>
        <section className={styles.identitySection} aria-labelledby="progress-fact-heading">
          <h2 id="progress-fact-heading">Fact details</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Occurred</dt>
              <dd>{occurredAtLabel}</dd>
            </div>
            <div>
              <dt>Recorded</dt>
              <dd>{recordedAtLabel}</dd>
            </div>
            <div>
              <dt>Recorded by</dt>
              <dd>{recorderLabel}</dd>
            </div>
            {fact.description ? (
              <div>
                <dt>Description</dt>
                <dd>{fact.description}</dd>
              </div>
            ) : null}
            {fact.numericValue != null ? (
              <div>
                <dt>Value</dt>
                <dd>
                  {fact.numericValue}
                  {fact.numericUnit ? ` ${fact.numericUnit}` : ""}
                </dd>
              </div>
            ) : null}
            {fact.isComplete != null ? (
              <div>
                <dt>Complete</dt>
                <dd>{fact.isComplete ? "Yes" : "No"}</dd>
              </div>
            ) : null}
            {fact.sequenceNumber != null ? (
              <div>
                <dt>Sequence</dt>
                <dd>{fact.sequenceNumber}</dd>
              </div>
            ) : null}
            {correctedFromHref ? (
              <div>
                <dt>Corrected from</dt>
                <dd>
                  <a href={correctedFromHref}>View previous fact</a>
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section
          className={styles.identitySection}
          aria-labelledby="progress-context-heading"
        >
          <h2 id="progress-context-heading">Related context</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Customer</dt>
              <dd>
                {customerHref ? <a href={customerHref}>{customerLabel}</a> : customerLabel}
              </dd>
            </div>
            <div>
              <dt>Program</dt>
              <dd>
                {programHref ? <a href={programHref}>{programLabel}</a> : programLabel}
              </dd>
            </div>
            <div>
              <dt>Enrollment</dt>
              <dd>
                {enrollmentHref ? (
                  <a href={enrollmentHref}>{enrollmentStatusLabel}</a>
                ) : (
                  enrollmentStatusLabel
                )}
                {enrollmentArchived ? (
                  <span className={styles.inlineBadge}>
                    {" "}
                    <Badge variant="info">Archived</Badge>
                  </span>
                ) : null}
              </dd>
            </div>
          </dl>
        </section>

        {fact.derived.isVoided ? (
          <section
            className={styles.identitySection}
            aria-labelledby="progress-voided-heading"
          >
            <h2 id="progress-voided-heading">Void details</h2>
            <dl className={styles.metaGrid}>
              <div>
                <dt>Voided at</dt>
                <dd>{voidedAtLabel ?? "Unknown"}</dd>
              </div>
              <div>
                <dt>Voided by</dt>
                <dd>{voidedByLabel ?? "Unavailable member"}</dd>
              </div>
              {fact.voidReason ? (
                <div>
                  <dt>Reason</dt>
                  <dd>{fact.voidReason}</dd>
                </div>
              ) : null}
            </dl>
            <p className={styles.boundaryNote}>
              Voided progress is shown read-only. Voided records cannot be voided or corrected
              again.
            </p>
          </section>
        ) : null}
      </div>
    </article>
  );
}
