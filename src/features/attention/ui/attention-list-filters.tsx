import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import type { AttentionRole } from "@/features/attention/domain/types";
import {
  ATTENTION_LIST_SEVERITY_OPTIONS,
  ATTENTION_LIST_SORT_OPTIONS,
  ATTENTION_LIST_STATUS_OPTIONS,
  buildAttentionListResetHref,
  canViewArchivedAttentionFilter,
  hasAttentionListActiveFilters,
  hasAttentionListNonDefaultSort,
  type AttentionListUrlState,
} from "@/features/attention/ui/attention-list-search-params";
import styles from "./attention-list-filters.module.css";

type AttentionListFiltersProps = {
  urlState: AttentionListUrlState;
  role: AttentionRole;
};

export function AttentionListFilters({
  urlState,
  role,
}: AttentionListFiltersProps) {
  const showReset =
    hasAttentionListActiveFilters(urlState) ||
    hasAttentionListNonDefaultSort(urlState) ||
    urlState.page > 1;
  const resetHref = buildAttentionListResetHref(urlState);

  return (
    <section className={styles.filters} aria-labelledby="attention-filters-heading">
      <h2 id="attention-filters-heading" className={styles.heading}>
        Filters and sorting
      </h2>
      <form
        className={styles.form}
        method="get"
        action={ATTENTION_ROUTE}
        aria-labelledby="attention-filters-heading"
      >
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
          <label htmlFor="filter-attention-status">Status</label>
          <select
            id="filter-attention-status"
            name="status"
            defaultValue={urlState.status ?? "all"}
          >
            <option value="all">All statuses</option>
            {ATTENTION_LIST_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-attention-severity">Severity</label>
          <select
            id="filter-attention-severity"
            name="severity"
            defaultValue={urlState.severity ?? "all"}
          >
            <option value="all">All severities</option>
            {ATTENTION_LIST_SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-attention-assignee">Assignee</label>
          <select
            id="filter-attention-assignee"
            name="assignee"
            defaultValue={
              urlState.assignee === "unassigned"
                ? "unassigned"
                : urlState.assignee
                  ? urlState.assignee
                  : "all"
            }
          >
            <option value="all">All assignees</option>
            <option value="unassigned">Unassigned</option>
            {urlState.assignee &&
            urlState.assignee !== "unassigned" ? (
              <option value={urlState.assignee}>Selected assignee</option>
            ) : null}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-attention-acknowledged">Acknowledgement</label>
          <select
            id="filter-attention-acknowledged"
            name="acknowledged"
            defaultValue={
              urlState.acknowledged === undefined
                ? "all"
                : urlState.acknowledged
                  ? "true"
                  : "false"
            }
          >
            <option value="all">All acknowledgement states</option>
            <option value="true">Acknowledged</option>
            <option value="false">Not acknowledged</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-attention-sort">Sort by</label>
          <select
            id="filter-attention-sort"
            name="sort"
            defaultValue={urlState.sort}
          >
            {ATTENTION_LIST_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-attention-direction">Sort direction</label>
          <select
            id="filter-attention-direction"
            name="direction"
            defaultValue={urlState.direction}
          >
            <option value="desc">Newest / highest first</option>
            <option value="asc">Oldest / lowest first</option>
          </select>
        </div>

        {canViewArchivedAttentionFilter(role) ? (
          <div className={styles.checkboxField}>
            <input
              id="filter-attention-include-archived"
              name="includeArchived"
              type="checkbox"
              value="true"
              defaultChecked={urlState.includeArchived}
            />
            <label htmlFor="filter-attention-include-archived">
              Include archived items
            </label>
          </div>
        ) : null}

        <div className={styles.actions}>
          <button type="submit" className={styles.applyButton}>
            Apply filters
          </button>
          {showReset ? (
            <a className={styles.clearLink} href={resetHref}>
              Reset filters
            </a>
          ) : null}
        </div>
      </form>
    </section>
  );
}
