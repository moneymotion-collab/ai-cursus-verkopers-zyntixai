import { AppShell } from "@/components/app-shell";
import { CustomerOrganizationRequiredPanel } from "@/features/customers/ui/customer-organization-required-panel";
import { CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import { CustomerEditForm } from "@/features/customers/ui/customer-edit-form";
import { loadCustomerEditPage } from "@/features/customers/ui/load-customer-workflow-page";
import { buildBackToCustomersHref } from "@/features/customers/ui/customer-navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

type CustomerEditPageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerEditPage({ params, searchParams }: CustomerEditPageProps) {
  const supabase = await createSupabaseServerClient();
  const { customerId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadCustomerEditPage(supabase, customerId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to edit customers.</p>
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
          targetPath={`/customers/${customerId}/edit`}
          description="Select an organization before editing this customer."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel}>
          <h1>Unable to load edit customer form</h1>
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
          <h1>Edit customer unavailable</h1>
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
      organizationSelectorAction={`/customers/${customerId}/edit`}
    >
      <section className={styles.page}>
        <CustomerEditForm
          organizationId={result.organizationId}
          customer={result.customer}
          listState={result.listState}
          ownerOptions={result.ownerOptions}
          cancelHref={result.backHref}
        />
      </section>
    </AppShell>
  );
}
