import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { CustomerOrganizationRequiredPanel } from "@/features/customers/ui/customer-organization-required-panel";
import { CustomerListFilters } from "@/features/customers/ui/customer-list-filters";
import { CustomerListPresentation } from "@/features/customers/ui/customer-list";
import {
  customersPageRetryHref,
  loadCustomersPage,
} from "@/features/customers/ui/load-customers-page";
import {
  buildCustomerListQueryString,
  type CustomerListUrlState,
} from "@/features/customers/ui/customer-list-search-params";
import { buildCustomerCreateHref } from "@/features/customers/ui/customer-navigation";
import { canShowCreateWorkflow } from "@/features/customers/ui/customer-workflow-visibility";
import type { ProductTerminology } from "@/features/product-access/domain/terminology";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type CustomersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(urlState: CustomerListUrlState): boolean {
  return Boolean(
    urlState.q || urlState.status || urlState.owner || urlState.archived,
  );
}

function buildPageHref(urlState: CustomerListUrlState, page: number): string {
  return `/customers${buildCustomerListQueryString({ ...urlState, page })}`;
}

function resolveEmptyState(
  urlState: CustomerListUrlState,
  terminology: ProductTerminology,
): {
  title: string;
  description: string;
  clearHref?: string;
} {
  const pluralLower = terminology.customer.plural.toLowerCase();

  if (urlState.archived) {
    return {
      title: `No archived ${pluralLower} are available.`,
      description: `Archived ${pluralLower} will appear here when they exist for your organization.`,
      clearHref: hasActiveFilters(urlState)
        ? `/customers${buildCustomerListQueryString({
            org: urlState.org,
            archived: false,
            sort: urlState.sort,
            direction: urlState.direction,
            page: 1,
            pageSize: urlState.pageSize,
          })}`
        : undefined,
    };
  }

  if (hasActiveFilters(urlState)) {
    return {
      title: `No ${pluralLower} match the selected filters.`,
      description: `Try adjusting or clearing your filters to see more ${pluralLower}.`,
      clearHref: `/customers${buildCustomerListQueryString({
        org: urlState.org,
        archived: false,
        sort: urlState.sort,
        direction: urlState.direction,
        page: 1,
        pageSize: urlState.pageSize,
      })}`,
    };
  }

  return {
    title: `No ${pluralLower} are available.`,
    description: `${terminology.customer.plural} in your organization will appear here.`,
  };
}

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadCustomersPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view customers for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="customers" organizationOptions={result.organizations}>
        <CustomerOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/customers"
          description="Select an organization to view customers."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="org-context-title">
          <h1 id="org-context-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    const retryHref = customersPageRetryHref({
      org: rawSearchParams.org
        ? Array.isArray(rawSearchParams.org)
          ? rawSearchParams.org[0]
          : rawSearchParams.org
        : undefined,
      archived: false,
      sort: "display_name",
      direction: "asc",
      page: 1,
      pageSize: 25,
    });

    return (
      <AppShell activeNav="customers">
        <section className={styles.page}>
          <h1>Customers</h1>
          <Alert title="Unable to load customers" variant="error">
            {result.message}
          </Alert>
          {result.retryable ? (
            <p>
              <a href={retryHref}>Retry loading customers</a>
            </p>
          ) : null}
        </section>
      </AppShell>
    );
  }

  const terminology = result.moduleAccess.terminology;
  const emptyState = resolveEmptyState(result.urlState, terminology);
  const { pagination } = result.list;
  const previousHref =
    pagination.hasPreviousPage ? buildPageHref(result.urlState, pagination.page - 1) : undefined;
  const nextHref =
    pagination.hasNextPage ? buildPageHref(result.urlState, pagination.page + 1) : undefined;

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      activeNav="customers"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction="/customers"
    >
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderRow}>
            <h1>{terminology.customer.plural}</h1>
            {canShowCreateWorkflow(result.role) ? (
              <a className={styles.newCustomerLink} href={buildCustomerCreateHref(result.urlState)}>
                New {terminology.customer.singular.toLowerCase()}
              </a>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            {terminology.customer.singular} list for {result.organizationName}. Times shown in{" "}
            {result.timeZone}.
          </p>
          <p className={styles.summary}>
            Showing {result.list.items.length} of {pagination.total}{" "}
            {terminology.customer.plural.toLowerCase()}
          </p>
        </header>

        {result.filterWarning ? (
          <Alert title="Filters adjusted" variant="warning">
            {result.filterWarning}
          </Alert>
        ) : null}

        <CustomerListFilters
          urlState={result.urlState}
          role={result.role}
          ownerOptions={result.ownerOptions}
          terminology={terminology}
        />

        <CustomerListPresentation
          customers={result.list.items}
          timeZone={result.timeZone}
          listState={result.urlState}
          terminology={terminology}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          clearFiltersHref={emptyState.clearHref}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          previousHref={previousHref}
          nextHref={nextHref}
          ariaLabel={`${terminology.customer.singular} list pagination`}
        />
      </section>
    </AppShell>
  );
}
