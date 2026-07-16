import type { LeadListItemReadModel } from "@/features/leads/domain/read-types";
import { Badge } from "@/components/ui/badge";
import { buildLeadDetailHref } from "@/features/leads/ui/lead-navigation";
import type { LeadListUrlState } from "@/features/leads/ui/lead-list-search-params";
import {
  toLeadListPresentationRow,
  type LeadListPresentationRow,
} from "@/features/leads/ui/lead-presentation";
import styles from "./lead-list.module.css";

export type LeadListPresentationProps = {
  leads: LeadListItemReadModel[];
  timeZone: string;
  listState: LeadListUrlState;
  emptyTitle: string;
  emptyDescription: string;
  clearFiltersHref?: string;
};

function badgeVariantForStatus(label: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (label === "Open") return "info";
  if (label === "Converted") return "success";
  if (label === "Lost" || label === "Disqualified") return "danger";
  return "neutral";
}

export function mapLeadsToPresentationRows(
  leads: LeadListItemReadModel[],
  timeZone: string,
  listState: LeadListUrlState,
): LeadListPresentationRow[] {
  return leads.map((lead) =>
    toLeadListPresentationRow(lead, {
      timeZone,
      detailHref: buildLeadDetailHref(lead.id, listState),
    }),
  );
}

export function LeadListPresentation({
  leads,
  timeZone,
  listState,
  emptyTitle,
  emptyDescription,
  clearFiltersHref,
}: LeadListPresentationProps) {
  const rows = mapLeadsToPresentationRows(leads, timeZone, listState);

  if (rows.length === 0) {
    return (
      <section className={styles.emptyWrap} aria-labelledby="lead-list-empty-title">
        <h2 id="lead-list-empty-title" className={styles.visuallyHidden}>
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
              <th scope="col">Lead</th>
              <th scope="col">Status</th>
              <th scope="col">Pipeline stage</th>
              <th scope="col">Owner</th>
              <th scope="col">Email</th>
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
                  <div className={styles.inlineBadges}>
                    {row.archivedLabel ? (
                      <span className={styles.archivedInline}>
                        <Badge variant="info">{row.archivedLabel}</Badge>
                      </span>
                    ) : null}
                    {row.convertedLabel ? (
                      <span className={styles.archivedInline}>
                        <Badge variant="success">{row.convertedLabel}</Badge>
                      </span>
                    ) : null}
                  </div>
                </td>
                <td>
                  <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
                </td>
                <td>{row.stageLabel}</td>
                <td>{row.ownerLabel}</td>
                <td>{row.emailLabel}</td>
                <td>{row.updatedAtLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardList} aria-label="Lead list">
        {rows.map((row) => (
          <li key={row.id} className={styles.card}>
            <h3 className={styles.cardTitle}>
              <a href={row.detailHref}>{row.displayName}</a>
            </h3>
            <div className={styles.cardBadges}>
              <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
              <Badge variant="neutral">{row.stageLabel}</Badge>
              {row.archivedLabel ? <Badge variant="info">{row.archivedLabel}</Badge> : null}
              {row.convertedLabel ? <Badge variant="success">{row.convertedLabel}</Badge> : null}
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
