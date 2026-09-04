import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { ProgramOrganizationRequiredPanel } from "@/features/programs/ui/program-organization-required-panel";
import { ProgramListFilters } from "@/features/programs/ui/program-list-filters";
import { ProgramListPresentation } from "@/features/programs/ui/program-list";
import {
  loadProgramsPage,
  programsPageRetryHref,
} from "@/features/programs/ui/load-programs-page";
import {
  buildProgramListQueryString,
  type ProgramListUrlState,
} from "@/features/programs/ui/program-list-search-params";
import { buildProgramCreateHref } from "@/features/programs/ui/program-navigation";
import { canShowCreateProgramWorkflow } from "@/features/programs/ui/program-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type ProgramsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasActiveFilters(urlState: ProgramListUrlState): boolean {
  return Boolean(urlState.q || urlState.status || urlState.deliveryMode || urlState.archived);
}

function buildPageHref(urlState: ProgramListUrlState, page: number): string {
  return `/programs${buildProgramListQueryString({ ...urlState, page })}`;
}

function resolveEmptyState(
  urlState: ProgramListUrlState,
): {
  title: string;
  description: string;
  clearHref?: string;
  showCreateInEmpty?: boolean;
} {
  if (urlState.archived) {
    return {
      title: "No archived programs are available.",
      description: "Archived programs will appear here when they exist for your organization.",
      clearHref: hasActiveFilters(urlState)
        ? `/programs${buildProgramListQueryString({
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
      title: "No programs match the selected filters.",
      description: "Try adjusting or clearing your filters to see more programs.",
      clearHref: `/programs${buildProgramListQueryString({
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
    title: "No programs yet",
    description:
      "A program is a structured offering your organization delivers—such as a cohort, coaching package, or membership. Create a program to get started. Manage enrollments and progress from their workspaces.",
    showCreateInEmpty: true,
  };
}

export default async function ProgramsPage({ searchParams }: ProgramsPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadProgramsPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view programs for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="programs" organizationOptions={result.organizations}>
        <ProgramOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/programs"
          description="Select an organization to view programs."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="programs">
        <section className={styles.statePanel} aria-labelledby="org-context-title">
          <h1 id="org-context-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  
  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="programs" moduleNavVisibility={result.moduleAccess.navVisibility}>
        <section className={styles.statePanel} aria-labelledby="forbidden-title">
          <h1 id="forbidden-title">Access denied</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    const retryHref = programsPageRetryHref({
      org: rawSearchParams.org
        ? Array.isArray(rawSearchParams.org)
          ? rawSearchParams.org[0]
          : rawSearchParams.org
        : undefined,
      archived: false,
      sort: "updated_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    });

    return (
      <AppShell activeNav="programs">
        <section className={styles.page}>
          <h1>Programs</h1>
          <Alert title="Unable to load programs" variant="error">
            {result.message}
          </Alert>
          {result.retryable ? (
            <p>
              <a href={retryHref}>Retry loading programs</a>
            </p>
          ) : null}
        </section>
      </AppShell>
    );
  }

  const emptyState = resolveEmptyState(result.urlState);
  const canCreate = canShowCreateProgramWorkflow(result.role);
  const createHref = canCreate ? buildProgramCreateHref(result.urlState) : undefined;
  const { pagination } = result.list;
  const previousHref =
    pagination.hasPreviousPage ? buildPageHref(result.urlState, pagination.page - 1) : undefined;
  const nextHref =
    pagination.hasNextPage ? buildPageHref(result.urlState, pagination.page + 1) : undefined;

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      activeNav="programs"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction="/programs"
    >
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderRow}>
            <h1>Programs</h1>
            {canCreate ? (
              <a className={styles.newProgramLink} href={createHref}>
                New program
              </a>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Program workspace for {result.organizationName}. Times shown in {result.timeZone}.
          </p>
          <p className={styles.summary}>
            Showing {result.list.items.length} of {pagination.total} programs
          </p>
        </header>

        {result.filterWarning ? (
          <Alert title="Filters adjusted" variant="warning">
            {result.filterWarning}
          </Alert>
        ) : null}

        <ProgramListFilters urlState={result.urlState} role={result.role} />

        <ProgramListPresentation
          programs={result.list.items}
          timeZone={result.timeZone}
          listState={result.urlState}
          emptyTitle={emptyState.title}
          emptyDescription={emptyState.description}
          clearFiltersHref={emptyState.clearHref}
          createHref={emptyState.showCreateInEmpty ? createHref : undefined}
        />

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          previousHref={previousHref}
          nextHref={nextHref}
          ariaLabel="Program list pagination"
        />
      </section>
    </AppShell>
  );
}
