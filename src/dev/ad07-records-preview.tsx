import { AppShellChrome, type AppShellActiveNav } from "@/components/app-shell-chrome";
import { SiteForm, WorkOrderForm } from "@/features/field-operations/ui/forms";
import {
  DispatchView,
  SiteDetail,
  SitesList,
  WorkOrderDetail,
  WorkOrdersList,
} from "@/features/field-operations/ui/views";
import type {
  FieldPageContext,
  SiteRecord,
  WorkOrderRecord,
  WorkOrderStatus,
} from "@/features/field-operations/domain/types";
import fieldStyles from "@/features/field-operations/ui/field-operations.module.css";
import { buildOperatingModelProductModuleAccess, operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import type { ProjectPageContext, ProjectRecord, ProjectTask } from "@/features/projects/domain/types";
import { ProjectDetail, ProjectList } from "@/features/projects/ui/project-views";
import { ProjectForm } from "@/features/projects/ui/project-form";
import projectStyles from "@/features/projects/ui/projects.module.css";

const ORG = "11111111-1111-4111-8111-111111111111";
const LONG_JOB = "AD07 example job with a delivery name that wraps on a narrow screen";
const LONG_CUSTOMER = "AD07 example customer with a long display name for a narrow screen";
const LONG_SITE = "AD07 example site with a location name that wraps on a narrow screen";
const LONG_ADDRESS = "AD07 example address line that stays inside the site detail on a narrow screen";
const LONG_ORDER = "AD07 example work order with an instruction title that wraps on a narrow screen";
const LONG_TECH = "AD07 example technician with a long assignment label";

function atHour(dayOffset: number, hour: number): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hour, 30, 0, 0);
  return date.toISOString();
}

function fieldContext(orgName: string, moduleId: FieldPageContext["moduleId"]): FieldPageContext {
  const access = buildOperatingModelProductModuleAccess("field_operations");
  return {
    organizationId: ORG,
    organizationName: orgName,
    organizationOptions: [
      { organizationId: ORG, role: "owner", displayName: orgName },
      {
        organizationId: "22222222-2222-4222-8222-222222222222",
        role: "admin",
        displayName: "Example second workspace",
      },
    ],
    role: "owner",
    terminology: access.terminology,
    moduleAccess: access,
    moduleId,
  };
}

function jobContext(orgName: string): ProjectPageContext {
  const access = buildOperatingModelProductModuleAccess("field_operations");
  return {
    organizationId: ORG,
    organizationName: orgName,
    organizationOptions: [
      { organizationId: ORG, role: "owner", displayName: orgName },
      {
        organizationId: "22222222-2222-4222-8222-222222222222",
        role: "admin",
        displayName: "Example second workspace",
      },
    ],
    role: "owner",
    terminology: access.terminology,
    moduleAccess: access,
  };
}

function site(long: boolean, archived = false): SiteRecord {
  return {
    id: "example-site-1",
    organizationId: ORG,
    customerId: "example-customer",
    customerLabel: long ? LONG_CUSTOMER : "AD07 example customer",
    projectId: "example-job-1",
    projectLabel: long ? LONG_JOB : "AD07 example job",
    name: long ? LONG_SITE : "AD07 example site",
    addressLine1: long ? LONG_ADDRESS : "AD07 example street 12",
    addressLine2: long ? "AD07 example unit behind the loading bay" : null,
    postalCode: "3511 AA",
    city: long ? "AD07 example city district" : "Utrecht",
    country: "Netherlands",
    operationalNote: long
      ? "AD07 example operational note that stays inside the site detail on a narrow screen."
      : "AD07 example note",
    archivedAt: archived ? "2026-10-03T09:00:00.000Z" : null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
  };
}

function order(long: boolean, status: WorkOrderStatus = "scheduled", dayOffset = 0, assigned = true): WorkOrderRecord {
  const current = site(long);
  return {
    id: `example-order-${status}-${dayOffset}-${assigned ? "assigned" : "open"}`,
    organizationId: ORG,
    projectId: current.projectId,
    projectLabel: current.projectLabel,
    customerId: current.customerId,
    customerLabel: current.customerLabel,
    siteId: current.id,
    siteLabel: current.name,
    siteAddress: `${current.addressLine1}, ${current.postalCode} ${current.city}`,
    title: long ? LONG_ORDER : "AD07 example work order",
    instructions: long
      ? "AD07 example instructions that stay inside the work order detail on a narrow screen."
      : "AD07 example instructions",
    technicianMemberId: assigned ? "example-tech" : null,
    technicianLabel: assigned ? (long ? LONG_TECH : "AD07 example technician") : null,
    scheduledFor: status === "planned" ? null : atHour(dayOffset, 9),
    status,
    completedAt: status === "completed" ? atHour(-1, 16) : null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
  };
}

