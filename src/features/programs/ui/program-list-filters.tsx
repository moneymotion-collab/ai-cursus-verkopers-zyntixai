import { getProgramStatusLabel } from "@/features/programs/domain/status";
import { getProgramDeliveryModeLabel } from "@/features/programs/domain/delivery-mode";
import {
  buildProgramListQueryString,
  canViewArchivedProgramFilter,
  PROGRAM_LIST_DELIVERY_OPTIONS,
  PROGRAM_LIST_STATUS_OPTIONS,
  type ProgramListUrlState,
} from "@/features/programs/ui/program-list-search-params";
import type { ProgramRole } from "@/features/programs/domain/types";
import styles from "./program-list-filters.module.css";

type ProgramListFiltersProps = {
  urlState: ProgramListUrlState;
  role: ProgramRole;
};

export function ProgramListFilters({ urlState, role }: ProgramListFiltersProps) {
  const clearHref = `/programs${buildProgramListQueryString({
    org: urlState.org,
    archived: false,
    sort: "updated_at",
    direction: "desc",
    page: 1,
    pageSize: urlState.pageSize,
  })}`;

  return (
    <section className={styles.filters} aria-labelledby="program-filters-heading">
      <h2 id="program-filters-heading" className={styles.heading}>
        Filters
      </h2>
      <form className={styles.form} method="get" action="/programs">
        {urlState.org ? <input type="hidden" name="org" value={urlState.org} /> : null}
        <input type="hidden" name="page" value="1" />

        <div className={styles.field}>
          <label htmlFor="filter-program-status">Status</label>
          <select id="filter-program-status" name="status" defaultValue={urlState.status ?? "all"}>
            <option value="all">All statuses</option>
            {PROGRAM_LIST_STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {getProgramStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-program-delivery">Delivery mode</label>
          <select
            id="filter-program-delivery"
            name="deliveryMode"
            defaultValue={urlState.deliveryMode ?? "all"}
          >
            <option value="all">All delivery modes</option>
            {PROGRAM_LIST_DELIVERY_OPTIONS.map((mode) => (
              <option key={mode} value={mode}>
                {getProgramDeliveryModeLabel(mode)}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-program-sort">Sort by</label>
          <select id="filter-program-sort" name="sort" defaultValue={urlState.sort}>
            <option value="updated_at">Updated date</option>
            <option value="name">Program name</option>
            <option value="status">Status</option>
            <option value="created_at">Created date</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-program-direction">Sort direction</label>
          <select
            id="filter-program-direction"
            name="direction"
            defaultValue={urlState.direction}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        <div className={styles.fieldWide}>
          <label htmlFor="filter-program-search">Search</label>
          <input
            id="filter-program-search"
            name="q"
            type="search"
            defaultValue={urlState.q ?? ""}
            maxLength={200}
            placeholder="Search by program name"
          />
        </div>

        {canViewArchivedProgramFilter(role) ? (
          <div className={styles.checkboxField}>
            <input
              id="filter-program-archived"
              name="archived"
              type="checkbox"
              value="true"
              defaultChecked={urlState.archived}
            />
            <label htmlFor="filter-program-archived">Show archived programs</label>
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
