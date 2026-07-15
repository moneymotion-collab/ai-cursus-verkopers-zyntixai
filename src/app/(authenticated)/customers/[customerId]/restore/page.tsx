import { AppShell } from "@/components/app-shell";
import { CustomerOrganizationRequiredPanel } from "@/features/customers/ui/customer-organization-required-panel";
import { CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import { CustomerRestoreForm } from "@/features/customers/ui/customer-restore-form";
import { loadCustomerRestorePage } from "@/features/customers/ui/load-customer-lifecycle-workflow-page";
import { buildBackToCustomersHref } from "@/features/customers/ui/customer-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type CustomerRestorePageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerRestorePage({ params, searchParams }: CustomerRestorePageProps) {
  const supabase = await createSupabaseServerClient();
  const { customerId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadCustomerRestorePage(supabase, customerId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to restore customers.</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_unavailable") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="org-unavailable-title">
          <h1 id="org-unavailable-title">Organization unavailable</h1>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="customers" organizationOptions={result.organizations}>
        <CustomerOrganizationRequiredPanel
          organizations={result.organizations}
          targetPath={`/customers/${customerId}/restore`}
          description="Select an organization before restoring this customer."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel}>
          <h1>Unable to load restore form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "invalid_customer") {
    return (
      <AppShell activeNav="customers">
        <CustomerUnavailableDetail backHref="/customers" />
      </AppShell>
    );
  }

  if (result.kind === "customer_unavailable") {
    return (
      <AppShell activeNav="customers">
        <CustomerUnavailableDetail backHref={buildBackToCustomersHref(result.listState)} />
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel}>
          <h1>Restore customer unavailable</h1>
          <p>{result.message}</p>
          <a href={result.backHref}>Back to customer</a>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell
      activeNav="customers"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.organizationId}
      organizationSelectorAction={`/customers/${customerId}/restore`}
    >
      <section className={styles.page}>
        <CustomerRestoreForm
          organizationId={result.organizationId}
          customer={result.customer}
          listState={result.listState}
          backHref={result.backHref}
        />
      </section>
    </AppShell>
  );
}
