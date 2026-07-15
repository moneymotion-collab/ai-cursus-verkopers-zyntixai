import type { CustomerListItemReadModel } from "@/features/customers/domain/read-types";
import { Badge } from "@/components/ui/badge";
import { buildCustomerDetailHref } from "@/features/customers/ui/customer-navigation";
import type { CustomerListUrlState } from "@/features/customers/ui/customer-list-search-params";
import {
  toCustomerListPresentationRow,
  type CustomerListPresentationRow,
} from "@/features/customers/ui/customer-presentation";
import styles from "./customer-list.module.css";

export type CustomerListPresentationProps = {
  customers: CustomerListItemReadModel[];
  timeZone: string;
  listState: CustomerListUrlState;
  emptyTitle: string;
  emptyDescription: string;
  clearFiltersHref?: string;
};

function badgeVariantForStatus(label: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (label === "Active" || label === "Completed") return "success";
  if (label === "Cancelled" || label === "Churned") return "danger";
  if (label === "Paused") return "warning";
  return "neutral";
}

export function mapCustomersToPresentationRows(
  customers: CustomerListItemReadModel[],
  timeZone: string,
  listState: CustomerListUrlState,
): CustomerListPresentationRow[] {
  return customers.map((customer) =>
    toCustomerListPresentationRow(customer, {
      timeZone,
      detailHref: buildCustomerDetailHref(customer.id, listState),
    }),
  );
}

export function CustomerListPresentation({
  customers,
  timeZone,
  listState,
  emptyTitle,
  emptyDescription,
  clearFiltersHref,
}: CustomerListPresentationProps) {
  const rows = mapCustomersToPresentationRows(customers, timeZone, listState);

  if (rows.length === 0) {
    return (
      <section className={styles.emptyWrap} aria-labelledby="customer-list-empty-title">
        <h2 id="customer-list-empty-title" className={styles.visuallyHidden}>
          {emptyTitle}
        </h2>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        <p className={styles.emptyDescription}>{emptyDescription}</p>
        {clearFiltersHref ? (
          <a className={styles.clearLink} href={clearFiltersHref}>
            Clear filters
          </a>
        ) : null}
      </section>
    );
  }

  return (
    <div className={styles.listContainer}>
      <div className={styles.tableWrap} aria-busy="false">
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Customer</th>
              <th scope="col">Status</th>
              <th scope="col">Owner</th>
              <th scope="col">Email</th>
              <th scope="col">Started</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <a className={styles.titleLink} href={row.detailHref}>
                    <span className={styles.titleCell}>{row.displayName}</span>
                  </a>
                  {row.archivedLabel ? (
                    <span className={styles.archivedInline}>
                      <Badge variant="info">{row.archivedLabel}</Badge>
                    </span>
                  ) : null}
                </td>
                <td>
                  <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
                </td>
                <td>{row.ownerLabel}</td>
                <td>{row.emailLabel}</td>
                <td>{row.startedAtLabel}</td>
                <td>{row.updatedAtLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardList} aria-label="Customer list">
        {rows.map((row) => (
          <li key={row.id} className={styles.card}>
            <h3 className={styles.cardTitle}>
              <a href={row.detailHref}>{row.displayName}</a>
            </h3>
            <div className={styles.cardBadges}>
              <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
              {row.archivedLabel ? <Badge variant="info">{row.archivedLabel}</Badge> : null}
            </div>
            <dl className={styles.cardMeta}>
              <div>
                <dt>Owner</dt>
                <dd>{row.ownerLabel}</dd>
              </div>
              {row.emailLabel !== "Not provided" ? (
                <div>
                  <dt>Email</dt>
                  <dd>{row.emailLabel}</dd>
                </div>
              ) : null}
              <div>
                <dt>Updated</dt>
                <dd>{row.updatedAtLabel}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
