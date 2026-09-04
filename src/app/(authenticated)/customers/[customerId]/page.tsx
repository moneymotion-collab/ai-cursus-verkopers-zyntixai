import { AppShell } from "@/components/app-shell";
import { Alert } from "@/components/ui/alert";
import { CustomerOrganizationRequiredPanel } from "@/features/customers/ui/customer-organization-required-panel";
import { CustomerDetail, CustomerUnavailableDetail } from "@/features/customers/ui/customer-detail";
import { loadCustomerDetailPage } from "@/features/customers/ui/load-customer-detail";
import { parseCustomerListReturnState, buildCustomerArchiveHref, buildCustomerEditHref, buildCustomerRestoreHref, buildCustomerStatusHref } from "@/features/customers/ui/customer-navigation";
import { buildCustomerListQueryString } from "@/features/customers/ui/customer-list-search-params";
import {
  canShowArchiveWorkflow,
  canShowEditWorkflow,
  canShowRestoreWorkflow,
  canShowStatusWorkflow,
} from "@/features/customers/ui/customer-workflow-visibility";
import {
  buildEnrollmentCreateHrefFromContext,
  buildEnrollmentsListHrefFromContext,
} from "@/features/enrollments/ui/enrollment-navigation";
import { canShowCreateEnrollmentWorkflow } from "@/features/enrollments/ui/enrollment-workflow-visibility";
import { isCustomerEligibleForEnrollmentCreate } from "@/features/enrollments/domain/contextual-enrollment";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import styles from "./page.module.css";

type CustomerDetailPageProps = {
  params: Promise<{ customerId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const supabase = await createSupabaseServerClient();
  const { customerId } = await params;
  const rawSearchParams = await searchParams;
  const result = await loadCustomerDetailPage(supabase, customerId, rawSearchParams);

  if (result.kind === "auth_required") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.statePanel} aria-labelledby="auth-required-title">
          <h1 id="auth-required-title">Sign in required</h1>
          <p>Please sign in to view customer details for your organization.</p>
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
          targetPath={`/customers/${customerId}`}
          description="Select an organization to view this customer."
        />
      </AppShell>
    );
  }

  if (result.kind === "query_error") {
    return (
      <AppShell activeNav="customers">
        <section className={styles.page}>
          <h1>Customer details</h1>
          <Alert title="Unable to load customer" variant="error">
            {result.message}
          </Alert>
        </section>
      </AppShell>
    );
  }

  if (result.kind === "customer_unavailable") {
    return (
      <AppShell activeNav="customers">
        <CustomerUnavailableDetail backHref={result.backHref} />
      </AppShell>
    );
  }

  const listState = {
    ...parseCustomerListReturnState(rawSearchParams, result.role),
    org: result.selectedOrganizationId,
  };
  const reloadHref = `/customers/${customerId}${buildCustomerListQueryString(listState)}`;
  const workflowLinks = {
    edit: canShowEditWorkflow(result.data.customer, result.role)
      ? buildCustomerEditHref(customerId, listState)
      : undefined,
    status: canShowStatusWorkflow(result.data.customer, result.role)
      ? buildCustomerStatusHref(customerId, listState)
      : undefined,
    archive: canShowArchiveWorkflow(result.data.customer, result.role)
      ? buildCustomerArchiveHref(customerId, listState)
      : undefined,
    restore: canShowRestoreWorkflow(result.data.customer, result.role)
      ? buildCustomerRestoreHref(customerId, listState)
      : undefined,
  };

  const enrollmentLinks = {
    viewEnrollmentsHref: buildEnrollmentsListHrefFromContext({
      org: result.selectedOrganizationId,
      customerId,
    }),
    createEnrollmentHref:
      canShowCreateEnrollmentWorkflow(result.role) &&
      isCustomerEligibleForEnrollmentCreate(result.data.customer)
        ? buildEnrollmentCreateHrefFromContext({
            org: result.selectedOrganizationId,
            customerId,
          })
        : undefined,
  };

  return (
    <AppShell
      moduleNavVisibility={result.moduleAccess.navVisibility}
      activeNav="customers"
      organizationOptions={result.organizationOptions}
      selectedOrganizationId={result.selectedOrganizationId}
      organizationSelectorAction={`/customers/${customerId}`}
    >
      <section className={styles.page}>
        <CustomerDetail
          viewModel={result.data}
          reloadHref={reloadHref}
          workflowLinks={workflowLinks}
          enrollmentLinks={enrollmentLinks}
        />
      </section>
    </AppShell>
  );
}
