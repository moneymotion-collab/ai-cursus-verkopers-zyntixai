import { AppShell } from "@/components/app-shell";
import { LeadOrganizationRequiredPanel } from "@/features/leads/ui/lead-organization-required-panel";
import { LeadCreateForm } from "@/features/leads/ui/lead-create-form";
import { loadLeadCreatePage } from "@/features/leads/ui/load-lead-workflow-page";
import { buildBackToLeadsHref } from "@/features/leads/ui/lead-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type LeadCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function LeadCreatePage({ searchParams }: LeadCreatePageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadLeadCreatePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to create leads.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
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
          targetPath="/leads/new"
          description="Select an organization before creating a lead."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel}>
          <h1>Unable to load create lead form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="leads">
        <section className={styles.statePanel}>
          <h1>Create lead unavailable</h1>
          <p>You do not have permission to create leads.</p>
          <a href={buildBackToLeadsHref(result.listState)}>Back to leads</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      activeNav="leads"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction="/leads/new"
    >
      <section className={styles.page}>
        <LeadCreateForm
          organizationId={result.organizationId}
          listState={result.listState}
          ownerOptions={result.ownerOptions}
          cancelHref={buildBackToLeadsHref(result.listState)}
        />
      </section>
    </AppShell>
  );
}
