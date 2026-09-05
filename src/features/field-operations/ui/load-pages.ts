import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FieldPageContext,
  SiteFormOptions,
  SiteRecord,
  WorkOrderFormOptions,
  WorkOrderRecord,
  WorkOrderStatus,
} from "@/features/field-operations/domain/types";
import {
  getSite,
  getWorkOrder,
  listSites,
  listWorkOrders,
  loadSiteFormOptions,
  loadWorkOrderFormOptions,
} from "@/features/field-operations/server/queries";
import {
  resolveFieldPageContext,
  type FieldContextResult,
} from "@/features/field-operations/server/resolve-field-page-context";
import type { Database } from "@/types/database";

type SearchParams = Record<string, string | string[] | undefined>;
type Failure = Exclude<FieldContextResult, { kind: "ready" }>;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export type SitesPageResult =
  | Failure
  | { kind: "query_error"; context: FieldPageContext; message: string }
  | { kind: "ready"; context: FieldPageContext; sites: SiteRecord[] };

export async function loadSitesPage(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<SitesPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "sites", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  const result = await listSites(supabase, resolved.context.organizationId);
  if (result.error) return { kind: "query_error", context: resolved.context, message: result.error };
  return { kind: "ready", context: resolved.context, sites: result.data };
}

export type SiteDetailPageResult =
  | Failure
  | { kind: "unavailable"; context: FieldPageContext }
  | { kind: "query_error"; context: FieldPageContext; message: string }
  | {
      kind: "ready";
      context: FieldPageContext;
      site: SiteRecord;
      workOrders: WorkOrderRecord[];
      warning: string | null;
    };

export async function loadSiteDetailPage(
  supabase: SupabaseClient<Database>,
  siteId: string,
  searchParams: SearchParams,
): Promise<SiteDetailPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "sites", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  if (!UUID.test(siteId)) return { kind: "unavailable", context: resolved.context };
  const site = await getSite(supabase, resolved.context.organizationId, siteId);
  if (site.error) return { kind: "query_error", context: resolved.context, message: site.error };
  if (!site.data) return { kind: "unavailable", context: resolved.context };
  const workOrders = await listWorkOrders(supabase, resolved.context.organizationId, { siteId });
  return {
    kind: "ready",
    context: resolved.context,
    site: site.data,
    workOrders: workOrders.data,
    warning: workOrders.error,
  };
}

export type SiteFormPageResult =
  | Failure
  | { kind: "unavailable" | "action_unavailable"; context: FieldPageContext; message?: string }
  | {
      kind: "ready";
      context: FieldPageContext;
      options: SiteFormOptions;
      site?: SiteRecord;
      initialProjectId?: string;
    };

export async function loadSiteCreatePage(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<SiteFormPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "sites", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  if (resolved.context.role === "viewer") {
    return { kind: "action_unavailable", context: resolved.context, message: "You cannot create sites." };
  }
  const options = await loadSiteFormOptions(supabase, resolved.context.organizationId);
  const requested = first(searchParams.projectId);
  return {
    kind: "ready",
    context: resolved.context,
    options,
    initialProjectId: options.projects.some((item) => item.value === requested) ? requested : undefined,
  };
}

export async function loadSiteEditPage(
  supabase: SupabaseClient<Database>,
  siteId: string,
  searchParams: SearchParams,
): Promise<SiteFormPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "sites", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  if (resolved.context.role === "viewer") {
    return { kind: "action_unavailable", context: resolved.context, message: "You cannot edit sites." };
  }
  const site = await getSite(supabase, resolved.context.organizationId, siteId);
  if (!site.data) return { kind: "unavailable", context: resolved.context, message: site.error ?? undefined };
  const options = await loadSiteFormOptions(supabase, resolved.context.organizationId);
  return { kind: "ready", context: resolved.context, options, site: site.data };
}

export type WorkOrdersPageResult =
  | Failure
  | { kind: "query_error"; context: FieldPageContext; message: string }
  | {
      kind: "ready";
      context: FieldPageContext;
      workOrders: WorkOrderRecord[];
      status?: WorkOrderStatus;
    };

export async function loadWorkOrdersPage(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<WorkOrdersPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "workOrders", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  const rawStatus = first(searchParams.status);
  const status = ["planned", "scheduled", "in_progress", "completed", "cancelled"].includes(rawStatus ?? "")
    ? rawStatus as WorkOrderStatus
    : undefined;
  const result = await listWorkOrders(supabase, resolved.context.organizationId, { status });
  if (result.error) return { kind: "query_error", context: resolved.context, message: result.error };
  return { kind: "ready", context: resolved.context, workOrders: result.data, status };
}

export type WorkOrderDetailPageResult =
  | Failure
  | { kind: "unavailable"; context: FieldPageContext }
  | { kind: "query_error"; context: FieldPageContext; message: string }
  | { kind: "ready"; context: FieldPageContext; workOrder: WorkOrderRecord };

export async function loadWorkOrderDetailPage(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
  searchParams: SearchParams,
): Promise<WorkOrderDetailPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "workOrders", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  if (!UUID.test(workOrderId)) return { kind: "unavailable", context: resolved.context };
  const workOrder = await getWorkOrder(supabase, resolved.context.organizationId, workOrderId);
  if (workOrder.error) return { kind: "query_error", context: resolved.context, message: workOrder.error };
  if (!workOrder.data) return { kind: "unavailable", context: resolved.context };
  return { kind: "ready", context: resolved.context, workOrder: workOrder.data };
}

export type WorkOrderFormPageResult =
  | Failure
  | { kind: "unavailable" | "action_unavailable"; context: FieldPageContext; message?: string }
  | {
      kind: "ready";
      context: FieldPageContext;
      options: WorkOrderFormOptions;
      workOrder?: WorkOrderRecord;
      initialSiteId?: string;
    };

export async function loadWorkOrderCreatePage(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<WorkOrderFormPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "workOrders", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  if (resolved.context.role === "viewer") {
    return { kind: "action_unavailable", context: resolved.context, message: "You cannot create work orders." };
  }
  const options = await loadWorkOrderFormOptions(supabase, resolved.context.organizationId);
  const requested = first(searchParams.siteId);
  return {
    kind: "ready",
    context: resolved.context,
    options,
    initialSiteId: options.sites.some((item) => item.value === requested) ? requested : undefined,
  };
}

export async function loadWorkOrderEditPage(
  supabase: SupabaseClient<Database>,
  workOrderId: string,
  searchParams: SearchParams,
): Promise<WorkOrderFormPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "workOrders", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  if (resolved.context.role === "viewer") {
    return { kind: "action_unavailable", context: resolved.context, message: "You cannot edit work orders." };
  }
  const workOrder = await getWorkOrder(supabase, resolved.context.organizationId, workOrderId);
  if (!workOrder.data) return { kind: "unavailable", context: resolved.context, message: workOrder.error ?? undefined };
  const options = await loadWorkOrderFormOptions(supabase, resolved.context.organizationId);
  return { kind: "ready", context: resolved.context, options, workOrder: workOrder.data };
}

export async function loadDispatchPage(
  supabase: SupabaseClient<Database>,
  searchParams: SearchParams,
): Promise<WorkOrdersPageResult> {
  const resolved = await resolveFieldPageContext(supabase, "dispatch", first(searchParams.org));
  if (resolved.kind !== "ready") return resolved;
  const result = await listWorkOrders(supabase, resolved.context.organizationId);
  if (result.error) return { kind: "query_error", context: resolved.context, message: result.error };
  return { kind: "ready", context: resolved.context, workOrders: result.data };
}
