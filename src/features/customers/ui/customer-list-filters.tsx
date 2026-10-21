import { CUSTOMER_STATUSES } from "@/features/customers/domain/status";
import { getCustomerStatusLabel } from "@/features/customers/domain/status";
import {
  buildCustomerListQueryString,
  canViewArchivedCustomerFilter,
  CUSTOMER_OWNER_UNASSIGNED_VALUE,
  type CustomerListUrlState,
} from "@/features/customers/ui/customer-list-search-params";
import type { CustomerMemberOption } from "@/features/customers/server/load-customer-member-filter-options";
import type { CustomerRole } from "@/features/customers/domain/types";
import {
  DEFAULT_PRODUCT_TERMINOLOGY,
  type ProductTerminology,
} from "@/features/product-access/domain/terminology";
import styles from "./customer-list-filters.module.css";

type CustomerListFiltersProps = {
  urlState: CustomerListUrlState;
  role: CustomerRole;
  ownerOptions?: CustomerMemberOption[];
  terminology?: ProductTerminology;
};

export function CustomerListFilters({
  urlState,
  role,
  ownerOptions = [],
  terminology = DEFAULT_PRODUCT_TERMINOLOGY,
}: CustomerListFiltersProps) {
  const singular = terminology.customer.singular;
  const singularLower = singular.toLowerCase();
  const pluralLower = terminology.customer.plural.toLowerCase();
  const clearHref = `/customers${buildCustomerListQueryString({
    org: urlState.org,
    archived: false,
    sort: "display_name",
    direction: "asc",
    page: 1,
    pageSize: urlState.pageSize,
  })}`;

  return (
    <section className={styles.filters} aria-labelledby="customer-filters-heading">
      <h2 id="customer-filters-heading" className={styles.heading}>
        Filters
      </h2>
      <form className={styles.form} method="get" action="/customers">
        {urlState.org ? <input type="hidden" name="org" value={urlState.org} /> : null}
        <input type="hidden" name="page" value="1" />

        <div className={styles.field}>
          <label htmlFor="filter-customer-status">{singular} status</label>
          <select id="filter-customer-status" name="status" defaultValue={urlState.status ?? "all"}>
            <option value="all">All statuses</option>
            {CUSTOMER_STATUSES.map((status) => (
              <option key={status} value={status}>
                {getCustomerStatusLabel(status)}
              </option>
            ))}
          </select>
        </div>

        {ownerOptions.length > 0 ? (
          <div className={styles.field}>
            <label htmlFor="filter-customer-owner">Assigned to</label>
            <select id="filter-customer-owner" name="owner" defaultValue={urlState.owner ?? ""}>
              <option value="">Anyone</option>
              <option value={CUSTOMER_OWNER_UNASSIGNED_VALUE}>Unassigned</option>
              {ownerOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className={styles.field}>
          <label htmlFor="filter-customer-sort">Sort by</label>
          <select id="filter-customer-sort" name="sort" defaultValue={urlState.sort ?? "display_name"}>
            <option value="display_name">{singular} name</option>
            <option value="updated_at">Updated date</option>
            <option value="status">Status</option>
            <option value="started_at">{singular} since</option>
          </select>
        </div>

        <div className={styles.field}>
          <label htmlFor="filter-customer-direction">Sort direction</label>
          <select
            id="filter-customer-direction"
            name="direction"
            defaultValue={urlState.direction ?? "asc"}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <div className={styles.fieldWide}>
          <label htmlFor="filter-customer-search">Search</label>
          <input
            id="filter-customer-search"
            name="q"
            type="search"
            defaultValue={urlState.q ?? ""}
            maxLength={200}
            placeholder={`Search by ${singularLower} name or email`}
          />
        </div>

        {canViewArchivedCustomerFilter(role) ? (
          <div className={styles.checkboxField}>
            <input
              id="filter-customer-archived"
              name="archived"
              type="checkbox"
              value="true"
              defaultChecked={urlState.archived}
            />
            <label htmlFor="filter-customer-archived">Show archived {pluralLower}</label>
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
