import { LEAD_STATUSES } from "@/features/leads/domain/status";
import { getLeadStatusLabel } from "@/features/leads/domain/status";
import type { LeadPipelineStageOption } from "@/features/leads/domain/pipeline-stage";
import {
  buildLeadListQueryString,
  canViewArchivedLeadFilter,
  LEAD_OWNER_UNASSIGNED_VALUE,
  type LeadListUrlState,
} from "@/features/leads/ui/lead-list-search-params";
import type { CustomerMemberOption } from "@/features/customers/server/load-customer-member-filter-options";
import type { LeadRole } from "@/features/leads/domain/types";
import styles from "./lead-list-filters.module.css";

type LeadListFiltersProps = {
  urlState: LeadListUrlState;
  role: LeadRole;
  ownerOptions?: CustomerMemberOption[];
  stageOptions?: LeadPipelineStageOption[];
};

export function LeadListFilters({
  urlState,
  role,
  ownerOptions = [],
  stageOptions = [],
}: LeadListFiltersProps) {
  const clearHref = `/leads${buildLeadListQueryString({
    org: urlState.org,
    archived: false,
    sort: "display_name",
    direction: "asc",
    page: 1,
    pageSize: urlState.pageSize,
  })}`;

  return (
    <section className={styles.filters} aria-labelledby="lead-filters-heading">
      <h2 id="lead-filters-heading" className={styles.heading}>
        Filters
      </h2>
      <form className={styles.form} method="get" action="/leads">
        {urlState.org ? <input type="hidden" name="org" value={urlState.org} /> : null}
        <input type="hidden" name="page" value="1" />

        <div className={styles.field}>
          <label htmlFor="filter-lead-status">Status</label>
          <select id="filter-lead-status" name="status" defaultValue={urlState.status ?? "all"}>
            <option value="all">All statuses</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getLeadStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {stageOptions.length > 0 ? (
          <div className={styles.field}>
            <label htmlFor="filter-lead-stage">Pipeline stage</label>
            <select id="filter-lead-stage" name="stage" defaultValue={urlState.stageId ?? ""}>
              <option value="">All stages</option>
              {stageOptions.map((option) => (
                <option key={option.stageId} value={option.stageId}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {ownerOptions.length > 0 ? (
          <div className={styles.field}>
            <label htmlFor="filter-lead-owner">Owner</label>
            <select id="filter-lead-owner" name="owner" defaultValue={urlState.owner ?? ""}>
              <option value="">Any owner</option>
              <option value={LEAD_OWNER_UNASSIGNED_VALUE}>Unassigned</option>
              {ownerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className={styles.field}>
          <label htmlFor="filter-lead-sort">Sort by</label>
          <select id="filter-lead-sort" name="sort" defaultValue={urlState.sort ?? "display_name"}>
            <option value="display_name">Display name</option>
            <option value="updated_at">Updated date</option>
            <option value="status">Status</option>
            <option value="created_at">Created date</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-lead-direction">Sort direction</label>
          <select
            id="filter-lead-direction"
            name="direction"
            defaultValue={urlState.direction ?? "asc"}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className={styles.fieldWide}>
          <label htmlFor="filter-lead-search">Search</label>
          <input
            id="filter-lead-search"
            name="q"
            type="search"
            defaultValue={urlState.q ?? ""}
            maxLength={200}
            placeholder="Search by display name or email"
          />
        </div>

        {canViewArchivedLeadFilter(role) ? (
          <div className={styles.checkboxField}>
            <input
              id="filter-lead-archived"
              name="archived"
              type="checkbox"
              value="true"
              defaultChecked={urlState.archived}
            />
            <label htmlFor="filter-lead-archived">Show archived leads</label>
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
