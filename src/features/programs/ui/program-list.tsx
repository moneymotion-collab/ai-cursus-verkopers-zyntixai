import type { ProgramListItemReadModel } from "@/features/programs/domain/read-types";
import { Badge } from "@/components/ui/badge";
import { buildProgramDetailHref } from "@/features/programs/ui/program-navigation";
import type { ProgramListUrlState } from "@/features/programs/ui/program-list-search-params";
import {
  toProgramListPresentationRow,
  type ProgramListPresentationRow,
} from "@/features/programs/ui/program-presentation";
import styles from "./program-list.module.css";

export type ProgramListPresentationProps = {
  programs: ProgramListItemReadModel[];
  timeZone: string;
  listState: ProgramListUrlState;
  emptyTitle: string;
  emptyDescription: string;
  clearFiltersHref?: string;
  createHref?: string;
};

function badgeVariantForStatus(
  label: string,
): "neutral" | "success" | "warning" | "danger" | "info" {
  if (label === "Active") return "success";
  if (label === "Retired") return "danger";
  if (label === "Paused") return "warning";
  return "neutral";
}

export function mapProgramsToPresentationRows(
  programs: ProgramListItemReadModel[],
  timeZone: string,
  listState: ProgramListUrlState,
): ProgramListPresentationRow[] {
  return programs.map((program) =>
    toProgramListPresentationRow(program, {
      timeZone,
      detailHref: buildProgramDetailHref(program.id, listState),
    }),
  );
}

export function ProgramListPresentation({
  programs,
  timeZone,
  listState,
  emptyTitle,
  emptyDescription,
  clearFiltersHref,
  createHref,
}: ProgramListPresentationProps) {
  const rows = mapProgramsToPresentationRows(programs, timeZone, listState);

  if (rows.length === 0) {
    return (
      <section className={styles.emptyWrap} aria-labelledby="program-list-empty-title">
        <h2 id="program-list-empty-title" className={styles.visuallyHidden}>
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
            Create program
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
              <th scope="col">Program</th>
              <th scope="col">Status</th>
              <th scope="col">Delivery mode</th>
              <th scope="col">Open enrollments</th>
              <th scope="col">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <a className={styles.titleLink} href={row.detailHref}>
                    <span className={styles.titleCell}>{row.name}</span>
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
                <td>{row.deliveryModeLabel}</td>
                <td>{row.openEnrollmentCountLabel}</td>
                <td>{row.updatedAtLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className={styles.cardList} aria-label="Program list">
        {rows.map((row) => (
          <li key={row.id} className={styles.card}>
            <h3 className={styles.cardTitle}>
              <a href={row.detailHref}>{row.name}</a>
            </h3>
            <div className={styles.cardBadges}>
              <Badge variant={badgeVariantForStatus(row.statusLabel)}>{row.statusLabel}</Badge>
              {row.archivedLabel ? <Badge variant="info">{row.archivedLabel}</Badge> : null}
            </div>
            <dl className={styles.cardMeta}>
              <div>
                <dt>Delivery mode</dt>
                <dd>{row.deliveryModeLabel}</dd>
              </div>
              <div>
                <dt>Open enrollments</dt>
                <dd>{row.openEnrollmentCountLabel}</dd>
              </div>
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
