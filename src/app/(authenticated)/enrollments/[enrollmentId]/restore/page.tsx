import { AppShell } from "@/components/app-shell";
import { EnrollmentOrganizationRequiredPanel } from "@/features/enrollments/ui/enrollment-organization-required-panel";
import { EnrollmentUnavailableDetail } from "@/features/enrollments/ui/enrollment-detail";
import { EnrollmentRestoreForm } from "@/features/enrollments/ui/enrollment-restore-form";
import { loadEnrollmentRestorePage } from "@/features/enrollments/ui/load-enrollment-lifecycle-workflow-page";
import { buildBackToEnrollmentsHref } from "@/features/enrollments/ui/enrollment-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type EnrollmentRestorePageProps = {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnrollmentRestorePage({
  params,
  searchParams,
}: EnrollmentRestorePageProps) {
  const supabase = await createSupabaseServerClient();
  const { enrollmentId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadEnrollmentRestorePage(supabase, enrollmentId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to restore enrollments.</p>
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
          targetPath={`/enrollments/${enrollmentId}/restore`}
          description="Select an organization before restoring this enrollment."
        />
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="enrollments" moduleNavVisibility={result.moduleAccess.navVisibility} terminology={result.moduleAccess.terminology}>
        <section className={styles.statePanel} aria-labelledby="forbidden-title">
          <h1 id="forbidden-title">Access denied</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel}>
          <h1>Unable to load restore form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "invalid_enrollment") {
    return (
      <AppShell activeNav="enrollments">
        <EnrollmentUnavailableDetail backHref="/enrollments" />
      </AppShell>
    );
  }

  if (result.kind === "enrollment_unavailable") {
    return (
      <AppShell activeNav="enrollments">
        <EnrollmentUnavailableDetail backHref={buildBackToEnrollmentsHref(result.listState)} />
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel}>
          <h1>Restore enrollment unavailable</h1>
          <p>{result.message}</p>
          <a href={result.backHref}>Back to enrollment</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      activeNav="enrollments"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/enrollments/${enrollmentId}/restore`}
    >
      <section className={styles.page}>
        <EnrollmentRestoreForm
          organizationId={result.organizationId}
          enrollment={result.enrollment}
          listState={result.listState}
          backHref={result.backHref}
        />
      </section>
    </AppShell>
  );
}
