import { Badge } from "@/components/ui/badge";
import type { CustomerDetailViewModel } from "@/features/customers/ui/load-customer-detail";
import {
  formatCustomerContact,
  formatCustomerDate,
  formatCustomerName,
  formatOptionalCustomerDate,
} from "@/features/customers/ui/customer-presentation";
import { CustomerHistorySection } from "@/features/customers/ui/customer-history";
import { CustomerEnrollmentSection } from "@/features/customers/ui/customer-enrollments";
import { CustomerRelatedTasksSection } from "@/features/customers/ui/customer-related-tasks";
import styles from "./customer-detail.module.css";

type CustomerDetailProps = {
  viewModel: CustomerDetailViewModel;
  reloadHref?: string;
  workflowLinks?: CustomerWorkflowLinks;
  enrollmentLinks?: CustomerEnrollmentLinks;
};

export type CustomerWorkflowLinks = {
  edit?: string;
  status?: string;
  archive?: string;
  restore?: string;
};

export type CustomerEnrollmentLinks = {
  viewEnrollmentsHref: string;
  createEnrollmentHref?: string;
};

function badgeVariantForStatus(label: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (label === "Active" || label === "Completed") return "success";
  if (label === "Cancelled" || label === "Churned") return "danger";
  if (label === "Paused") return "warning";
  return "neutral";
}

export function CustomerUnavailableDetail({ backHref }: { backHref: string }) {
  return (
    <section className={styles.statePanel} aria-labelledby="customer-unavailable-title">
      <h1 id="customer-unavailable-title">Customer unavailable</h1>
      <p>This customer is unavailable. It may have been removed or you may not have access.</p>
      <p>
        <a href={backHref}>Back to customers</a>
      </p>
    </section>
  );
}

export function CustomerDetail({
  viewModel,
  reloadHref,
  workflowLinks,
  enrollmentLinks,
}: CustomerDetailProps) {
  const { customer, history, historyState, enrollments, enrollmentState, relatedTasks, relatedTasksState, organizationTimezone, backHref } =
    viewModel;

  const fullName = formatCustomerName(customer.firstName, customer.lastName);

  return (
    <article className={styles.customerDetail}>
      <a className={styles.backLink} href={backHref}>
        Back to customers
      </a>

      <header className={styles.header}>
        <h1 className={styles.title}>{customer.displayName}</h1>
        <div className={styles.badgeRow}>
          <Badge variant={badgeVariantForStatus(customer.statusLabel)}>
            {customer.statusLabel}
          </Badge>
          {customer.derived.isArchived ? <Badge variant="info">Archived</Badge> : null}
        </div>
        {workflowLinks ? (
          <nav className={styles.workflowLinks} aria-label="Customer actions">
            {workflowLinks.edit ? <a href={workflowLinks.edit}>Edit customer</a> : null}
            {workflowLinks.status ? <a href={workflowLinks.status}>Change customer status</a> : null}
            {workflowLinks.archive ? <a href={workflowLinks.archive}>Archive customer</a> : null}
            {workflowLinks.restore ? <a href={workflowLinks.restore}>Restore customer</a> : null}
          </nav>
        ) : null}
      </header>

      <div className={styles.layout}>
        <section className={styles.identitySection} aria-labelledby="customer-details-title">
          <h2 id="customer-details-title">Customer details</h2>
          <dl className={styles.metaGrid}>
            <div>
              <dt>Customer name</dt>
              <dd>{customer.displayName}</dd>
            </div>
            <div>
              <dt>Full name</dt>
              <dd>{fullName}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                {customer.email ? (
                  <a href={`mailto:${customer.email}`}>{formatCustomerContact(customer.email)}</a>
                ) : (
                  formatCustomerContact(customer.email)
                )}
              </dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>
                {customer.phone ? (
                  <a href={`tel:${customer.phone}`}>{formatCustomerContact(customer.phone)}</a>
                ) : (
                  formatCustomerContact(customer.phone)
                )}
              </dd>
            </div>
            <div>
              <dt>Assigned to</dt>
              <dd>{customer.ownerLabel}</dd>
            </div>
            <div>
              <dt>Created by</dt>
              <dd>{customer.createdByLabel}</dd>
            </div>
            <div>
              <dt>Customer status</dt>
              <dd>{customer.statusLabel}</dd>
            </div>
            <div>
              <dt>Archive status</dt>
              <dd>{customer.derived.isArchived ? "Archived" : "Not archived"}</dd>
            </div>
            <div>
              <dt>Customer since</dt>
              <dd>{formatCustomerDate(customer.startedAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>End date</dt>
              <dd>{formatOptionalCustomerDate(customer.endedAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatCustomerDate(customer.createdAt, organizationTimezone)}</dd>
            </div>
            <div>
              <dt>Updated</dt>
              <dd>{formatCustomerDate(customer.updatedAt, organizationTimezone)}</dd>
            </div>
          </dl>
        </section>

        <div className={styles.panels}>
          <CustomerHistorySection
            history={history}
            historyState={historyState}
            reloadHref={reloadHref}
          />
          <CustomerRelatedTasksSection
            tasks={relatedTasks}
            tasksState={relatedTasksState}
            reloadHref={reloadHref}
          />
          <CustomerEnrollmentSection
            enrollments={enrollments}
            enrollmentState={enrollmentState}
            reloadHref={reloadHref}
            timeZone={organizationTimezone}
            enrollmentLinks={enrollmentLinks}
          />
        </div>
      </div>
    </article>
  );
}
