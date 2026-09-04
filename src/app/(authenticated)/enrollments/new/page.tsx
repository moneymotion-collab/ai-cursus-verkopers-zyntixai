import { AppShell } from "@/components/app-shell";
import { EnrollmentOrganizationRequiredPanel } from "@/features/enrollments/ui/enrollment-organization-required-panel";
import { EnrollmentCreateForm } from "@/features/enrollments/ui/enrollment-create-form";
import { loadEnrollmentCreatePage } from "@/features/enrollments/ui/load-enrollment-create-page";
import { buildBackToEnrollmentsHref } from "@/features/enrollments/ui/enrollment-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type EnrollmentCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EnrollmentCreatePage({ searchParams }: EnrollmentCreatePageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadEnrollmentCreatePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to create enrollments.</p>
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
          targetPath="/enrollments/new"
          description="Select an organization before creating an enrollment."
        />
      </AppShell>
    );
  }

  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav="enrollments" moduleNavVisibility={result.moduleAccess.navVisibility}>
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
          <h1>Unable to load create enrollment form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="enrollments">
        <section className={styles.statePanel}>
          <h1>Create enrollment unavailable</h1>
          <p>You do not have permission to create enrollments.</p>
          <a href={buildBackToEnrollmentsHref(result.listState)}>Back to enrollments</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      activeNav="enrollments"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction="/enrollments/new"
    >
      <section className={styles.page}>
        <EnrollmentCreateForm
          organizationId={result.organizationId}
          listState={result.listState}
          cancelHref={buildBackToEnrollmentsHref(result.listState)}
          customers={result.customers}
          programs={result.programs}
          members={result.members}
          optionsError={result.optionsError}
          initialCustomerId={result.initialCustomerId}
          initialProgramId={result.initialProgramId}
          contextNotice={result.contextNotice}
          duplicateOpenNotice={result.duplicateOpenNotice}
        />
      </section>
    </AppShell>
  );
}
