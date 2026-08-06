import { Badge } from "@/components/ui/badge";
import { buildAttentionDetailHref } from "@/features/attention/domain/attention-navigation";
import { resolveAttentionLifecycleActionVisibility } from "@/features/attention/domain/lifecycle-visibility";
import type {
  AttentionRole,
  AttentionSeverity,
} from "@/features/attention/domain/types";
import { AttentionAssignmentActions } from "@/features/attention/ui/attention-assignment-actions";
import { AttentionAcknowledgeSeverityActions } from "@/features/attention/ui/attention-lifecycle-actions";
import { AttentionResolutionDismissActions } from "@/features/attention/ui/attention-resolution-dismiss-actions";
import type { AttentionDetailViewModel } from "@/features/attention/ui/load-attention-detail-page";
import {
  canShowAttentionAcknowledgeSeverityActions,
  canShowAttentionAssignmentActions,
  canShowAttentionResolutionDismissActions,
} from "@/features/attention/ui/attention-workflow-visibility";
import styles from "./attention-detail.module.css";

function severityBadgeVariant(
  severity: AttentionSeverity,
): "neutral" | "info" | "warning" | "danger" {
  switch (severity) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    case "low":
    default:
      return "neutral";
  }
}

function statusBadgeVariant(
  statusKey: AttentionDetailViewModel["detail"]["statusKey"],
): "neutral" | "info" | "success" | "warning" {
  switch (statusKey) {
    case "open":
      return "warning";
    case "acknowledged":
      return "info";
    case "resolved":
      return "success";
    case "dismissed":
    case "expired":
    default:
      return "neutral";
  }
}

type AttentionDetailProps = {
  viewModel: AttentionDetailViewModel;
  organizationId: string;
  role: AttentionRole;
};

/**
 * Attention detail + timeline (B1.7.5-D) with B1.7.6-B acknowledge/severity,
 * B1.7.6-C assignment, and B1.7.6-D resolve/dismiss actions.
 * Archive remains deferred.
 */
