import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { LeadOrganizationRequiredPanel } from "@/features/leads/ui/lead-organization-required-panel";
import { LeadListFilters } from "@/features/leads/ui/lead-list-filters";
import { LeadListPresentation } from "@/features/leads/ui/lead-list";
import { leadsPageRetryHref, loadLeadsPage } from "@/features/leads/ui/load-leads-page";
import {
  buildLeadListQueryString,
  type LeadListUrlState,
} from "@/features/leads/ui/lead-list-search-params";
import { buildLeadCreateHref } from "@/features/leads/ui/lead-navigation";
import { canShowCreateLeadWorkflow } from "@/features/leads/ui/lead-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type LeadsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(urlState: LeadListUrlState): boolean {
  return Boolean(
    urlState.q || urlState.status || urlState.stageId || urlState.owner || urlState.archived,
  );
}

function buildPageHref(urlState: LeadListUrlState, page: number): string {
  return `/leads${buildLeadListQueryString({ ...urlState, page })}`;
}

function resolveEmptyState(urlState: LeadListUrlState): {
  title: string;
  description: string;
  clearHref?: string;
} {
  if (urlState.archived) {
    return {
      title: "No archived leads are available.",
      description: "Archived leads will appear here when they exist for your organization.",
      clearHref: hasActiveFilters(urlState)
        ? `/leads${buildLeadListQueryString({
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
      title: "No leads match the selected filters.",
      description: "Try adjusting or clearing your filters to see more leads.",
      clearHref: `/leads${buildLeadListQueryString({
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
    title: "No leads are available.",
    description: "Leads in your organization will appear here.",
  };
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadLeadsPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view leads for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="leads" organizationOptions={result.organizations}>
        <LeadOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/leads"
          description="Select an organization to view leads."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="org-context-title">
          <h1 id="org-context-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    const retryHref = leadsPageRetryHref({
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
      <AppShell activeNav="leads">
        <section className={styles.page}>
          <h1>Leads</h1>
          <Alert title="Unable to load leads" variant="error">
            {result.message}
          </Alert>
          {result.retryable ? (
            <p>
              <a href={retryHref}>Retry loading leads</a>
            </p>
          ) : null}
        </section>
      </AppShell>
    );
  }

  const emptyState = resolveEmptyState(result.urlState);
  const { pagination } = result.list;
  const previousHref =
    pagination.hasPreviousPage ? buildPageHref(result.urlState, pagination.page - 1) : undefined;
  const nextHref =
    pagination.hasNextPage ? buildPageHref(result.urlState, pagination.page + 1) : undefined;

  return (
    <AppShell
      activeNav="leads"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction="/leads"
    >
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderRow}>
            <h1>Leads</h1>
            {canShowCreateLeadWorkflow(result.role) ? (
              <a className={styles.newLeadLink} href={buildLeadCreateHref(result.urlState)}>
                New lead
              </a>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Lead list for {result.organizationName}. Times shown in {result.timeZone}.
          </p>
          <p className={styles.summary}>
            Showing {result.list.items.length} of {pagination.total} leads
          </p>
        </header>

        {result.filterWarning ? (
          <Alert title="Filters adjusted" variant="warning">
            {result.filterWarning}
          </Alert>
        ) : null}

        <LeadListFilters
          urlState={result.urlState}
          role={result.role}
          ownerOptions={result.ownerOptions}
          stageOptions={result.stageOptions}
        />

        <LeadListPresentation
          leads={result.list.items}
          timeZone={result.timeZone}
          listState={result.urlState}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          clearFiltersHref={emptyState.clearHref}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          previousHref={previousHref}
          nextHref={nextHref}
          ariaLabel="Lead list pagination"
        />
      </section>
    </AppShell>
  );
}
