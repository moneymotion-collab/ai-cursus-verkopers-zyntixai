import { Badge } from "@/components/ui/badge";
import type { AttentionListWorkspaceRow } from "@/features/attention/ui/load-attention-list-page";
import { AttentionEmptyPanel } from "@/features/attention/ui/attention-state-panels";
import { canShowAttentionLifecycleActions } from "@/features/attention/ui/attention-workflow-visibility";
import type { AttentionSeverity } from "@/features/attention/domain/types";
import styles from "./attention-list.module.css";

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
  statusKey: AttentionListWorkspaceRow["statusKey"],
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

export type AttentionListPresentationProps = {
  rows: AttentionListWorkspaceRow[];
  organizationName: string;
  timeZone: string;
  shownCount: number;
  totalCount: number;
  pageSize: number;
};

function AttentionListItemMeta({ row }: { row: AttentionListWorkspaceRow }) {
  return (
    <dl className={styles.meta}>
      <div>
        <dt>Type</dt>
        <dd>{row.attentionTypeLabel}</dd>
      </div>
      <div>
        <dt>Customer</dt>
        <dd>{row.customerLabel}</dd>
      </div>
      <div>
        <dt>Program</dt>
        <dd>{row.programLabel}</dd>
      </div>
      <div>
        <dt>Assignee</dt>
        <dd>{row.assigneeLabel}</dd>
      </div>
      <div>
        <dt>Acknowledgement</dt>
        <dd>{row.acknowledgementLabel}</dd>
      </div>
      <div>
        <dt>Last detected</dt>
        <dd>{row.lastDetectedAtLabel}</dd>
      </div>
      <div>
        <dt>Created</dt>
        <dd>{row.createdAtLabel}</dd>
      </div>
    </dl>
  );
}

function AttentionListItemBadges({ row }: { row: AttentionListWorkspaceRow }) {
  return (
    <div className={styles.badges}>
      <Badge variant={statusBadgeVariant(row.statusKey)}>{row.statusLabel}</Badge>
      <Badge variant={severityBadgeVariant(row.severityKey)}>
        {row.severityLabel}
      </Badge>
      {row.isArchived ? <Badge variant="neutral">Archived</Badge> : null}
    </div>
  );
}

/**
 * Read-only Attention list workspace (B1.7.5-B).
 * No detail links (D), filters/pagination controls (C), or lifecycle actions (B1.7.6).
 */
export function AttentionListPresentation({
  rows,
  organizationName,
  timeZone,
  shownCount,
  totalCount,
  pageSize,
}: AttentionListPresentationProps) {
  const showLifecycle = canShowAttentionLifecycleActions();

  if (rows.length === 0) {
    return <AttentionEmptyPanel />;
  }

  const countLabel =
    totalCount > shownCount
      ? `Showing ${shownCount} of ${totalCount} recent attention items (first page, up to ${pageSize}).`
      : `Showing ${shownCount} attention item${shownCount === 1 ? "" : "s"}.`;

  return (
    <section className={styles.workspace} aria-labelledby="attention-list-heading">
      <header className={styles.header}>
        <h1 id="attention-list-heading">Attention</h1>
        <p className={styles.intro}>
          Read-only attention items for {organizationName}. Times shown in {timeZone}.
        </p>
        <p className={styles.count}>{countLabel}</p>
      </header>

      {showLifecycle ? (
        <p>Lifecycle actions must never render in B1.7.5-B.</p>
      ) : null}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <caption className={styles.visuallyHidden}>
            Attention items for {organizationName}
          </caption>
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Status</th>
              <th scope="col">Severity</th>
              <th scope="col">Type</th>
              <th scope="col">Customer</th>
              <th scope="col">Assignee</th>
              <th scope="col">Last detected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className={styles.titleCell}>{row.titleLabel}</span>
                  {row.summaryLabel ? (
                    <span className={styles.summary}>{row.summaryLabel}</span>
                  ) : null}
                  {row.isArchived ? (
                    <span className={styles.inlineBadge}>
                      <Badge variant="neutral">Archived</Badge>
                    </span>
                  ) : null}
                </td>
                <td>
                  <Badge variant={statusBadgeVariant(row.statusKey)}>
                    {row.statusLabel}
                  </Badge>
                </td>
                <td>
                  <Badge variant={severityBadgeVariant(row.severityKey)}>
                    {row.severityLabel}
                  </Badge>
                </td>
                <td>{row.attentionTypeLabel}</td>
                <td>{row.customerLabel}</td>
                <td>
                  <div>{row.assigneeLabel}</div>
                  <div className={styles.secondary}>{row.acknowledgementLabel}</div>
                </td>
                <td>{row.lastDetectedAtLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardList}>
        {rows.map((row) => (
          <li key={row.id} className={styles.card}>
            <h2 className={styles.cardTitle}>{row.titleLabel}</h2>
            {row.summaryLabel ? (
              <p className={styles.cardSummary}>{row.summaryLabel}</p>
            ) : null}
            <AttentionListItemBadges row={row} />
            <AttentionListItemMeta row={row} />
          </li>
        ))}
      </ul>
    </section>
  );
}
