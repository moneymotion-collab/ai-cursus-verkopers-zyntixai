import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { EnrollmentOrganizationRequiredPanel } from "@/features/enrollments/ui/enrollment-organization-required-panel";
import {
  EnrollmentDetail,
  EnrollmentUnavailableDetail,
} from "@/features/enrollments/ui/enrollment-detail";
import { loadEnrollmentDetailPage } from "@/features/enrollments/ui/load-enrollment-detail-page";
import {
  parseEnrollmentListReturnState,
  buildEnrollmentListQueryString,
} from "@/features/enrollments/ui/enrollment-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type EnrollmentDetailPageProps = {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnrollmentDetailPage({
  params,
  searchParams,
}: EnrollmentDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { enrollmentId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadEnrollmentDetailPage(supabase, enrollmentId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view enrollment details for your organization.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
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
          targetPath={`/enrollments/${enrollmentId}`}
          description="Select an organization to view this enrollment."
        />
      </AppShell>
    );
  }

  if (result.kind === "org_context_missing" || result.kind === "query_error") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.page}>
          <h1>Enrollment details</h1>
          <Alert title="Unable to load enrollment" variant="error">
            {result.message}
          </Alert>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "enrollment_unavailable") {
    return (
      <AppShell activeNav="enrollments">
        <EnrollmentUnavailableDetail backHref={result.backHref} />
      </AppShell>
    );
  }

  const listState = {
    ...parseEnrollmentListReturnState(rawSearchParams, result.role),
    org: result.selectedOrganizationId,
  };
  const reloadHref = `/enrollments/${enrollmentId}${buildEnrollmentListQueryString(listState)}`;

  return (
    <AppShell
      activeNav="enrollments"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/enrollments/${enrollmentId}`}
    >
      <section className={styles.page}>
        <EnrollmentDetail viewModel={result.data} reloadHref={reloadHref} />
      </section>
    </AppShell>
  );
}
