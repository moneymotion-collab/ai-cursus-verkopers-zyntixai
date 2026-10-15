import { AppShellChrome } from "@/components/app-shell-chrome";
import { buildOperatingModelProductModuleAccess } from "@/features/product-access/domain/operating-model-module-access";
import type { OperatingModelId } from "@/features/onboarding/domain/operating-model";
import { operatingModelNavVisibility } from "@/features/product-access/domain/operating-model-module-access";
import type { ProjectPageContext, ProjectRecord, ProjectTask } from "@/features/projects/domain/types";
import { ProjectForm } from "@/features/projects/ui/project-form";
import { ProjectDetail, ProjectList } from "@/features/projects/ui/project-views";
import styles from "@/features/projects/ui/projects.module.css";

const ORG = "11111111-1111-4111-8111-111111111111";
const LONG_NAME = "AD06 example project with a delivery name that wraps on a narrow screen";
const LONG_CLIENT = "AD06 example client with a long display name for a narrow screen";
const LONG_TASK = "AD06 example task title that wraps beside the project status on a narrow screen";

function contextFor(orgName: string, model: OperatingModelId): ProjectPageContext {
  const access = buildOperatingModelProductModuleAccess(model);
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

function project(long: boolean, archived = false): ProjectRecord {
  return {
    id: archived ? "example-project-archived" : "example-project-1",
    organizationId: ORG,
    customerId: "example-customer",
    customerLabel: long ? LONG_CLIENT : "AD06 example client",
    name: long ? LONG_NAME : "AD06 example project",
    summary: long
      ? "AD06 example summary that stays inside the project detail on a narrow screen."
      : "AD06 example summary",
    status: archived ? "completed" : "active",
    ownerMemberId: "example-owner",
    ownerLabel: long ? LONG_CLIENT : "AD06 example owner",
    plannedStart: "2026-10-01",
    plannedEnd: "2026-12-15",
    archivedAt: archived ? "2026-10-03T09:00:00.000Z" : null,
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-02T09:00:00.000Z",
  };
}

function tasks(long: boolean): ProjectTask[] {
  return [
    {
      id: "example-task-open",
      title: long ? LONG_TASK : "AD06 example follow-up",
      status: "open",
      dueAt: "2026-10-20T09:00:00.000Z",
    },
    {
      id: "example-task-done",
      title: "AD06 example completed task",
      status: "completed",
      dueAt: null,
    },
  ];
}

const options = {
  customers: [
    { value: "example-customer", label: LONG_CLIENT },
    { value: "example-customer-2", label: "AD06 example client" },
  ],
  members: [{ value: "example-owner", label: LONG_CLIENT }],
  warning: null,
};

export function Ad06RecordsPreview({
  state,
  orgName,
  model,
}: {
  state: string;
  orgName: string;
  model: OperatingModelId;
}) {
  const context = contextFor(orgName, model);
  const long = state.endsWith("long");
  const terms = context.terminology.project;

  return (
    <AppShellChrome
      activeNav="projects"
      moduleNavVisibility={operatingModelNavVisibility(model)}
      terminology={context.terminology}
      organizationOptions={context.organizationOptions}
      selectedOrganizationId={ORG}
      organizationSelectorAction="/ad02-preview"
      navigationPresentation={state === "project-loading" ? "pending" : "resolved"}
    >
      {state === "project-loading" ? (
        <section className={styles.statePanel} aria-live="polite" aria-busy="true">
          <h1>Loading projects</h1>
          <p>Please wait while the workspace is prepared.</p>
        </section>
      ) : null}
      {state === "project-error" ? (
        <section className={styles.statePanel}>
          <h1>Projects could not be loaded</h1>
          <p role="alert">An unexpected problem occurred. Your changes were not discarded.</p>
          <button className={styles.secondaryButton} type="button">Try again</button>
        </section>
      ) : null}
      {state === "project-query" ? (
        <section className={styles.statePanel}>
          <h1>Unable to load {terms.plural.toLowerCase()}</h1>
          <p role="alert">AD06 example query message</p>
          <a href="/ad02-preview?state=project-list&model=service">Try again</a>
        </section>
      ) : null}
      {state === "project-unavailable" ? (
        <section className={styles.statePanel}>
          <h1>{terms.singular} unavailable</h1>
          <p role="alert">This {terms.singular.toLowerCase()} is unavailable or you do not have access.</p>
          <a href="/ad02-preview?state=project-list&model=service">
            Back to {terms.plural.toLowerCase()}
          </a>
        </section>
      ) : null}
      {state === "project-list" || state === "project-long" || state === "project-empty" ? (
        <ProjectList
          context={context}
          projects={state === "project-empty" ? [] : [project(long), project(false, true)]}
          filters={{ search: "", archived: false }}
        />
      ) : null}
      {state === "project-detail" || state === "project-detail-long" ? (
        <ProjectDetail
          context={context}
          project={project(state.endsWith("long"))}
          tasks={tasks(state.endsWith("long"))}
          tasksWarning={null}
        />
      ) : null}
      {state === "project-detail-pending" ? (
        <section className={styles.statePanel}>
          <h1>{terms.singular}</h1>
          <p role="status">The project action is shown as pending. Static preview only. This does not submit a form.</p>
        </section>
      ) : null}
      {state === "project-restore" ? (
        <ProjectDetail
          context={context}
          project={project(true, true)}
          tasks={[]}
          tasksWarning={null}
        />
      ) : null}
      {state === "project-new" ? (
        <ProjectForm
          organizationId={ORG}
          options={options}
          terminology={context.terminology}
        />
      ) : null}
      {state === "project-new-errors" || state === "project-new-pending" ? (
        <section className={styles.statePanel}>
          <h1>New {terms.singular.toLowerCase()}</h1>
          <p role="status">
            {state.endsWith("pending")
              ? "Saving is shown as pending."
              : "Name is required. Customer is required."}{" "}
            Static preview only. This does not submit a form.
          </p>
        </section>
      ) : null}
      {state === "project-edit" ? (
        <ProjectForm
          organizationId={ORG}
          options={options}
          terminology={context.terminology}
          project={project(true)}
        />
      ) : null}
    </AppShellChrome>
  );
}