function job(long: boolean): ProjectRecord {
  return {
    id: "example-job-1",
    organizationId: ORG,
    customerId: "example-customer",
    customerLabel: long ? LONG_CUSTOMER : "AD07 example customer",
    name: long ? LONG_JOB : "AD07 example job",
    summary: long
      ? "AD07 example summary that stays inside the job detail on a narrow screen."
      : "AD07 example summary",
    status: "active",
    ownerMemberId: "example-owner",
    ownerLabel: long ? LONG_TECH : "AD07 example owner",
    plannedStart: "2026-10-01",
    plannedEnd: "2026-12-15",
    archivedAt: null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
  };
}

function tasks(long: boolean): ProjectTask[] {
  return [
    {
      id: "example-task-open",
      title: long ? LONG_ORDER : "AD07 example follow-up",
      status: "open",
      dueAt: "2026-10-20T09:00:00.000Z",
    },
  ];
}

function navFor(state: string): Extract<AppShellActiveNav, "projects" | "sites" | "workOrders" | "dispatch"> {
  if (state.startsWith("job")) return "projects";
  if (state.startsWith("site")) return "sites";
  if (state.startsWith("dispatch")) return "dispatch";
  return "workOrders";
}

export function Ad07RecordsPreview({
  state,
  orgName,
}: {
  state: string;
  orgName: string;
}) {
  const nav = navFor(state);
  const loading = state.endsWith("loading");
  const long = state.endsWith("long");
  const access = buildOperatingModelProductModuleAccess("field_operations");
  const jobs = jobContext(orgName);
  const sites = fieldContext(orgName, "sites");
  const orders = fieldContext(orgName, "workOrders");
  const dispatch = fieldContext(orgName, "dispatch");
  const schedule = [
    order(long, "scheduled", -2, true),
    order(long, "scheduled", 1, false),
    order(long, "in_progress", 0, true),
    order(long, "completed", -1, true),
  ];

  return (
    <AppShellChrome
      activeNav={nav}
      moduleNavVisibility={operatingModelNavVisibility("field_operations")}
      terminology={access.terminology}
      organizationOptions={jobs.organizationOptions}
      selectedOrganizationId={ORG}
      organizationSelectorAction="/ad02-preview"
      navigationPresentation={loading ? "pending" : "resolved"}
    >
      {state === "job-list" || state === "job-long" || state === "job-empty" ? (
        <ProjectList
          context={jobs}
          projects={state === "job-empty" ? [] : [job(long)]}
          filters={{ search: "", archived: false }}
        />
      ) : null}
      {state === "job-detail" || state === "job-detail-long" ? (
        <ProjectDetail
          context={jobs}
          project={job(long)}
          tasks={tasks(long)}
          tasksWarning={null}
          fieldSites={[site(long)]}
          fieldWorkOrders={[order(long)]}
        />
      ) : null}
      {state === "job-new" ? (
        <ProjectForm
          organizationId={ORG}
          terminology={jobs.terminology}
          options={{
            customers: [{ value: "example-customer", label: long ? LONG_CUSTOMER : "AD07 example customer" }],
            members: [{ value: "example-owner", label: LONG_TECH }],
            warning: null,
          }}
        />
      ) : null}
      {state === "site-loading" ? (
        <section className={fieldStyles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading sites</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
      {state === "site-query" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Unable to load sites</h1>
          <p role="alert">AD07 example query message</p>
        </section>
      ) : null}
      {state === "site-unavailable" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Site unavailable</h1>
          <p role="alert">This site is unavailable or you do not have access.</p>
        </section>
      ) : null}
      {state === "site-need-job" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Create a Job first</h1>
          <p>A Site must belong to an existing Job.</p>
          <a href="/ad02-preview?model=field_operations&state=job-new">New job</a>
        </section>
      ) : null}
      {state === "site-list" || state === "site-long" || state === "site-empty" ? (
        <SitesList context={sites} sites={state === "site-empty" ? [] : [site(long)]} />
      ) : null}
      {state === "site-detail" || state === "site-detail-long" || state === "site-restore" ? (
        <SiteDetail
          context={sites}
          site={site(long || state === "site-restore", state === "site-restore")}
          workOrders={state === "site-restore" ? [] : [order(long)]}
          warning={null}
        />
      ) : null}
      {state === "site-pending" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Site</h1>
          <p role="status">Archive is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "site-errors" || state === "site-saving" ? (
        <section className={fieldStyles.page}>
          <h1>New site</h1>
          <p role="status">
            {state === "site-saving"
              ? "Saving is shown as pending."
              : "AD07 example validation message."}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "site-new" || state === "site-edit" ? (
        <section className={fieldStyles.page}>
          <h1>{state === "site-edit" ? "Edit site" : "New site"}</h1>
          <SiteForm
            organizationId={ORG}
            site={state === "site-edit" ? site(true) : undefined}
            options={{
              projects: [
                { value: "example-job-1", label: LONG_JOB, customerId: "example-customer" },
                { value: "example-job-2", label: "AD07 example job", customerId: "example-customer" },
              ],
            }}
          />
        </section>
      ) : null}
      {state === "work-loading" ? (
        <section className={fieldStyles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading work orders</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
      {state === "work-query" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Unable to load work orders</h1>
          <p role="alert">AD07 example query message</p>
        </section>
      ) : null}
      {state === "work-unavailable" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Work order unavailable</h1>
          <p role="alert">This work order is unavailable or you do not have access.</p>
        </section>
      ) : null}
      {state === "work-need-site" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Create a Site first</h1>
          <p>A Work order must belong to a Site under a Job.</p>
          <a href="/ad02-preview?model=field_operations&state=site-new">New site</a>
        </section>
      ) : null}
      {state === "work-list" || state === "work-long" || state === "work-empty" || state === "work-filtered" ? (
        <WorkOrdersList
          context={orders}
          workOrders={state === "work-empty" || state === "work-filtered" ? [] : schedule}
          status={state === "work-filtered" ? "planned" : undefined}
        />
      ) : null}
      {state === "work-detail" || state === "work-detail-long" ? (
        <WorkOrderDetail
          context={orders}
          workOrder={order(long)}
        />
      ) : null}
      {state === "work-pending" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Work order</h1>
          <p role="status">The workflow is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "work-errors" || state === "work-saving" ? (
        <section className={fieldStyles.page}>
          <h1>New work order</h1>
          <p role="status">
            {state === "work-saving"
              ? "Saving is shown as pending."
              : "AD07 example validation message."}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "work-new" || state === "work-edit" ? (
        <section className={fieldStyles.page}>
          <h1>{state === "work-edit" ? "Edit work order" : "New work order"}</h1>
          <WorkOrderForm
            organizationId={ORG}
            workOrder={state === "work-edit" ? order(true) : undefined}
            options={{
              sites: [
                { value: "example-site-1", label: LONG_SITE, projectId: "example-job-1" },
                { value: "example-site-2", label: "AD07 example site", projectId: "example-job-1" },
              ],
              technicians: [
                { value: "example-tech", label: LONG_TECH },
                { value: "example-tech-2", label: "AD07 example technician" },
              ],
            }}
          />
        </section>
      ) : null}
      {state === "dispatch" || state === "dispatch-long" || state === "dispatch-empty" ? (
        <DispatchView
          context={dispatch}
          workOrders={state === "dispatch-empty" ? [] : schedule}
        />
      ) : null}
      {state === "dispatch-pending" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Dispatch</h1>
          <p role="status">Attention evaluation is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "dispatch-loading" ? (
        <section className={fieldStyles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading dispatch</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
      {state === "dispatch-query" ? (
        <section className={fieldStyles.statePanel}>
          <h1>Unable to load Dispatch</h1>
          <p role="alert">AD07 example query message</p>
        </section>
      ) : null}
      {state === "job-loading" ? (
        <section className={projectStyles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading projects</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
    </AppShellChrome>
  );
}
