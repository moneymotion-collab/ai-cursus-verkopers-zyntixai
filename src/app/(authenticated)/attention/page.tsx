import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { AttentionListFilters } from "@/features/attention/ui/attention-list-filters";
import { AttentionListPresentation } from "@/features/attention/ui/attention-list";
import { loadAttentionListPage } from "@/features/attention/ui/load-attention-list-page";
import {
  buildAttentionListHref,
  buildAttentionListPageHref,
  buildAttentionListResetHref,
  hasAttentionListActiveFilters,
  hasAttentionRelationshipContext,
} from "@/features/attention/ui/attention-list-search-params";
import {
  AttentionAuthRequiredPanel,
  AttentionOrganizationRequiredPanel,
  AttentionOrganizationUnavailablePanel,
  AttentionQueryErrorPanel,
} from "@/features/attention/ui/attention-state-panels";
import styles from "./page.module.css";

type AttentionPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * B1.7.5-C Attention list workspace with filters, sorting, pagination, and URL state.
 * Detail (D) and nav activation (E) remain deferred.
 */
export default async function AttentionPage({ searchParams }: AttentionPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadAttentionListPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="attention">
        <AttentionAuthRequiredPanel />
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="attention">
        <AttentionOrganizationUnavailablePanel />
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="attention" organizationOptions={result.organizations}>
        <AttentionOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={ATTENTION_ROUTE}
          description="Select an organization to view Attention."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="attention">
        <AttentionOrganizationUnavailablePanel message={result.message} />
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    return (
      <AppShell activeNav="attention">
        <AttentionQueryErrorPanel
          title={result.title}
          message={result.message}
          retryHref={ATTENTION_ROUTE}
        />
      </AppShell>
    );
  }

  const { pagination } = result.list;
  const hasFilters = hasAttentionListActiveFilters(result.urlState);
  const outOfRangePage =
    result.rows.length === 0 &&
    pagination.total > 0 &&
    pagination.page > Math.max(pagination.totalPages, 1);
  const resetHref = buildAttentionListResetHref(result.urlState);
  const firstPageHref = buildAttentionListPageHref(result.urlState, 1);
  const previousHref = pagination.hasPreviousPage
    ? buildAttentionListPageHref(result.urlState, pagination.page - 1)
    : undefined;
  const nextHref = pagination.hasNextPage
    ? buildAttentionListPageHref(result.urlState, pagination.page + 1)
    : undefined;

  const countLabel =
    pagination.total === 0
      ? "No attention items in this view."
      : `Showing ${result.rows.length} of ${pagination.total} attention items.`;

  return (
    <AppShell
      activeNav="attention"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={ATTENTION_ROUTE}
    >
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <h1>Attention</h1>
          <p className={styles.subtitle}>
            Read-only attention items for {result.organizationName}. Times shown in{" "}
            {result.timeZone}.
          </p>
          <p className={styles.summary}>{countLabel}</p>
        </header>

        {result.filterWarning ? (
          <Alert title="Filters adjusted" variant="warning">
            {result.filterWarning}
          </Alert>
        ) : null}

        {hasAttentionRelationshipContext(result.urlState) ? (
          <p className={styles.contextBanner} role="status">
            Showing attention items for a related enrollment, customer, or program
            context.{" "}
            <a
              href={buildAttentionListHref({
                ...result.urlState,
                enrollmentId: undefined,
                customerId: undefined,
                programId: undefined,
                page: 1,
              })}
            >
              Clear context
            </a>
          </p>
        ) : null}

        <AttentionListFilters urlState={result.urlState} role={result.role} />

        <AttentionListPresentation
          rows={result.rows}
          organizationName={result.organizationName}
          hasActiveFilters={hasFilters}
          outOfRangePage={outOfRangePage}
          clearHref={outOfRangePage ? firstPageHref : resetHref}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          previousHref={previousHref}
          nextHref={nextHref}
          ariaLabel="Attention list pagination"
        />
      </section>
    </AppShell>
  );
}
