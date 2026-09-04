import { AppShell } from "@/components/app-shell";
import { CustomerOrganizationRequiredPanel } from "@/features/customers/ui/customer-organization-required-panel";
import { CustomerCreateForm } from "@/features/customers/ui/customer-create-form";
import { loadCustomerCreatePage } from "@/features/customers/ui/load-customer-workflow-page";
import { buildBackToCustomersHref } from "@/features/customers/ui/customer-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../page.module.css";

type CustomerCreatePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerCreatePage({ searchParams }: CustomerCreatePageProps) {
  const supabase = await createSupabaseServerClient();
  const rawSearchParams = await searchParams;
  const result = await loadCustomerCreatePage(supabase, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to create customers.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
          <p>No active organization membership is available for this account.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="customers" organizationOptions={result.organizations}>
        <CustomerOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath="/customers/new"
          description="Select an organization before creating a customer."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel}>
          <h1>Unable to load create customer form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel}>
          <h1>Create customer unavailable</h1>
          <p>You do not have permission to create customers.</p>
          <a href={buildBackToCustomersHref(result.listState)}>Back to customers</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      terminology={result.moduleAccess.terminology}
      activeNav="customers"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction="/customers/new"
    >
      <section className={styles.page}>
        <CustomerCreateForm
          organizationId={result.organizationId}
          listState={result.listState}
          ownerOptions={result.ownerOptions}
          cancelHref={buildBackToCustomersHref(result.listState)}
        />
      </section>
    </AppShell>
  );
}
