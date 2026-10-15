import { Alert } from "@/components/ui/alert";
import { AppShellChrome } from "@/components/app-shell-chrome";
import { Pagination } from "@/components/ui/pagination";
import customerPageStyles from "@/app/(authenticated)/customers/page.module.css";
import customerLoadingStyles from "@/app/(authenticated)/customers/loading.module.css";
import customerErrorStyles from "@/app/(authenticated)/customers/error.module.css";
import leadPageStyles from "@/app/(authenticated)/leads/page.module.css";
import { CustomerArchiveForm } from "@/features/customers/ui/customer-archive-form";
import { CustomerCreateForm } from "@/features/customers/ui/customer-create-form";
import { CustomerDetail } from "@/features/customers/ui/customer-detail";
import { CustomerEditForm } from "@/features/customers/ui/customer-edit-form";
import { CustomerRestoreForm } from "@/features/customers/ui/customer-restore-form";
import { CustomerStatusForm } from "@/features/customers/ui/customer-status-form";
import { CustomerListFilters } from "@/features/customers/ui/customer-list-filters";
import { CustomerListPresentation } from "@/features/customers/ui/customer-list";
import type { CustomerListItemReadModel } from "@/features/customers/domain/read-types";
import type { CustomerDetailViewModel } from "@/features/customers/ui/load-customer-detail";
import { LeadArchiveForm } from "@/features/leads/ui/lead-archive-form";
import { LeadConvertForm } from "@/features/leads/ui/lead-convert-form";
import { LeadCreateForm } from "@/features/leads/ui/lead-create-form";
import { LeadEditForm } from "@/features/leads/ui/lead-edit-form";
import { LeadListFilters } from "@/features/leads/ui/lead-list-filters";
import { LeadListPresentation } from "@/features/leads/ui/lead-list";
import { LeadRestoreForm } from "@/features/leads/ui/lead-restore-form";
import { LeadStageForm } from "@/features/leads/ui/lead-stage-form";
import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import type { LeadListItemReadModel } from "@/features/leads/domain/read-types";
import { courseSellerPreviewHref } from "@/dev/ad02-preview-access";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const LONG_NAME = "Example client with a display name that wraps across a narrow screen";
const LONG_EMAIL = "example.very.long.contact.address@example-workspace.test";
const WIDE_TOKEN =
  "ExampleWideColumnTokenWithoutSpacesThatUsesTheExistingTableColumns";

const ownerOptions = {
  members: [
    { value: "example-owner", label: "Example owner" },
    {
      value: "example-owner-long",
      label: "Example owner with a long assignment label for a narrow screen",
    },
  ],
  capped: false,
};

