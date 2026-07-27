import { getEnrollmentStatusLabel } from "@/features/enrollments/domain/status";
import {
  buildEnrollmentListQueryString,
  canViewArchivedEnrollmentFilter,
  ENROLLMENT_LIST_STATUS_OPTIONS,
  type EnrollmentListUrlState,
} from "@/features/enrollments/ui/enrollment-list-search-params";
import type { EnrollmentRole } from "@/features/enrollments/domain/types";
import styles from "./enrollment-list-filters.module.css";

type EnrollmentListFiltersProps = {
  urlState: EnrollmentListUrlState;
  role: EnrollmentRole;
};

export function EnrollmentListFilters({ urlState, role }: EnrollmentListFiltersProps) {
  const clearHref = `/enrollments${buildEnrollmentListQueryString({
    org: urlState.org,
    archived: false,
    sort: "enrolled_at",
    direction: "desc",
    page: 1,
    pageSize: urlState.pageSize,
  })}`;

  return (
    <section className={styles.filters} aria-labelledby="enrollment-filters-heading">
      <h2 id="enrollment-filters-heading" className={styles.heading}>
        Filters
      </h2>
      <form className={styles.form} method="get" action="/enrollments">
        {urlState.org ? <input type="hidden" name="org" value={urlState.org} /> : null}
        {urlState.customerId ? (
          <input type="hidden" name="customerId" value={urlState.customerId} />
        ) : null}
        {urlState.programId ? (
          <input type="hidden" name="programId" value={urlState.programId} />
        ) : null}
        <input type="hidden" name="page" value="1" />

        <div className={styles.field}>
          <label htmlFor="filter-enrollment-status">Status</label>
          <select
            id="filter-enrollment-status"
            name="status"
            defaultValue={urlState.status ?? "all"}
          >
            <option value="all">All statuses</option>
            {ENROLLMENT_LIST_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getEnrollmentStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-enrollment-sort">Sort by</label>
          <select id="filter-enrollment-sort" name="sort" defaultValue={urlState.sort}>
            <option value="enrolled_at">Enrolled date</option>
            <option value="updated_at">Updated date</option>
            <option value="status">Status</option>
            <option value="created_at">Created date</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-enrollment-direction">Sort direction</label>
          <select
            id="filter-enrollment-direction"
            name="direction"
            defaultValue={urlState.direction}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className={styles.fieldWide}>
          <label htmlFor="filter-enrollment-search">Search</label>
          <input
            id="filter-enrollment-search"
            name="q"
            type="search"
            defaultValue={urlState.q ?? ""}
            maxLength={200}
            placeholder="Search by customer or program name"
          />
        </div>

        {canViewArchivedEnrollmentFilter(role) ? (
          <div className={styles.checkboxField}>
            <input
              id="filter-enrollment-archived"
              name="archived"
              type="checkbox"
              value="true"
              defaultChecked={urlState.archived}
            />
            <label htmlFor="filter-enrollment-archived">Show archived enrollments</label>
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
