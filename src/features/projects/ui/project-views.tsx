import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import type { ProjectContextResult } from "@/features/projects/server/resolve-project-page-context";
import type {
  ProjectPageContext,
  ProjectRecord,
  ProjectStatus,
  ProjectTask,
} from "@/features/projects/domain/types";
import {
  projectPermissions,
  projectStatusLabel,
  PROJECT_STATUSES,
} from "@/features/projects/domain/types";
import { buildProjectDetailHref } from "@/features/projects/domain/projects-navigation";
import { ProjectActions } from "@/features/projects/ui/project-actions";
import { buildTaskCreateHrefForProject } from "@/features/tasks/ui/task-navigation";
import { AttentionEvaluateProjectRulesActions } from "@/features/attention/ui/attention-evaluate-project-rules-actions";
import styles from "./projects.module.css";

export function ProjectShell({
  context,
  action,
  children,
}: {
  context: ProjectPageContext;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      activeNav="projects"
      organizationOptions={context.organizationOptions}
      selectedOrganizationId={context.organizationId}
      organizationSelectorAction={action}
      moduleNavVisibility={context.moduleAccess.navVisibility}
      terminology={context.terminology}
    >
      {children}
    </AppShell>
  );
}

export function ProjectLoadFailure({
  result,
  targetPath,
}: {
  result: Exclude<ProjectContextResult, { kind: "ready" }>;
  targetPath: string;
}) {
  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav="projects" organizationOptions={result.organizations}>
        <section className={styles.statePanel}>
          <h1>Select an organization</h1>
          <p>Choose an organization to continue.</p>
          <ul>
            {result.organizations.map((organization) => (
              <li key={organization.organizationId}>
                <a href={`${targetPath}?org=${encodeURIComponent(organization.organizationId)}`}>
                  {organization.displayName}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </AppShell>
    );
  }
  if (result.kind === "forbidden") {
    return (
      <AppShell
        activeNav="projects"
        moduleNavVisibility={result.moduleAccess.navVisibility}
        terminology={result.moduleAccess.terminology}
      >
        <section className={styles.statePanel}>
          <h1>Access denied</h1>
          <p>{result.message}</p>
        </section>
      </AppShell>
    );
  }
  return (
    <AppShell activeNav="projects">
      <section className={styles.statePanel}>
        <h1>{result.kind === "auth_required" ? "Sign in required" : "Projects unavailable"}</h1>
        <p>
          {result.kind === "auth_required"
            ? "Sign in to continue."
            : result.kind === "error"
              ? result.message
              : "No active organization membership is available."}
        </p>
      </section>
    </AppShell>
  );
}

function dateLabel(date: string | null): string {
  if (!date) return "Not set";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${date}T00:00:00Z`),
  );
}

function statusVariant(
  status: ProjectStatus,
): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "active") return "success";
  if (status === "on_hold") return "warning";
  if (status === "completed") return "info";
  if (status === "cancelled") return "danger";
  return "neutral";
}

export function ProjectList({
  context,
  projects,
  filters,
}: {
  context: ProjectPageContext;
  projects: ProjectRecord[];
  filters: { search: string; status?: ProjectStatus; archived: boolean };
}) {
  const terms = context.terminology.project;
  const permissions = projectPermissions(context.role);
  const clearHref = `/projects?org=${encodeURIComponent(context.organizationId)}`;

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>{terms.plural}</h1>
          <p className={styles.muted}>Delivery work for {context.organizationName}.</p>
        </div>
        {permissions.canCreate ? (
          <a className={styles.primaryButton} href={`/projects/new?org=${encodeURIComponent(context.organizationId)}`}>
            New {terms.singular.toLowerCase()}
          </a>
        ) : null}
      </header>

      <form className={styles.filters} action="/projects" method="get" aria-label={`${terms.plural} filters`}>
        <input type="hidden" name="org" value={context.organizationId} />
        <label>
          Search
          <input name="q" type="search" defaultValue={filters.search} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={filters.status ?? ""}>
            <option value="">All statuses</option>
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>{projectStatusLabel(status)}</option>
            ))}
          </select>
        </label>
        {permissions.canViewArchived ? (
          <label className={styles.checkbox}>
            <input name="archived" type="checkbox" value="1" defaultChecked={filters.archived} />
            Archived only
          </label>
        ) : null}
        <button className={styles.secondaryButton}>Apply filters</button>
        {(filters.search || filters.status || filters.archived) ? <a href={clearHref}>Clear</a> : null}
      </form>

      {projects.length === 0 ? (
        <div className={styles.empty} role="status">
          <h2>No {terms.plural.toLowerCase()} found</h2>
          <p>{filters.search || filters.status || filters.archived ? "Try clearing the filters." : `Create your first ${terms.singular.toLowerCase()} when work is ready to plan.`}</p>
        </div>
      ) : (
        <>
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>{terms.singular}</th><th>{context.terminology.customer.singular}</th><th>Owner</th><th>Status</th><th>Planned dates</th></tr></thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id}>
                    <td><a href={buildProjectDetailHref(project.id, context.organizationId)}>{project.name}</a>{project.archivedAt ? " (Archived)" : ""}</td>
                    <td>{project.customerLabel}</td>
                    <td>{project.ownerLabel ?? "Unassigned"}</td>
                    <td><Badge variant={statusVariant(project.status)}>{projectStatusLabel(project.status)}</Badge></td>
                    <td>{dateLabel(project.plannedStart)} – {dateLabel(project.plannedEnd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className={styles.cards}>
            {projects.map((project) => (
              <li key={project.id} className={styles.card}>
                <h2><a href={buildProjectDetailHref(project.id, context.organizationId)}>{project.name}</a></h2>
                <p><Badge variant={statusVariant(project.status)}>{projectStatusLabel(project.status)}</Badge>{project.archivedAt ? " · Archived" : ""}</p>
                <dl>
                  <div><dt>{context.terminology.customer.singular}</dt><dd>{project.customerLabel}</dd></div>
                  <div><dt>Owner</dt><dd>{project.ownerLabel ?? "Unassigned"}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function taskStatusVariant(status: string): "neutral" | "success" | "warning" | "danger" | "info" {
  if (status === "completed") return "success";
  if (status === "cancelled") return "neutral";
  return "info";
}

function isTaskOverdue(task: ProjectTask): boolean {
  if (task.status !== "open" || !task.dueAt) return false;
  return new Date(task.dueAt).getTime() < Date.now();
}

export function ProjectDetail({
  context,
  project,
  tasks,
  tasksWarning,
}: {
  context: ProjectPageContext;
  project: ProjectRecord;
  tasks: ProjectTask[];
  tasksWarning: string | null;
}) {
  const term = context.terminology.project.singular;
  const permissions = projectPermissions(context.role, Boolean(project.archivedAt));
  const org = encodeURIComponent(context.organizationId);
  const outstandingCount = tasks.filter((task) => task.status === "open").length;
  const completedCount = tasks.filter((task) => task.status === "completed").length;
  const overdueCount = tasks.filter(isTaskOverdue).length;
  const canCreateTask = permissions.canUpdate;
  const canEvaluateAttention =
    (context.role === "owner" || context.role === "admin") &&
    context.moduleAccess.navVisibility.attention;
  return (
    <article className={styles.page}>
      <a className={styles.backLink} href={`/projects?org=${org}`}>Back to {context.terminology.project.plural.toLowerCase()}</a>
      <header className={styles.detailHeader}>
        <div>
          <h1>{project.name}</h1>
          <p className={styles.muted}><Badge variant={statusVariant(project.status)}>{projectStatusLabel(project.status)}</Badge>{project.archivedAt ? " · Archived" : ""}</p>
        </div>
        {permissions.canUpdate ? <a className={styles.secondaryButton} href={`/projects/${project.id}/edit?org=${org}`}>Edit {term.toLowerCase()}</a> : null}
      </header>
      <div className={styles.detailGrid}>
        <section className={styles.panel}>
          <h2>{term} details</h2>
          <dl className={styles.definitionList}>
            <div>
              <dt>{context.terminology.customer.singular}</dt>
              <dd><a href={`/customers/${project.customerId}?org=${org}`}>{project.customerLabel}</a></dd>
            </div>
            <div><dt>Owner</dt><dd>{project.ownerLabel ?? "Unassigned"}</dd></div>
            <div><dt>Planned start</dt><dd>{dateLabel(project.plannedStart)}</dd></div>
            <div><dt>Planned end</dt><dd>{dateLabel(project.plannedEnd)}</dd></div>
            <div><dt>Summary</dt><dd>{project.summary ?? "No summary provided."}</dd></div>
          </dl>
        </section>
        <ProjectActions
          organizationId={context.organizationId}
          projectId={project.id}
          status={project.status}
          permissions={permissions}
          singular={term}
        />
      </div>
      {canEvaluateAttention ? (
        <AttentionEvaluateProjectRulesActions
          organizationId={context.organizationId}
          projectId={project.id}
          returnPath={buildProjectDetailHref(project.id, context.organizationId)}
          heading={`Refresh ${term.toLowerCase()} Attention`}
          buttonLabel={`Evaluate ${term.toLowerCase()} Attention`}
        />
      ) : null}
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <h2>Related tasks</h2>
          {canCreateTask ? (
            <a
              className={styles.secondaryButton}
              href={buildTaskCreateHrefForProject(project.id, context.organizationId)}
            >
              New task
            </a>
          ) : null}
        </header>
        {tasksWarning ? <p className={styles.warning} role="alert">{tasksWarning}</p> : null}
        {!tasksWarning && tasks.length === 0 ? (
          <p className={styles.muted}>No tasks are linked to this {term.toLowerCase()}.</p>
        ) : null}
        {tasks.length ? (
          <>
            <p className={styles.muted} data-testid="project-task-summary">
              {outstandingCount} outstanding · {completedCount} completed
              {overdueCount > 0 ? ` · ${overdueCount} overdue` : ""}
            </p>
            <ul className={styles.taskList}>
              {tasks.map((task) => (
                <li key={task.id}>
                  <a href={`/tasks/${task.id}?org=${org}`}>{task.title}</a>
                  <span>
                    <Badge variant={taskStatusVariant(task.status)}>{task.status}</Badge>
                    {task.dueAt ? ` · Due ${new Date(task.dueAt).toLocaleDateString()}` : ""}
                    {isTaskOverdue(task) ? " · Overdue" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </article>
  );
}
