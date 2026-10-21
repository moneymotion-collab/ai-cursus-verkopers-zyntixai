import { authenticatedPageMetadata } from "@/features/workspace/authenticated-document-titles";
import { AppShell } from "@/components/app-shell";
import { CustomerOrganizationRequiredPanel } from "@/features/customers/ui/customer-organization-required-panel";
import { CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import { CustomerStatusForm } from "@/features/customers/ui/customer-status-form";
import { loadCustomerStatusPage } from "@/features/customers/ui/load-customer-lifecycle-workflow-page";
import { buildBackToCustomersHref } from "@/features/customers/ui/customer-navigation";
import {
  lifecycleActionUnavailableHeading,
  lifecycleAuthRequiredCopy,
  lifecycleBackToSubjectLabel,
  lifecycleOrganizationRequiredDescription,
} from "@/features/customers/ui/customer-lifecycle-workflow-copy";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "../../page.module.css";

export const metadata = authenticatedPageMetadata("/customers/[customerId]/status");


type CustomerStatusPageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerStatusPage({ params, searchParams }: CustomerStatusPageProps) {
  const supabase = await createSupabaseServerClient();
  const { customerId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadCustomerStatusPage(supabase, customerId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>{lifecycleAuthRequiredCopy("status")}</p>
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
          targetPath={`/customers/${customerId}/status`}
          description={lifecycleOrganizationRequiredDescription("status")}
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error" || result.kind === "org_context_missing") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel}>
          <h1>Unable to load status form</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "invalid_customer") {
    return (
      <AppShell activeNav="customers">
        <CustomerUnavailableDetail backHref="/customers" unresolved />
      </AppShell>
    );
  }

  if (result.kind === "customer_unavailable") {
    return (
      <AppShell activeNav="customers" terminology={result.terminology}>
        <CustomerUnavailableDetail
          backHref={buildBackToCustomersHref(result.listState)}
          terminology={result.terminology}
        />
      </AppShell>
    );
  }

  if (result.kind === "action_unavailable") {
    return (
      <AppShell activeNav="customers" terminology={result.terminology}>
        <section className={styles.statePanel}>
          <h1>{lifecycleActionUnavailableHeading("status", result.terminology)}</h1>
          <p>{result.message}</p>
          <a href={result.backHref}>{lifecycleBackToSubjectLabel(result.terminology)}</a>
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
      organizationSelectorAction={`/customers/${customerId}/status`}
    >
      <section className={styles.page}>
        <CustomerStatusForm
          organizationId={result.organizationId}
          customer={result.customer}
          allowedTargets={result.allowedTargets ?? []}
          listState={result.listState}
          cancelHref={result.backHref}
          terminology={result.moduleAccess.terminology}
        />
      </section>
    </AppShell>
  );
}
