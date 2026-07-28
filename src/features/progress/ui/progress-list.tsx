import type { ProgressFactListItemReadModel } from "@/features/progress/domain/read-types";
import { Badge } from "@/components/ui/badge";
import { buildProgressDetailHref } from "@/features/progress/domain/progress-navigation";
import type { ProgressListUrlState } from "@/features/progress/ui/progress-list-search-params";
import { buildProgressListQueryString } from "@/features/progress/ui/progress-list-search-params";
import { resolveMemberLabel } from "@/features/enrollments/server/resolve-enrollment-labels";
import {
  toProgressListPresentationRow,
  type ProgressListPresentationRow,
} from "@/features/progress/ui/progress-presentation";
import styles from "./progress-list.module.css";

export type ProgressListPresentationProps = {
  facts: ProgressFactListItemReadModel[];
  timeZone: string;
  listState: ProgressListUrlState;
  recorderLabels: Record<string, string>;
  emptyTitle: string;
  emptyDescription: string;
  clearFiltersHref?: string;
};

export function mapProgressFactsToPresentationRows(
  facts: ProgressFactListItemReadModel[],
  timeZone: string,
  listState: ProgressListUrlState,
  recorderLabels: Record<string, string>,
): ProgressListPresentationRow[] {
  return facts.map((fact) =>
    toProgressListPresentationRow(fact, {
      timeZone,
      detailHref: `${buildProgressDetailHref(fact.id)}${buildProgressListQueryString(listState)}`,
      recorderLabel: resolveMemberLabel(fact.recordedByMemberId, recorderLabels),
    }),
  );
}

export function ProgressListPresentation({
  facts,
  timeZone,
  listState,
  recorderLabels,
  emptyTitle,
  emptyDescription,
  clearFiltersHref,
}: ProgressListPresentationProps) {
  const rows = mapProgressFactsToPresentationRows(
    facts,
    timeZone,
    listState,
    recorderLabels,
  );

  if (rows.length === 0) {
    return (
      <section className={styles.emptyWrap} aria-labelledby="progress-list-empty-title">
        <h2 id="progress-list-empty-title" className={styles.visuallyHidden}>
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
              <th scope="col">Title</th>
              <th scope="col">Type</th>
              <th scope="col">Customer</th>
              <th scope="col">Program</th>
              <th scope="col">Occurred</th>
              <th scope="col">Recorded by</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <a className={styles.titleLink} href={row.detailHref}>
                    <span className={styles.titleCell}>{row.titleLabel}</span>
                  </a>
                  {row.isVoided ? (
                    <span className={styles.voidedInline}>
                      <Badge variant="danger">Voided</Badge>
                    </span>
                  ) : null}
                </td>
                <td>{row.factTypeLabel}</td>
                <td>{row.customerLabel}</td>
                <td>{row.programLabel}</td>
                <td>{row.occurredAtLabel}</td>
                <td>{row.recorderLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardList}>
        {rows.map((row) => (
          <li key={row.id} className={styles.card}>
            <h3 className={styles.cardTitle}>
              <a href={row.detailHref}>{row.titleLabel}</a>
            </h3>
            <div className={styles.cardBadges}>
              <Badge variant="neutral">{row.factTypeLabel}</Badge>
              {row.isVoided ? <Badge variant="danger">Voided</Badge> : null}
            </div>
            <dl className={styles.cardMeta}>
              <div>
                <dt>Customer</dt>
                <dd>{row.customerLabel}</dd>
              </div>
              <div>
                <dt>Program</dt>
                <dd>{row.programLabel}</dd>
              </div>
              <div>
                <dt>Occurred</dt>
                <dd>{row.occurredAtLabel}</dd>
              </div>
              <div>
                <dt>Recorded by</dt>
                <dd>{row.recorderLabel}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
