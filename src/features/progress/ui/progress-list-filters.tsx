import { getProgressFactTypeLabel } from "@/features/progress/domain/fact-types";
import {
  buildProgressListQueryString,
  canViewVoidedProgressFilter,
  PROGRESS_LIST_FACT_TYPE_OPTIONS,
  type ProgressListUrlState,
} from "@/features/progress/ui/progress-list-search-params";
import type { ProgressRole } from "@/features/progress/domain/types";
import styles from "./progress-list-filters.module.css";

type ProgressListFiltersProps = {
  urlState: ProgressListUrlState;
  role: ProgressRole;
};

export function ProgressListFilters({ urlState, role }: ProgressListFiltersProps) {
  const clearHref = `/progress${buildProgressListQueryString({
    org: urlState.org,
    includeVoided: false,
    sort: "occurred_at",
    direction: "desc",
    page: 1,
    pageSize: urlState.pageSize,
  })}`;

  return (
    <section className={styles.filters} aria-labelledby="progress-filters-heading">
      <h2 id="progress-filters-heading" className={styles.heading}>
        Filters
      </h2>
      <form className={styles.form} method="get" action="/progress">
        {urlState.org ? <input type="hidden" name="org" value={urlState.org} /> : null}
        {urlState.enrollmentId ? (
          <input type="hidden" name="enrollmentId" value={urlState.enrollmentId} />
        ) : null}
        {urlState.customerId ? (
          <input type="hidden" name="customerId" value={urlState.customerId} />
        ) : null}
        {urlState.programId ? (
          <input type="hidden" name="programId" value={urlState.programId} />
        ) : null}
        <input type="hidden" name="page" value="1" />

        <div className={styles.field}>
          <label htmlFor="filter-progress-fact-type">Fact type</label>
          <select
            id="filter-progress-fact-type"
            name="factType"
            defaultValue={urlState.factType ?? "all"}
          >
            <option value="all">All fact types</option>
            {PROGRESS_LIST_FACT_TYPE_OPTIONS.map((factType) => (
              <option key={factType} value={factType}>
                {getProgressFactTypeLabel(factType)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-progress-sort">Sort by</label>
          <select id="filter-progress-sort" name="sort" defaultValue={urlState.sort}>
            <option value="occurred_at">Occurred date</option>
            <option value="recorded_at">Recorded date</option>
            <option value="fact_type">Fact type</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-progress-direction">Sort direction</label>
          <select
            id="filter-progress-direction"
            name="direction"
            defaultValue={urlState.direction}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className={styles.fieldWide}>
          <label htmlFor="filter-progress-search">Search</label>
          <input
            id="filter-progress-search"
            name="q"
            type="search"
            defaultValue={urlState.q ?? ""}
            maxLength={200}
            placeholder="Search by title"
          />
        </div>

        {canViewVoidedProgressFilter(role) ? (
          <div className={styles.checkboxField}>
            <input
              id="filter-progress-include-voided"
              name="includeVoided"
              type="checkbox"
              value="true"
              defaultChecked={urlState.includeVoided}
            />
            <label htmlFor="filter-progress-include-voided">Show voided progress</label>
          </div>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.applyButton}>
            Apply filters
          </button>
          <a className={styles.clearLink} href={clearHref}>
            Clear filters
          </a>
        </div>
      </form>
    </section>
  );
}
