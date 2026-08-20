import type { EnrollmentListItemReadModel } from "@/features/enrollments/domain/read-types";
import type { EnrollmentListOperationalHints } from "@/features/enrollments/domain/operational-metadata";
import { Badge } from "@/components/ui/badge";
import { buildEnrollmentDetailHref } from "@/features/enrollments/ui/enrollment-navigation";
import type { EnrollmentListUrlState } from "@/features/enrollments/ui/enrollment-list-search-params";
import { resolveMemberLabel } from "@/features/enrollments/server/resolve-enrollment-labels";
import {
  formatEnrollmentDate,
  toEnrollmentListPresentationRow,
  type EnrollmentListPresentationRow,
} from "@/features/enrollments/ui/enrollment-presentation";
import type { AttentionSeverity } from "@/features/attention/domain/types";
import styles from "./enrollment-list.module.css";

export type EnrollmentListPresentationProps = {
  enrollments: EnrollmentListItemReadModel[];
  timeZone: string;
  listState: EnrollmentListUrlState;
  ownerLabels: Record<string, string>;
  operationalHints: EnrollmentListOperationalHints;
  emptyTitle: string;
  emptyDescription: string;
  clearFiltersHref?: string;
  createHref?: string;
};

type EnrollmentListOperationalRow = EnrollmentListPresentationRow & {
  progressHealthLabel: string;
  progressHealth: string;
  lastProgressLabel: string;
  attentionLabel: string;
  attentionSeverity: AttentionSeverity | null;
  isStale: boolean;
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
  health: string,
): "neutral" | "success" | "warning" | "info" {
  if (health === "no_recent_progress") return "warning";
  if (health === "healthy") return "success";
  if (health === "no_progress_yet") return "info";
  return "neutral";
}

function badgeVariantForSeverity(
  severity: AttentionSeverity | null,
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

export function mapEnrollmentsToOperationalRows(
  enrollments: EnrollmentListItemReadModel[],
  timeZone: string,
  listState: EnrollmentListUrlState,
  ownerLabels: Record<string, string>,
  operationalHints: EnrollmentListOperationalHints,
): EnrollmentListOperationalRow[] {
  return enrollments.map((enrollment) => {
    const base = toEnrollmentListPresentationRow(enrollment, {
      timeZone,
      detailHref: buildEnrollmentDetailHref(enrollment.id, listState),
      ownerLabel: resolveMemberLabel(enrollment.ownerMemberId, ownerLabels),
    });
    const hint = operationalHints.byEnrollmentId[enrollment.id];
    const lastProgressLabel = hint?.latestProgressOccurredAt
      ? formatEnrollmentDate(hint.latestProgressOccurredAt, timeZone)
      : "No progress yet";
    const openCount = hint?.openAttentionCount ?? 0;
    return {
      ...base,
      progressHealthLabel: hint?.healthLabel ?? "Progress",
      progressHealth: hint?.health ?? "not_applicable",
      lastProgressLabel,
      attentionLabel:
        openCount === 0
          ? "None open"
          : `${openCount} open${hint?.highestOpenAttentionSeverity ? ` · ${hint.highestOpenAttentionSeverity}` : ""}`,
      attentionSeverity: hint?.highestOpenAttentionSeverity ?? null,
      isStale: hint?.health === "no_recent_progress",
    };
  });
}

/** @deprecated Prefer mapEnrollmentsToOperationalRows for B1-C4 list. */
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
  operationalHints,
  emptyTitle,
  emptyDescription,
  clearFiltersHref,
  createHref,
}: EnrollmentListPresentationProps) {
  const rows = mapEnrollmentsToOperationalRows(
    enrollments,
    timeZone,
    listState,
    ownerLabels,
    operationalHints,
  );

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
              <th scope="col">Progress</th>
              <th scope="col">Last progress</th>
              <th scope="col">Attention</th>
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
                  <Badge variant={badgeVariantForStatus(row.statusLabel)}>
                    {row.statusLabel}
                  </Badge>
                </td>
                <td>
                  <Badge variant={badgeVariantForHealth(row.progressHealth)}>
                    {row.progressHealthLabel}
                  </Badge>
                </td>
                <td>{row.lastProgressLabel}</td>
                <td>
                  <Badge variant={badgeVariantForSeverity(row.attentionSeverity)}>
                    {row.attentionLabel}
                  </Badge>
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
              <Badge variant={badgeVariantForStatus(row.statusLabel)}>
                {row.statusLabel}
              </Badge>
              <Badge variant={badgeVariantForHealth(row.progressHealth)}>
                {row.progressHealthLabel}
              </Badge>
              {row.archivedLabel ? <Badge variant="info">{row.archivedLabel}</Badge> : null}
            </div>
            <dl className={styles.cardMeta}>
              <div>
                <dt>Program</dt>
                <dd>{row.programLabel}</dd>
              </div>
              <div>
                <dt>Last progress</dt>
                <dd>{row.lastProgressLabel}</dd>
              </div>
              <div>
                <dt>Attention</dt>
                <dd>{row.attentionLabel}</dd>
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
