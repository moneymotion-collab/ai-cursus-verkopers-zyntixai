import { AppShell } from "@/components/app-shell";
import { EnrollmentOrganizationRequiredPanel } from "@/features/enrollments/ui/enrollment-organization-required-panel";
import { EnrollmentUnavailableDetail } from "@/features/enrollments/ui/enrollment-detail";
import { EnrollmentOwnerForm } from "@/features/enrollments/ui/enrollment-owner-form";
import { loadEnrollmentEditPage } from "@/features/enrollments/ui/load-enrollment-edit-page";
import { buildBackToEnrollmentsHref } from "@/features/enrollments/ui/enrollment-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type EnrollmentEditPageProps = {
  params: Promise<{ enrollmentId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnrollmentEditPage({
  params,
  searchParams,
}: EnrollmentEditPageProps) {
  const supabase = await createSupabaseServerClient();
  const { enrollmentId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadEnrollmentEditPage(supabase, enrollmentId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to edit enrollments.</p>
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
          targetPath={`/enrollments/${enrollmentId}/edit`}
          description="Select an organization before editing this enrollment."
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
          <h1>Unable to load edit enrollment form</h1>
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
          <h1>Edit enrollment unavailable</h1>
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
      organizationSelectorAction={`/enrollments/${enrollmentId}/edit`}
    >
      <section className={styles.page}>
        <EnrollmentOwnerForm
          organizationId={result.organizationId}
          enrollment={result.enrollment}
          members={result.members}
          listState={result.listState}
          cancelHref={result.backHref}
          membersError={result.membersError}
        />
      </section>
    </AppShell>
  );
}
