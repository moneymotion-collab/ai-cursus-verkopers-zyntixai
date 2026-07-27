import { Alert } from "@/components/ui/alert";
import { AppShell } from "@/components/app-shell";
import { Pagination } from "@/components/ui/pagination";
import { EnrollmentOrganizationRequiredPanel } from "@/features/enrollments/ui/enrollment-organization-required-panel";
import { EnrollmentListFilters } from "@/features/enrollments/ui/enrollment-list-filters";
import { EnrollmentListPresentation } from "@/features/enrollments/ui/enrollment-list";
import {
  loadEnrollmentsPage,
  enrollmentsPageRetryHref,
  type EnrollmentListRelationshipContext,
} from "@/features/enrollments/ui/load-enrollments-page";
import {
  buildClearEnrollmentContextHref,
  buildEnrollmentListQueryString,
  hasEnrollmentRelationshipContext,
  type EnrollmentListUrlState,
} from "@/features/enrollments/ui/enrollment-list-search-params";
import { buildEnrollmentCreateHref } from "@/features/enrollments/ui/enrollment-navigation";
import { canShowCreateEnrollmentWorkflow } from "@/features/enrollments/ui/enrollment-workflow-visibility";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type EnrollmentsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function hasOtherFilters(urlState: EnrollmentListUrlState): boolean {
  return Boolean(urlState.q || urlState.status || urlState.archived);
}

function buildPageHref(urlState: EnrollmentListUrlState, page: number): string {
  return `/enrollments${buildEnrollmentListQueryString({ ...urlState, page })}`;
}

function buildContextBannerMessage(context: EnrollmentListRelationshipContext): string {
  if (context.customerLabel && context.programLabel) {
    return `Showing enrollments for customer ${context.customerLabel} and program ${context.programLabel}.`;
  }
  if (context.customerLabel) {
    return `Showing enrollments for customer ${context.customerLabel}.`;
  }
  if (context.programLabel) {
    return `Showing enrollments for program ${context.programLabel}.`;
  }
  return "Showing enrollments for the selected context.";
}

function resolveEmptyState(
  urlState: EnrollmentListUrlState,
  context: EnrollmentListRelationshipContext | null,
): {
  title: string;
  description: string;
  clearHref?: string;
  showCreateInEmpty?: boolean;
} {
  if (urlState.archived) {
    return {
      title: "No archived enrollments are available.",
      description: "Archived enrollments will appear here when they exist for your organization.",
      clearHref: hasOtherFilters(urlState) || hasEnrollmentRelationshipContext(urlState)
        ? `/enrollments${buildEnrollmentListQueryString({
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

  if (hasOtherFilters(urlState)) {
    return {
      title: "No enrollments match the selected filters.",
      description: "Try adjusting or clearing your filters to see more enrollments.",
      clearHref: `/enrollments${buildEnrollmentListQueryString({
        org: urlState.org,
        archived: false,
        sort: urlState.sort,
        direction: urlState.direction,
        page: 1,
        pageSize: urlState.pageSize,
      })}`,
    };
  }

  if (context && hasEnrollmentRelationshipContext(urlState)) {
    const hasCustomer = Boolean(urlState.customerId);
    const hasProgram = Boolean(urlState.programId);
    const title =
      hasCustomer && hasProgram
        ? "No enrollments for this customer and program yet."
        : hasCustomer
          ? "No enrollments for this customer yet."
          : "No enrollments for this program yet.";
    const description =
      hasCustomer && hasProgram
        ? "Enrollments linking this customer and program will appear here once created."
        : hasCustomer
          ? "Enrollments for this customer will appear here once created."
          : "Enrollments for this program will appear here once created.";

    return { title, description, showCreateInEmpty: true };
  }

  return {
    title: "No enrollments yet",
    description:
      "An enrollment links an eligible customer to an active program. Create an enrollment to get started.",
    showCreateInEmpty: true,
  };
}

export default async function EnrollmentsPage({ searchParams }: EnrollmentsPageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadEnrollmentsPage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view enrollments for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "no_organizations") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="enrollments" organizationOptions={result.organizations}>
        <EnrollmentOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/enrollments"
          description="Select an organization to view enrollments."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="org-context-title">
          <h1 id="org-context-title">Organization unavailable</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    const retryHref = enrollmentsPageRetryHref({
      org: rawSearchParams.org
        ? Array.isArray(rawSearchParams.org)
          ? rawSearchParams.org[0]
          : rawSearchParams.org
        : undefined,
      archived: false,
      sort: "enrolled_at",
      direction: "desc",
      page: 1,
      pageSize: 25,
    });

    return (
      <AppShell activeNav="enrollments">
        <section className={styles.page}>
          <h1>Enrollments</h1>
          <Alert title="Unable to load enrollments" variant="error">
            {result.message}
          </Alert>
          {result.retryable ? (
            <p>
              <a href={retryHref}>Retry loading enrollments</a>
            </p>
          ) : null}
        </section>
      </AppShell>
    );
  }

  if (result.kind === "context_unavailable") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="enrollment-context-unavailable-title">
          <h1 id="enrollment-context-unavailable-title">Enrollment context unavailable</h1>
          <p>{result.message}</p>
          <p>
            <a href={result.backHref}>Back to enrollments</a>
          </p>
        </section>
      </AppShell>
    );
  }

  const emptyState = resolveEmptyState(result.urlState, result.context);
  const canCreate = canShowCreateEnrollmentWorkflow(result.role);
  const createHref = canCreate ? buildEnrollmentCreateHref(result.urlState) : undefined;
  const { pagination } = result.list;
  const previousHref =
    pagination.hasPreviousPage ? buildPageHref(result.urlState, pagination.page - 1) : undefined;
  const nextHref =
    pagination.hasNextPage ? buildPageHref(result.urlState, pagination.page + 1) : undefined;

  return (
    <AppShell
      activeNav="enrollments"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction="/enrollments"
    >
      <section className={styles.page}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderRow}>
            <h1>Enrollments</h1>
            {canCreate ? (
              <a className={styles.newEnrollmentLink} href={createHref}>
                New enrollment
              </a>
            ) : null}
          </div>
          <p className={styles.subtitle}>
            Enrollment workspace for {result.organizationName}. Times shown in {result.timeZone}.
          </p>
          <p className={styles.summary}>
            Showing {result.list.items.length} of {pagination.total} enrollments
          </p>
        </header>

        {result.filterWarning ? (
          <Alert title="Filters adjusted" variant="warning">
            {result.filterWarning}
          </Alert>
        ) : null}

        {result.context && hasEnrollmentRelationshipContext(result.urlState) ? (
          <p className={styles.contextBanner} role="status">
            {buildContextBannerMessage(result.context)}{" "}
            <a href={buildClearEnrollmentContextHref(result.urlState)}>Clear context</a>
          </p>
        ) : null}

        <EnrollmentListFilters urlState={result.urlState} role={result.role} />

        <EnrollmentListPresentation
          enrollments={result.list.items}
          timeZone={result.timeZone}
          listState={result.urlState}
          ownerLabels={result.ownerLabels}
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
          ariaLabel="Enrollment list pagination"
        />
      </section>
    </AppShell>
  );
}