export function AttentionDetail({
  viewModel,
  organizationId,
  role,
}: AttentionDetailProps) {
  const {
    detail,
    signals,
    timeline,
    timelineEmpty,
    customerHref,
    programHref,
    enrollmentHref,
    backHref,
    organizationTimezone,
    assigneeMemberId,
    assigneeOptions,
    assigneeOptionsFailed,
  } = viewModel;

  const bScopedActionsEnabled = canShowAttentionAcknowledgeSeverityActions();
  const cScopedActionsEnabled = canShowAttentionAssignmentActions();
  const dScopedActionsEnabled = canShowAttentionResolutionDismissActions();
  const actionVisibility = resolveAttentionLifecycleActionVisibility(role, {
    status: detail.statusKey,
    archivedAt: detail.isArchived ? detail.archivedAtLabel ?? "archived" : null,
    assigneeMemberId,
  });
  const showAcknowledge = bScopedActionsEnabled && actionVisibility.acknowledge;
  const showUpdateSeverity =
    bScopedActionsEnabled && actionVisibility.updateSeverity;
  const showAssign = cScopedActionsEnabled && actionVisibility.assign;
  const showUnassign = cScopedActionsEnabled && actionVisibility.unassign;
  const showResolve = dScopedActionsEnabled && actionVisibility.resolve;
  const showDismiss = dScopedActionsEnabled && actionVisibility.dismiss;
  const returnPath = buildAttentionDetailHref(detail.id, organizationId);

  return (
    <article className={styles.attentionDetail}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol className={styles.breadcrumbList}>
          <li>
            <a className={styles.backLink} href={backHref}>
              Attention
            </a>
          </li>
          <li aria-current="page">
            <span className={styles.breadcrumbCurrent}>{detail.titleLabel}</span>
          </li>
        </ol>
      </nav>

      <header className={styles.header}>
        <h1 className={styles.title}>{detail.titleLabel}</h1>
        <div className={styles.badgeRow}>
          <Badge variant={statusBadgeVariant(detail.statusKey)}>
            {detail.statusLabel}
          </Badge>
          <Badge variant={severityBadgeVariant(detail.severityKey)}>
            {detail.severityLabel}
          </Badge>
          <Badge variant="neutral">{detail.attentionTypeLabel}</Badge>
          {detail.isArchived ? <Badge variant="neutral">Archived</Badge> : null}
        </div>
        {detail.summaryLabel ? (
          <p className={styles.summary}>{detail.summaryLabel}</p>
        ) : null}
        <p className={styles.subtitle}>Times shown in {organizationTimezone}.</p>
      </header>

      <div className={styles.layout}>
        <section
          className={styles.section}
          aria-labelledby="attention-overview-heading"
        >
          <h2 id="attention-overview-heading">Overview</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Status</dt>
              <dd>{detail.statusLabel}</dd>
            </div>
            <div>
              <dt>Severity</dt>
              <dd>{detail.severityLabel}</dd>
            </div>
            <div>
              <dt>Type</dt>
              <dd>{detail.attentionTypeLabel}</dd>
            </div>
            <div>
              <dt>Assignee</dt>
              <dd>{detail.assigneeLabel}</dd>
            </div>
            <div>
              <dt>Acknowledgement</dt>
              <dd>{detail.acknowledgementLabel}</dd>
            </div>
            <div>
              <dt>Detections</dt>
              <dd>{detail.detectionCountLabel}</dd>
            </div>
            <div>
              <dt>First detected</dt>
              <dd>{detail.firstDetectedAtLabel}</dd>
            </div>
            <div>
              <dt>Last detected</dt>
              <dd>{detail.lastDetectedAtLabel}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{detail.createdAtLabel}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{detail.updatedAtLabel}</dd>
            </div>
            {detail.resolvedAtLabel ? (
              <div>
                <dt>Resolved</dt>
                <dd>{detail.resolvedAtLabel}</dd>
              </div>
            ) : null}
            {detail.dismissedAtLabel ? (
              <div>
                <dt>Dismissed</dt>
                <dd>{detail.dismissedAtLabel}</dd>
              </div>
            ) : null}
            {detail.expiredAtLabel ? (
              <div>
                <dt>Expired</dt>
                <dd>{detail.expiredAtLabel}</dd>
              </div>
            ) : null}
            {detail.archivedAtLabel ? (
              <div>
                <dt>Archived</dt>
                <dd>{detail.archivedAtLabel}</dd>
              </div>
            ) : null}
            {detail.resolutionReasonLabel ? (
              <div>
                <dt>Resolution reason</dt>
                <dd>{detail.resolutionReasonLabel}</dd>
              </div>
            ) : null}
            {detail.dismissalReasonLabel ? (
              <div>
                <dt>Dismissal reason</dt>
                <dd>{detail.dismissalReasonLabel}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section
          className={styles.section}
          aria-labelledby="attention-context-heading"
        >
          <h2 id="attention-context-heading">Related context</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Customer</dt>
              <dd>
                {customerHref ? (
                  <a href={customerHref}>{detail.customerLabel}</a>
                ) : (
                  detail.customerLabel
                )}
              </dd>
            </div>
            <div>
              <dt>Program</dt>
              <dd>
                {programHref ? (
                  <a href={programHref}>{detail.programLabel}</a>
                ) : (
                  detail.programLabel
                )}
              </dd>
            </div>
            <div>
              <dt>Enrollment</dt>
              <dd>
                {enrollmentHref && detail.enrollmentStatusLabel ? (
                  <a href={enrollmentHref}>{detail.enrollmentStatusLabel}</a>
                ) : (
                  (detail.enrollmentStatusLabel ?? "Unavailable")
                )}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {showAcknowledge || showUpdateSeverity ? (
        <AttentionAcknowledgeSeverityActions
          organizationId={organizationId}
          attentionItemId={detail.id}
          returnPath={returnPath}
          showAcknowledge={showAcknowledge}
          showUpdateSeverity={showUpdateSeverity}
          currentSeverity={detail.severityKey}
        />
      ) : null}

      {showAssign || showUnassign ? (
        <AttentionAssignmentActions
          organizationId={organizationId}
          attentionItemId={detail.id}
          returnPath={returnPath}
          showAssign={showAssign}
          showUnassign={showUnassign}
          currentAssigneeMemberId={assigneeMemberId}
          assigneeOptions={assigneeOptions}
          assigneeOptionsFailed={assigneeOptionsFailed}
        />
      ) : null}

      {showResolve || showDismiss ? (
        <AttentionResolutionDismissActions
          organizationId={organizationId}
          attentionItemId={detail.id}
          returnPath={returnPath}
          itemTitleLabel={detail.titleLabel}
          showResolve={showResolve}
          showDismiss={showDismiss}
        />
      ) : null}

      <section
        className={styles.section}
        aria-labelledby="attention-signals-heading"
      >
        <h2 id="attention-signals-heading">Signals</h2>
        {signals.length === 0 ? (
          <p className={styles.emptyNote}>No signals recorded for this item.</p>
        ) : (
          <ol className={styles.signalList}>
            {signals.map((signal) => (
              <li key={signal.id} className={styles.signalItem}>
                <div className={styles.signalHeader}>
                  <span className={styles.eventType}>{signal.originLabel}</span>
                  <time dateTime={signal.detectedAt}>
                    {signal.detectedAtLabel}
                  </time>
                </div>
                {signal.ruleLabel ? (
                  <p className={styles.eventSummary}>{signal.ruleLabel}</p>
                ) : null}
                {signal.explanationLabel ? (
                  <p className={styles.eventReason}>{signal.explanationLabel}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <section
        className={styles.section}
        aria-labelledby="attention-timeline-heading"
      >
        <h2 id="attention-timeline-heading">Timeline</h2>
        <p className={styles.timelineHint}>
          Events are shown oldest first, as returned by the authorized read model.
        </p>
        {timelineEmpty ? (
          <p className={styles.emptyNote}>No timeline events yet.</p>
        ) : (
          <ol className={styles.timelineList}>
            {timeline.map((event) => (
              <li key={event.id} className={styles.timelineItem}>
                <div className={styles.eventHeader}>
                  <span className={styles.eventType}>{event.eventTypeLabel}</span>
                  <time dateTime={event.createdAt}>{event.createdAtLabel}</time>
                </div>
                <p className={styles.eventMeta}>
                  {event.sourceLabel}
                  {event.actorLabel ? ` · ${event.actorLabel}` : ""}
                </p>
                {event.summaryLabel ? (
                  <p className={styles.eventSummary}>{event.summaryLabel}</p>
                ) : null}
                {event.reasonLabel ? (
                  <p className={styles.eventReason}>{event.reasonLabel}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>
    </article>
  );
}
