import { Badge } from "@/components/ui/badge";
import type { LeadDetailViewModel } from "@/features/leads/ui/load-lead-detail";
import {
  formatLeadContact,
  formatLeadDate,
  formatLeadName,
} from "@/features/leads/ui/lead-presentation";
import { LeadStatusHistorySection } from "@/features/leads/ui/lead-status-history";
import { LeadStageHistorySection } from "@/features/leads/ui/lead-stage-history";
import { LeadRelatedTasksSection } from "@/features/leads/ui/lead-related-tasks";
import styles from "./lead-detail.module.css";

export type LeadWorkflowLinks = {
  edit?: string;
  stage?: string;
  status?: string;
  convert?: string;
  archive?: string;
  restore?: string;
};

type LeadDetailProps = {
  viewModel: LeadDetailViewModel;
  reloadHref?: string;
  workflowLinks?: LeadWorkflowLinks;
};

function badgeVariantForStatus(label: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (label === "Open") return "info";
  if (label === "Converted") return "success";
  if (label === "Lost" || label === "Disqualified") return "danger";
  return "neutral";
}

export function LeadUnavailableDetail({ backHref }: { backHref: string }) {
  return (
    <section className={styles.statePanel} aria-labelledby="lead-unavailable-title">
      <h1 id="lead-unavailable-title">Lead unavailable</h1>
      <p>This lead is unavailable. It may have been removed or you may not have access.</p>
      <p>
        <a href={backHref}>Back to leads</a>
      </p>
    </section>
  );
}

export function LeadDetail({ viewModel, reloadHref, workflowLinks }: LeadDetailProps) {
  const {
    lead,
    statusHistory,
    statusHistoryState,
    stageHistory,
    stageHistoryState,
    relatedTasks,
    relatedTasksState,
    convertedCustomerHref,
    organizationTimezone,
    backHref,
  } = viewModel;

  const fullName = formatLeadName(lead.firstName, lead.lastName);

  return (
    <article className={styles.leadDetail}>
      <a className={styles.backLink} href={backHref}>
        Back to leads
      </a>

      <header className={styles.header}>
        <h1 className={styles.title}>{lead.displayName}</h1>
        <div className={styles.badgeRow}>
          <Badge variant={badgeVariantForStatus(lead.statusLabel)}>{lead.statusLabel}</Badge>
          <Badge variant="neutral">{lead.stage.name}</Badge>
          {lead.derived.isArchived ? <Badge variant="info">Archived</Badge> : null}
          {lead.derived.isConverted ? <Badge variant="success">Converted</Badge> : null}
        </div>
        {workflowLinks ? (
          <nav className={styles.workflowLinks} aria-label="Lead actions">
            {workflowLinks.edit ? <a href={workflowLinks.edit}>Edit lead</a> : null}
            {workflowLinks.stage ? <a href={workflowLinks.stage}>Change pipeline stage</a> : null}
            {workflowLinks.status ? <a href={workflowLinks.status}>Change lead status</a> : null}
            {workflowLinks.convert ? <a href={workflowLinks.convert}>Convert to customer</a> : null}
            {workflowLinks.archive ? <a href={workflowLinks.archive}>Archive lead</a> : null}
            {workflowLinks.restore ? <a href={workflowLinks.restore}>Restore lead</a> : null}
          </nav>
        ) : null}
      </header>

      <div className={styles.layout}>
        <section className={styles.identitySection} aria-labelledby="lead-identity-title">
          <h2 id="lead-identity-title">Lead overview</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Display name</dt>
              <dd>{lead.displayName}</dd>
            </div>
            <div>
              <dt>Full name</dt>
              <dd>{fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`}>{formatLeadContact(lead.email)}</a>
                ) : (
                  formatLeadContact(lead.email)
                )}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                {lead.phone ? (
                  <a href={`tel:${lead.phone}`}>{formatLeadContact(lead.phone)}</a>
                ) : (
                  formatLeadContact(lead.phone)
                )}
              </dd>
            </div>
            <div>
              <dt>Owner</dt>
              <dd>{lead.ownerLabel}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{lead.createdByLabel}</dd>
            </div>
            <div>
              <dt>Lead status</dt>
              <dd>{lead.statusLabel}</dd>
            </div>
            <div>
              <dt>Pipeline stage</dt>
              <dd>
                {lead.stage.name}
                <span className={styles.stageCategory}> ({lead.stage.stageCategoryLabel})</span>
              </dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>
                {lead.sourceType}
                {lead.sourceDetail ? ` — ${lead.sourceDetail}` : ""}
              </dd>
            </div>
            <div>
              <dt>Pursuit</dt>
              <dd>{lead.pursuitLabel?.trim() || "Not provided"}</dd>
            </div>
            <div>
              <dt>Archive state</dt>
              <dd>{lead.derived.isArchived ? "Archived" : "Not archived"}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatLeadDate(lead.createdAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatLeadDate(lead.updatedAt, organizationTimezone)}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.panels}>
          {lead.convertedCustomer ? (
            <section className={styles.convertedSection} aria-labelledby="lead-converted-title">
              <h2 id="lead-converted-title">Converted customer</h2>
              <p>
                {convertedCustomerHref ? (
                  <a href={convertedCustomerHref}>{lead.convertedCustomer.displayLabel}</a>
                ) : (
                  lead.convertedCustomer.displayLabel
                )}
              </p>
              <p className={styles.convertedMeta}>
                Converted <time>{formatLeadDate(lead.convertedCustomer.convertedAt, organizationTimezone)}</time>
                {lead.convertedCustomer.isArchived ? (
                  <>
                    {" · "}
                    <Badge variant="info">Customer archived</Badge>
                  </>
                ) : null}
              </p>
            </section>
          ) : null}

          <LeadRelatedTasksSection
            tasks={relatedTasks}
            tasksState={relatedTasksState}
            reloadHref={reloadHref}
          />
          <LeadStatusHistorySection
            history={statusHistory}
            historyState={statusHistoryState}
            reloadHref={reloadHref}
          />
          <LeadStageHistorySection
            history={stageHistory}
            historyState={stageHistoryState}
            reloadHref={reloadHref}
          />
        </div>
      </div>
    </article>
  );
}
