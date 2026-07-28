import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { ProgressOrganizationRequiredPanel } from "@/features/progress/ui/progress-organization-required-panel";
import { ProgressListFilters } from "@/features/progress/ui/progress-list-filters";
import { ProgressListPresentation } from "@/features/progress/ui/progress-list";
import {
  loadProgressListPage,
  progressListPageRetryHref,
} from "@/features/progress/ui/load-progress-list-page";
import { resolveProgressListEmptyState } from "@/features/progress/ui/progress-list-empty-state";
import {
  buildClearProgressContextHref,
  buildProgressListQueryString,
  hasProgressRelationshipContext,
  type ProgressListUrlState,
} from "@/features/progress/ui/progress-list-search-params";
import { buildProgressCreateHref } from "@/features/progress/domain/progress-navigation";
import { canShowRecordProgressWorkflow } from "@/features/progress/ui/progress-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type ProgressPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function buildPageHref(urlState: ProgressListUrlState, page: number): string {
  return `/progress${buildProgressListQueryString({ ...urlState, page })}`;
}

export default async function ProgressPage({ searchParams }: ProgressPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadProgressListPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view progress for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="progress" organizationOptions={result.organizations}>
        <ProgressOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/progress"
          description="Select an organization to view progress."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="progress">
        <section className={styles.statePanel} aria-labelledby="org-context-title">
          <h1 id="org-context-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    const retryHref = progressListPageRetryHref({
      org: Array.isArray(rawSearchParams.org)
        ? rawSearchParams.org[0]
        : rawSearchParams.org,
      includeVoided: false,
      sort: "occurred_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    });

    return (
      <AppShell activeNav="progress">
        <section className={styles.page}>
          <h1>Progress</h1>
          <Alert title="Unable to load progress" variant="error">
            {result.message}
          </Alert>
          {result.retryable ? (
            <p>
              <a href={retryHref}>Retry loading progress</a>
            </p>
          ) : null}
        </section>
      </AppShell>
    );
  }

  const emptyState = resolveProgressListEmptyState(result.urlState);
  const { pagination } = result.list;
  const previousHref = pagination.hasPreviousPage
    ? buildPageHref(result.urlState, pagination.page - 1)
    : undefined;
  const nextHref = pagination.hasNextPage
    ? buildPageHref(result.urlState, pagination.page + 1)
    : undefined;

  return (
    <AppShell
      activeNav="progress"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction="/progress"
    >
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderRow}>
            <h1>Progress</h1>
            {canShowRecordProgressWorkflow(result.role) ? (
              <a
                className={styles.recordLink}
                href={buildProgressCreateHref({ organizationId: result.selectedOrganizationId })}
              >
                Record progress
              </a>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Progress workspace for {result.organizationName}. Times shown in {result.timeZone}.
          </p>
          <p className={styles.summary}>
            Showing {result.list.items.length} of {pagination.total} progress records
          </p>
        </header>

        {result.filterWarning ? (
          <Alert title="Filters adjusted" variant="warning">
            {result.filterWarning}
          </Alert>
        ) : null}

        {result.context && hasProgressRelationshipContext(result.urlState) ? (
          <p className={styles.contextBanner} role="status">
            Showing progress for the selected enrollment, customer, or program context.{" "}
            <a href={buildClearProgressContextHref(result.urlState)}>Clear context</a>
          </p>
        ) : null}

        <ProgressListFilters urlState={result.urlState} role={result.role} />

        <ProgressListPresentation
          facts={result.list.items}
          timeZone={result.timeZone}
          listState={result.urlState}
          recorderLabels={result.recorderLabels}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          clearFiltersHref={emptyState.clearHref}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          previousHref={previousHref}
          nextHref={nextHref}
          ariaLabel="Progress list pagination"
        />
      </section>
    </AppShell>
  );
}