const customerListState = {
  org: ORG,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

const leadListState = {
  org: ORG,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

function customerRows(long: boolean): CustomerListItemReadModel[] {
  const name = long
    ? "Example client with a display name that wraps across a narrow screen"
    : "Example north client";
  const email = long
    ? "example.very.long.contact.address@example-workspace.test"
    : "example.client@example.test";
  return [
    {
      id: "example-customer-1",
      organizationId: ORG,
      displayName: name,
      status: "active",
      statusLabel: "Active",
      email,
      ownerMemberId: null,
      ownerLabel: "Example owner",
      startedAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      archivedAt: null,
      derived: { isArchived: false },
    },
    {
      id: "example-customer-2",
      organizationId: ORG,
      displayName: "Example paused client",
      status: "paused",
      statusLabel: "Paused",
      email: "example.paused@example.test",
      ownerMemberId: null,
      ownerLabel: "Unassigned",
      startedAt: "2026-03-01T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
      archivedAt: null,
      derived: { isArchived: false },
    },
  ];
}

function leadRows(long: boolean): LeadListItemReadModel[] {
  const name = long
    ? "Example lead with a display name that wraps across a narrow screen"
    : "Example north lead";
  const email = long
    ? "example.very.long.lead.address@example-workspace.test"
    : "example.lead@example.test";
  return [
    {
      id: "example-lead-1",
      organizationId: ORG,
      displayName: name,
      status: "open",
      statusLabel: "Open",
      email,
      ownerMemberId: null,
      ownerLabel: "Example owner",
      stageId: "example-stage",
      stageName: "New",
      stageCategory: "new",
      stageCategoryLabel: "New",
      sourceType: "manual",
      pursuitLabel: null,
      convertedCustomerId: null,
      convertedAt: null,
      createdAt: "2026-02-01T00:00:00.000Z",
      updatedAt: "2026-10-02T00:00:00.000Z",
      archivedAt: null,
      derived: { isArchived: false, isConverted: false, isConvertible: true },
    },
  ];
}

function detailView(long: boolean): CustomerDetailViewModel {
  const name = long
    ? "Example client with a display name that wraps across a narrow screen"
    : "Example north client";
  return {
    customer: {
      id: "example-customer-1",
      organizationId: ORG,
      displayName: name,
      firstName: "Example",
      lastName: "Client",
      email: long
        ? "example.very.long.contact.address@example-workspace.test"
        : "example.client@example.test",
      phone: "+31 6 0000 0000",
      status: "active",
      statusLabel: "Active",
      ownerMemberId: null,
      ownerLabel: "Example owner",
      createdByMemberId: null,
      createdByLabel: "Example owner",
      startedAt: "2026-01-15T00:00:00.000Z",
      endedAt: null,
      archivedAt: null,
      createdAt: "2026-01-15T00:00:00.000Z",
      updatedAt: "2026-10-01T00:00:00.000Z",
      derived: { isArchived: false, allowedTransitions: ["paused"] },
    },
    permissions: {
      canViewCustomer: true,
      canViewArchivedCustomers: true,
      canCreateCustomer: true,
      canEditCustomer: true,
      canTransitionCustomer: true,
      canArchiveCustomer: true,
      canRestoreCustomer: false,
      canViewStatusHistory: true,
      canViewRelatedTasks: true,
      canViewEnrollmentSummary: true,
    },
    history: [],
    historyState: { kind: "empty" },
    enrollments: [],
    enrollmentState: { kind: "empty" },
    relatedTasks: [],
    relatedTasksState: { kind: "empty" },
    projects: [],
    projectsState: { kind: "empty" },
    organizationTimezone: "Europe/Amsterdam",
    backHref: "/ad02-preview?state=customers",
    panelErrors: {},
  };
}

function exampleCustomer(long: boolean, archived = false) {
  const customer = detailView(long).customer;
  return {
    ...customer,
    archivedAt: archived ? "2026-09-01T00:00:00.000Z" : null,
    derived: { ...customer.derived, isArchived: archived },
  };
}

function exampleLead(long: boolean, archived = false): LeadDetailReadModel {
  return {
    id: "example-lead-1",
    organizationId: ORG,
    displayName: long ? LONG_NAME : "Example north lead",
    firstName: "Example",
    lastName: "Lead",
    email: long ? LONG_EMAIL : "example.lead@example.test",
    phone: "+31 6 0000 0000",
    status: "open",
    statusLabel: "Open",
    ownerMemberId: null,
    ownerLabel: long ? "Example owner with a long assignment label for a narrow screen" : "Example owner",
    createdByMemberId: null,
    createdByLabel: "Example owner",
    stage: {
      stageId: "example-stage-new",
      name: "New",
      position: 1,
      stageCategory: "new",
      stageCategoryLabel: "New",
      isDefault: true,
    },
    sourceType: "manual",
    sourceDetail: null,
    pursuitLabel: "Example program",
    convertedCustomer: null,
    archivedAt: archived ? "2026-09-01T00:00:00.000Z" : null,
    createdAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-10-02T00:00:00.000Z",
    derived: {
      isArchived: archived,
      isConverted: false,
      isConvertible: !archived,
      allowedStatusTransitions: ["lost"],
    },
  };
}

const stageOptions = [
  {
    stageId: "example-stage-new",
    name: "New",
    position: 1,
    stageCategory: "new" as const,
    stageCategoryLabel: "New",
    isDefault: true,
    isArchived: false,
  },
  {
    stageId: "example-stage-active",
    name: "Example stage with a long choice label for a narrow screen",
    position: 2,
    stageCategory: "active" as const,
    stageCategoryLabel: "Active",
    isDefault: false,
    isArchived: false,
  },
];

function wideCustomerRows(): CustomerListItemReadModel[] {
  const row = customerRows(false)[0];
  return [
    {
      ...row,
      displayName: WIDE_TOKEN,
      email: `${WIDE_TOKEN}@example-workspace.test`,
      ownerLabel: WIDE_TOKEN,
    },
  ];
}

export function Ad03RecordsPreview({
  state,
  orgName,
  model,
  statePrefix = "",
}: {
  state: string;
  orgName: string;
  model: OperatingModelId;
  statePrefix?: string;
}) {
  const leads = state.startsWith("lead");
  const long = state.endsWith("long");
  const previewHref = (name: string) => courseSellerPreviewHref(name, statePrefix);
  return (
    <AppShellChrome
      activeNav={leads ? "leads" : "customers"}
      moduleNavVisibility={operatingModelNavVisibility(model)}
      organizationOptions={[
        { organizationId: ORG, role: "owner", displayName: orgName },
        { organizationId: OTHER, role: "admin", displayName: "Example second workspace" },
      ]}
      selectedOrganizationId={ORG}
      organizationSelectorAction="/ad02-preview"
    >
      {state === "customers-loading" ? (
        <section className={customerLoadingStyles.loading} aria-busy="true">
          <h1 className={customerLoadingStyles.title}>Customers</h1>
          <p className={customerLoadingStyles.message}>Loading customers…</p>
          <div className={customerLoadingStyles.tableSkeleton} aria-hidden="true">
            <div className={customerLoadingStyles.row} />
            <div className={customerLoadingStyles.row} />
          </div>
          <ul className={customerLoadingStyles.cardSkeleton} aria-hidden="true">
            <li className={customerLoadingStyles.card} />
          </ul>
        </section>
      ) : null}
      {state === "customers-error" ? (
        <section className={customerErrorStyles.errorPanel}>
          <h1>Something went wrong</h1>
          <Alert title="Unable to display customers" variant="error">
            An unexpected error occurred while loading the customers page. Please try again.
          </Alert>
          <button type="button" className={customerErrorStyles.retryButton}>
            Try again
          </button>
        </section>
      ) : null}
      {state === "customers" || state === "customers-long" || state === "customers-empty" ? (
        <section className={customerPageStyles.page}>
          <header className={customerPageStyles.pageHeader}>
            <div className={customerPageStyles.pageHeaderRow}>
              <h1>Customers</h1>
              <a className={customerPageStyles.newCustomerLink} href={previewHref("customer-form")}>
                New customer
              </a>
            </div>
            <p className={customerPageStyles.subtitle}>
              Customer list for {orgName}. Times shown in Europe/Amsterdam.
            </p>
          </header>
          <CustomerListFilters urlState={customerListState} role="owner" ownerOptions={[{ value: "example-owner", label: "Example owner" }]} />
          <CustomerListPresentation
            customers={state === "customers-empty" ? [] : customerRows(long)}
            timeZone="Europe/Amsterdam"
            listState={customerListState}
            emptyTitle="No customers are available."
            emptyDescription="Customers will appear here when they exist for your organization."
          />
          {state === "customers-empty" ? null : (
            <Pagination page={1} totalPages={2} nextHref={previewHref("customers")} ariaLabel="Customer list pagination" />
          )}
        </section>
      ) : null}
      {state === "customer-detail" || state === "customer-detail-long" ? (
        <CustomerDetail
          viewModel={detailView(state.endsWith("long"))}
          workflowLinks={{ edit: "/ad02-preview?state=customer-form", status: "/ad02-preview?state=customer-detail", archive: "/ad02-preview?state=customer-detail" }}
        />
      ) : null}
      {state === "customer-form" ? (
        <CustomerCreateForm
          organizationId={ORG}
          listState={customerListState}
          ownerOptions={{ members: [{ value: "example-owner", label: "Example owner" }], capped: false }}
          cancelHref={previewHref("customers")}
          initialUiState={{
            kind: "field_error",
            message: "Please correct the highlighted fields and try again.",
            fieldErrors: {
              displayName: ["Enter a customer name."],
              email: ["Enter a valid email address."],
            },
          }}
        />
      ) : null}
      {state === "customer-edit" || state === "customer-edit-long" ? (
        <section className={customerPageStyles.page}>
          <CustomerEditForm
            organizationId={ORG}
            customer={exampleCustomer(state.endsWith("long"))}
            listState={customerListState}
            ownerOptions={ownerOptions}
            cancelHref="/ad02-preview?state=customer-detail"
          />
        </section>
      ) : null}
      {state === "customer-status" ? (
        <section className={customerPageStyles.page}>
          <CustomerStatusForm
            organizationId={ORG}
            customer={exampleCustomer(true)}
            allowedTargets={["paused", "completed"]}
            listState={customerListState}
            cancelHref="/ad02-preview?state=customer-detail"
          />
        </section>
      ) : null}
      {state === "customer-archive" ? (
        <section className={customerPageStyles.page}>
          <CustomerArchiveForm
            organizationId={ORG}
            customer={exampleCustomer(true)}
            listState={customerListState}
            backHref="/ad02-preview?state=customer-detail"
          />
        </section>
      ) : null}
      {state === "customer-restore" ? (
        <section className={customerPageStyles.page}>
          <CustomerRestoreForm
            organizationId={ORG}
            customer={exampleCustomer(true, true)}
            listState={customerListState}
            backHref="/ad02-preview?state=customer-detail"
          />
        </section>
      ) : null}
      {state === "customers-wide" ? (
        <section className={customerPageStyles.page}>
          <header className={customerPageStyles.pageHeader}>
            <div className={customerPageStyles.pageHeaderRow}>
              <h1>Customers</h1>
            </div>
          </header>
          <CustomerListPresentation
            customers={wideCustomerRows()}
            timeZone="Europe/Amsterdam"
            listState={customerListState}
            emptyTitle="No customers are available."
            emptyDescription="Customers will appear here when they exist for your organization."
          />
        </section>
      ) : null}
      {state === "lead-form" || state === "lead-form-pending" ? (
        <section className={leadPageStyles.page}>
          <h1>New lead</h1>
          <p role="status">
            {state === "lead-form-pending"
              ? "Saving is shown as pending."
              : "Lead name is required. Enter a valid email address."}{" "}
            Static preview only. This does not submit a form.
          </p>
          {state === "lead-form" ? (
            <LeadCreateForm
              organizationId={ORG}
              listState={leadListState}
              ownerOptions={ownerOptions}
              cancelHref="/ad02-preview?state=leads"
            />
          ) : null}
        </section>
      ) : null}
      {state === "lead-edit" || state === "lead-edit-long" ? (
        <section className={leadPageStyles.page}>
          <LeadEditForm
            organizationId={ORG}
            lead={exampleLead(state.endsWith("long"))}
            listState={leadListState}
            ownerOptions={ownerOptions}
            cancelHref="/ad02-preview?state=leads"
          />
        </section>
      ) : null}
      {state === "lead-stage" ? (
        <section className={leadPageStyles.page}>
          <LeadStageForm
            organizationId={ORG}
            lead={exampleLead(true)}
            stageOptions={stageOptions}
            listState={leadListState}
            cancelHref="/ad02-preview?state=leads"
          />
        </section>
      ) : null}
      {state === "lead-archive" ? (
        <section className={leadPageStyles.page}>
          <LeadArchiveForm
            organizationId={ORG}
            lead={exampleLead(true)}
            role="owner"
            listState={leadListState}
            backHref="/ad02-preview?state=leads"
          />
        </section>
      ) : null}
      {state === "lead-restore" ? (
        <section className={leadPageStyles.page}>
          <LeadRestoreForm
            organizationId={ORG}
            lead={exampleLead(true, true)}
            listState={leadListState}
            backHref="/ad02-preview?state=leads"
          />
        </section>
      ) : null}
      {state === "lead-convert" ? (
        <section className={leadPageStyles.page}>
          <LeadConvertForm
            organizationId={ORG}
            lead={exampleLead(true)}
            customerOptions={{
              customers: [
                {
                  value: "example-customer-1",
                  label: "Example existing customer with a long choice label for a narrow screen",
                },
              ],
              capped: false,
            }}
            listState={leadListState}
            cancelHref="/ad02-preview?state=leads"
          />
        </section>
      ) : null}
      {state === "leads" || state === "leads-long" || state === "leads-empty" ? (
        <section className={leadPageStyles.page}>
          <header className={leadPageStyles.pageHeader}>
            <div className={leadPageStyles.pageHeaderRow}>
              <h1>Leads</h1>
              <a className={leadPageStyles.newLeadLink} href={previewHref("leads")}>
                New lead
              </a>
            </div>
            <p className={leadPageStyles.subtitle}>Lead list for {orgName}.</p>
          </header>
          <LeadListFilters urlState={leadListState} role="owner" ownerOptions={[{ value: "example-owner", label: "Example owner" }]} />
          <LeadListPresentation
            leads={state === "leads-empty" ? [] : leadRows(long)}
            timeZone="Europe/Amsterdam"
            listState={leadListState}
            emptyTitle="No leads are available."
            emptyDescription="Leads will appear here when they exist for your organization."
          />
        </section>
      ) : null}
    </AppShellChrome>
  );
}
