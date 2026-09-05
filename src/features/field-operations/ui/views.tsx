import { AppShell, type AppShellActiveNav } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import type { FieldContextResult } from "@/features/field-operations/server/resolve-field-page-context";
import type {
  FieldPageContext,
  SiteRecord,
  WorkOrderRecord,
  WorkOrderStatus,
} from "@/features/field-operations/domain/types";
import {
  canAdministerField,
  canOperateField,
  WORK_ORDER_STATUSES,
  workOrderStatusLabel,
} from "@/features/field-operations/domain/types";
import {
  siteCreateHrefForProject,
  siteDetailHref,
  workOrderCreateHrefForSite,
  workOrderDetailHref,
} from "@/features/field-operations/domain/navigation";
import {
  DispatchAttentionAction,
  SiteArchiveAction,
  WorkOrderWorkflowActions,
} from "./workflow-actions";
import styles from "./field-operations.module.css";

export function FieldShell({
  context,
  activeNav,
  action,
  children,
}: {
  context: FieldPageContext;
  activeNav: Extract<AppShellActiveNav, "sites" | "workOrders" | "dispatch">;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <AppShell
      activeNav={activeNav}
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

export function FieldLoadFailure({
  result,
  activeNav,
  targetPath,
}: {
  result: Exclude<FieldContextResult, { kind: "ready" }>;
  activeNav: Extract<AppShellActiveNav, "sites" | "workOrders" | "dispatch">;
  targetPath: string;
}) {
  if (result.kind === "organization_required") {
    return (
      <AppShell activeNav={activeNav} organizationOptions={result.organizations}>
        <section className={styles.statePanel}>
          <h1>Select an organization</h1>
          <ul>{result.organizations.map((organization) => (
            <li key={organization.organizationId}>
              <a href={`${targetPath}?org=${encodeURIComponent(organization.organizationId)}`}>{organization.displayName}</a>
            </li>
          ))}</ul>
        </section>
      </AppShell>
    );
  }
  if (result.kind === "forbidden") {
    return (
      <AppShell activeNav={activeNav} moduleNavVisibility={result.moduleAccess.navVisibility} terminology={result.moduleAccess.terminology}>
        <section className={styles.statePanel}><h1>Access denied</h1><p>{result.message}</p></section>
      </AppShell>
    );
  }
  return (
    <AppShell activeNav={activeNav}>
      <section className={styles.statePanel}>
        <h1>{result.kind === "auth_required" ? "Sign in required" : "Field operations unavailable"}</h1>
        <p>{result.kind === "error" ? result.message : "No active organization is available."}</p>
      </section>
    </AppShell>
  );
}

function statusVariant(status: WorkOrderStatus) {
  if (status === "completed") return "success" as const;
  if (status === "cancelled") return "neutral" as const;
  if (status === "in_progress") return "info" as const;
  if (status === "scheduled") return "warning" as const;
  return "neutral" as const;
}

function dateTime(value: string | null): string {
  if (!value) return "Not scheduled";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function WorkOrderRows({
  workOrders,
  organizationId,
}: {
  workOrders: WorkOrderRecord[];
  organizationId: string;
}) {
  if (workOrders.length === 0) return <p className={styles.muted}>No work orders in this group.</p>;
  return (
    <ul className={styles.list}>
      {workOrders.map((workOrder) => (
        <li key={workOrder.id} className={styles.listItem}>
          <div>
            <h3><a href={workOrderDetailHref(workOrder.id, organizationId)}>{workOrder.title}</a></h3>
            <p className={styles.muted}>{workOrder.customerLabel} · {workOrder.projectLabel} · {workOrder.siteLabel}</p>
            <p>{dateTime(workOrder.scheduledFor)} · {workOrder.technicianLabel ?? "Unassigned"}</p>
          </div>
          <Badge variant={statusVariant(workOrder.status)}>{workOrderStatusLabel(workOrder.status)}</Badge>
        </li>
      ))}
    </ul>
  );
}

export function SitesList({ context, sites }: { context: FieldPageContext; sites: SiteRecord[] }) {
  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div><h1>{context.terminology.site.plural}</h1><p className={styles.muted}>Field locations for {context.organizationName}.</p></div>
        {canOperateField(context.role) ? <a className={styles.primaryButton} href={`/sites/new?org=${encodeURIComponent(context.organizationId)}`}>New site</a> : null}
      </header>
      {sites.length === 0 ? (
        <div className={styles.empty}><h2>No sites yet</h2><p>Create a site from a Job when field work has a location.</p></div>
      ) : (
        <ul className={styles.list}>{sites.map((site) => (
          <li key={site.id} className={styles.listItem}>
            <div>
              <h2><a href={siteDetailHref(site.id, context.organizationId)}>{site.name}</a></h2>
              <p>{site.addressLine1}, {site.postalCode} {site.city}</p>
              <p className={styles.muted}>{site.customerLabel} · {context.terminology.project.singular}: {site.projectLabel}</p>
            </div>
          </li>
        ))}</ul>
      )}
    </section>
  );
}

export function SiteDetail({
  context,
  site,
  workOrders,
  warning,
}: {
  context: FieldPageContext;
  site: SiteRecord;
  workOrders: WorkOrderRecord[];
  warning: string | null;
}) {
  const org = context.organizationId;
  return (
    <article className={styles.page}>
      <a href={`/sites?org=${encodeURIComponent(org)}`}>Back to sites</a>
      <header className={styles.pageHeader}>
        <div><h1>{site.name}</h1><p className={styles.muted}>{site.archivedAt ? "Archived" : "Active site"}</p></div>
        {canOperateField(context.role) && !site.archivedAt ? <a className={styles.secondaryButton} href={`/sites/${site.id}/edit?org=${encodeURIComponent(org)}`}>Edit site</a> : null}
      </header>
      <section className={styles.panel}>
        <dl className={styles.definitionList}>
          <div><dt>Customer</dt><dd><a href={`/customers/${site.customerId}?org=${encodeURIComponent(org)}`}>{site.customerLabel}</a></dd></div>
          <div><dt>{context.terminology.project.singular}</dt><dd><a href={`/projects/${site.projectId}?org=${encodeURIComponent(org)}`}>{site.projectLabel}</a></dd></div>
          <div><dt>Address</dt><dd>{site.addressLine1}{site.addressLine2 ? `, ${site.addressLine2}` : ""}, {site.postalCode} {site.city}, {site.country}</dd></div>
          <div><dt>Operational note</dt><dd>{site.operationalNote ?? "No note."}</dd></div>
        </dl>
      </section>
      {canAdministerField(context.role) ? <SiteArchiveAction organizationId={org} siteId={site.id} archived={Boolean(site.archivedAt)} /> : null}
      <section className={styles.panel}>
        <header className={styles.panelHeader}>
          <h2>{context.terminology.workOrder.plural}</h2>
          {canOperateField(context.role) && !site.archivedAt ? <a className={styles.primaryButton} href={workOrderCreateHrefForSite(site.id, org)}>New work order</a> : null}
        </header>
        {warning ? <p role="alert" className={styles.error}>{warning}</p> : <WorkOrderRows workOrders={workOrders} organizationId={org} />}
      </section>
    </article>
  );
}

export function WorkOrdersList({
  context,
  workOrders,
  status,
}: {
  context: FieldPageContext;
  workOrders: WorkOrderRecord[];
  status?: WorkOrderStatus;
}) {
  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div><h1>{context.terminology.workOrder.plural}</h1><p className={styles.muted}>Executable field work across Jobs and Sites.</p></div>
        {canOperateField(context.role) ? <a className={styles.primaryButton} href={`/work-orders/new?org=${encodeURIComponent(context.organizationId)}`}>New work order</a> : null}
      </header>
      <form action="/work-orders" className={styles.filters}>
        <input type="hidden" name="org" value={context.organizationId} />
        <label>Status<select name="status" defaultValue={status ?? ""}><option value="">All statuses</option>{WORK_ORDER_STATUSES.map((item) => <option key={item} value={item}>{workOrderStatusLabel(item)}</option>)}</select></label>
        <button>Apply</button>
      </form>
      <WorkOrderRows workOrders={workOrders} organizationId={context.organizationId} />
    </section>
  );
}

export function WorkOrderDetail({
  context,
  workOrder,
}: {
  context: FieldPageContext;
  workOrder: WorkOrderRecord;
}) {
  const org = context.organizationId;
  const canEdit = canOperateField(context.role) && !["completed", "cancelled"].includes(workOrder.status);
  return (
    <article className={styles.page}>
      <a href={`/work-orders?org=${encodeURIComponent(org)}`}>Back to work orders</a>
      <header className={styles.pageHeader}>
        <div><h1>{workOrder.title}</h1><Badge variant={statusVariant(workOrder.status)}>{workOrderStatusLabel(workOrder.status)}</Badge></div>
        {canEdit ? <a className={styles.secondaryButton} href={`/work-orders/${workOrder.id}/edit?org=${encodeURIComponent(org)}`}>Edit work order</a> : null}
      </header>
      <section className={styles.panel}>
        <dl className={styles.definitionList}>
          <div><dt>Customer</dt><dd><a href={`/customers/${workOrder.customerId}?org=${encodeURIComponent(org)}`}>{workOrder.customerLabel}</a></dd></div>
          <div><dt>{context.terminology.project.singular}</dt><dd><a href={`/projects/${workOrder.projectId}?org=${encodeURIComponent(org)}`}>{workOrder.projectLabel}</a></dd></div>
          <div><dt>{context.terminology.site.singular}</dt><dd><a href={siteDetailHref(workOrder.siteId, org)}>{workOrder.siteLabel}</a> · {workOrder.siteAddress}</dd></div>
          <div><dt>{context.terminology.technician.singular}</dt><dd>{workOrder.technicianLabel ?? "Unassigned"}</dd></div>
          <div><dt>Scheduled</dt><dd>{dateTime(workOrder.scheduledFor)}</dd></div>
          <div><dt>Completed</dt><dd>{workOrder.completedAt ? dateTime(workOrder.completedAt) : "Not completed"}</dd></div>
          <div><dt>Instructions</dt><dd>{workOrder.instructions ?? "No instructions."}</dd></div>
        </dl>
      </section>
      {canOperateField(context.role) ? (
        <WorkOrderWorkflowActions
          organizationId={org}
          workOrderId={workOrder.id}
          status={workOrder.status}
          canEvaluateAttention={canAdministerField(context.role) && context.moduleAccess.navVisibility.attention}
        />
      ) : null}
    </article>
  );
}

function sameLocalDay(value: string | null, offsetDays = 0): boolean {
  if (!value) return false;
  const target = new Date();
  target.setDate(target.getDate() + offsetDays);
  const date = new Date(value);
  return date.getFullYear() === target.getFullYear()
    && date.getMonth() === target.getMonth()
    && date.getDate() === target.getDate();
}

export function DispatchView({
  context,
  workOrders,
}: {
  context: FieldPageContext;
  workOrders: WorkOrderRecord[];
}) {
  const now = Date.now();
  const active = workOrders.filter((item) => !["completed", "cancelled"].includes(item.status));
  const overdue = active.filter((item) => item.status === "scheduled" && item.scheduledFor && new Date(item.scheduledFor).getTime() < now);
  const unassigned = active.filter((item) => !item.technicianMemberId);
  const today = active.filter((item) => sameLocalDay(item.scheduledFor));
  const upcoming = active.filter((item) => item.scheduledFor && new Date(item.scheduledFor).getTime() > now && !sameLocalDay(item.scheduledFor));
  const completed = workOrders.filter((item) => item.status === "completed");
  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <div><h1>Dispatch</h1><p className={styles.muted}>Lightweight schedule and technician assignment. No routing or optimization.</p></div>
        {canAdministerField(context.role) ? <DispatchAttentionAction organizationId={context.organizationId} /> : null}
      </header>
      <div className={styles.dispatchGrid}>
        <section className={styles.panel}><h2>Overdue <Badge variant="danger">{String(overdue.length)}</Badge></h2><WorkOrderRows workOrders={overdue} organizationId={context.organizationId} /></section>
        <section className={styles.panel}><h2>Unassigned <Badge variant="warning">{String(unassigned.length)}</Badge></h2><WorkOrderRows workOrders={unassigned} organizationId={context.organizationId} /></section>
        <section className={styles.panel}><h2>Today</h2><WorkOrderRows workOrders={today} organizationId={context.organizationId} /></section>
        <section className={styles.panel}><h2>Upcoming</h2><WorkOrderRows workOrders={upcoming} organizationId={context.organizationId} /></section>
        <section className={styles.panel}><h2>Completed</h2><WorkOrderRows workOrders={completed.slice(0, 20)} organizationId={context.organizationId} /></section>
      </div>
    </section>
  );
}

export function JobFieldSections({
  context,
  projectId,
  sites,
  workOrders,
}: {
  context: Omit<FieldPageContext, "moduleId">;
  projectId: string;
  sites: SiteRecord[];
  workOrders: WorkOrderRecord[];
}) {
  return (
    <div className={styles.dispatchGrid}>
      <section className={styles.panel}>
        <header className={styles.panelHeader}><h2>Sites</h2>{canOperateField(context.role) ? <a href={siteCreateHrefForProject(projectId, context.organizationId)}>New site</a> : null}</header>
        {sites.length ? <ul>{sites.map((site) => <li key={site.id}><a href={siteDetailHref(site.id, context.organizationId)}>{site.name}</a> · {site.city}</li>)}</ul> : <p className={styles.muted}>No sites are linked to this Job.</p>}
      </section>
      <section className={styles.panel}>
        <h2>Work orders</h2>
        <WorkOrderRows workOrders={workOrders} organizationId={context.organizationId} />
      </section>
    </div>
  );
}
