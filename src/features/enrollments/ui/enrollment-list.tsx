import type { EnrollmentListItemReadModel } from "@/features/enrollments/domain/read-types";
import { Badge } from "@/components/ui/badge";
import { buildEnrollmentDetailHref } from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import {
  resolveMemberLabel,
} from "@/features/enrollments/server/resolve-enrollment-labels";
import {
  toEnrollmentListPresentationRow,
  type EnrollmentListPresentationRow,
} from "@/features/enrollments/ui/enrollment-presentation";
import styles from "./enrollment-list.module.css";

export type EnrollmentListPresentationProps = {
  enrollments: EnrollmentListItemReadModel[];
  timeZone: string;
  listState: EnrollmentListUrlState;
  ownerLabels: Record<string, string>;
  emptyTitle: string;
  emptyDescription: string;
  clearFiltersHref?: string;
  createHref?: string;
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

export function mapEnrollmentsToPresentationRows(
  enrollments: EnrollmentListItemReadModel[],
  timeZone: string,
  listState: EnrollmentListUrlState,
  ownerLabels: Record<string, string>,
): EnrollmentListPresentationRow[] {
  return enrollments.map((enrollment) =>
    toEnrollmentListPresentationRow(enrollment, {
      timeZone,
      detailHref: buildEnrollmentDetailHref(enrollment.id, listState),
      ownerLabel: resolveMemberLabel(enrollment.ownerMemberId, ownerLabels),
    }),
  );
}

export function EnrollmentListPresentation({
  enrollments,
  timeZone,
  listState,
  ownerLabels,
  emptyTitle,
  emptyDescription,
  clearFiltersHref,
  createHref,
}: EnrollmentListPresentationProps) {
  const rows = mapEnrollmentsToPresentationRows(enrollments, timeZone, listState, ownerLabels);

  if (rows.length === 0) {
    return (
      <section className={styles.emptyWrap} aria-labelledby="enrollment-list-empty-title">
        <h2 id="enrollment-list-empty-title" className={styles.visuallyHidden}>
          {emptyTitle}
        </h2>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        <p className={styles.emptyDescription}>{emptyDescription}</p>
        {clearFiltersHref ? (
          <a className={styles.clearLink} href={clearFiltersHref}>
            Clear filters
          </a>
        ) : null}
        {createHref && !clearFiltersHref ? (
          <a className={styles.createLink} href={createHref}>
            Create enrollment
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
              <th scope="col">Program</th>
              <th scope="col">Status</th>
              <th scope="col">Owner</th>
              <th scope="col">Enrolled</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <a className={styles.titleLink} href={row.detailHref}>
                    <span className={styles.titleCell}>{row.customerLabel}</span>
                  </a>
                  {row.archivedLabel ? (
                    <span className={styles.archivedInline}>
                      <Badge variant="info">{row.archivedLabel}</Badge>
                    </span>
                  ) : null}
                </td>
                <td>{row.programLabel}</td>
                <td>
                  <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
                </td>
                <td>{row.ownerLabel}</td>
                <td>{row.enrolledAtLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardList} aria-label="Enrollment list">
        {rows.map((row) => (
          <li key={row.id} className={styles.card}>
            <h3 className={styles.cardTitle}>
              <a href={row.detailHref}>{row.customerLabel}</a>
            </h3>
            <div className={styles.cardBadges}>
              <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
              {row.archivedLabel ? <Badge variant="info">{row.archivedLabel}</Badge> : null}
            </div>
            <dl className={styles.cardMeta}>
              <div>
                <dt>Program</dt>
                <dd>{row.programLabel}</dd>
              </div>
              <div>
                <dt>Owner</dt>
                <dd>{row.ownerLabel}</dd>
              </div>
              <div>
                <dt>Enrolled</dt>
                <dd>{row.enrolledAtLabel}</dd>
              </div>
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
