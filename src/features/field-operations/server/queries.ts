import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SiteFormOptions,
  SiteRecord,
  WorkOrderFormOptions,
  WorkOrderRecord,
  WorkOrderStatus,
} from "@/features/field-operations/domain/types";
import {
  listOrganizationMemberLabels,
  memberLabelMap,
} from "@/features/tasks/server/list-organization-member-labels";
import type { Database } from "@/types/database";

const SITE_COLUMNS =
  "id, organization_id, customer_id, project_id, name, address_line_1, address_line_2, postal_code, city, country, operational_note, archived_at, created_at, updated_at";
const WORK_ORDER_COLUMNS =
  "id, organization_id, project_id, site_id, title, instructions, technician_member_id, scheduled_for, status, completed_at, created_at, updated_at";

type SiteRow = Database["public"]["Tables"]["sites"]["Row"];
type WorkOrderRow = Database["public"]["Tables"]["work_orders"]["Row"];

async function hydrateSites(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  rows: SiteRow[],
): Promise<SiteRecord[]> {
  if (rows.length === 0) return [];
  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const projectIds = [...new Set(rows.map((row) => row.project_id))];
  const [customers, projects] = await Promise.all([
    customerIds.length
      ? supabase.from("customers").select("id, display_name").eq("organization_id", organizationId).in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    projectIds.length
      ? supabase.from("projects").select("id, name").eq("organization_id", organizationId).in("id", projectIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const customerLabels = Object.fromEntries((customers.data ?? []).map((row) => [row.id, row.display_name]));
  const projectLabels = Object.fromEntries((projects.data ?? []).map((row) => [row.id, row.name]));
  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    customerLabel: customerLabels[row.customer_id]?.trim() || "Unavailable customer",
    projectId: row.project_id,
    projectLabel: projectLabels[row.project_id]?.trim() || "Unavailable job",
    name: row.name,
    addressLine1: row.address_line_1,
    addressLine2: row.address_line_2,
    postalCode: row.postal_code,
    city: row.city,
    country: row.country,
    operationalNote: row.operational_note,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

async function hydrateWorkOrders(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  rows: WorkOrderRow[],
): Promise<WorkOrderRecord[]> {
  if (rows.length === 0) return [];
  const projectIds = [...new Set(rows.map((row) => row.project_id))];
  const siteIds = [...new Set(rows.map((row) => row.site_id))];
  const technicianIds = [
    ...new Set(rows.map((row) => row.technician_member_id).filter((id): id is string => Boolean(id))),
  ];
  const [projects, sites, members] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, customer_id")
      .eq("organization_id", organizationId)
      .in("id", projectIds),
    supabase
      .from("sites")
      .select("id, name, address_line_1, postal_code, city")
      .eq("organization_id", organizationId)
      .in("id", siteIds),
    listOrganizationMemberLabels(supabase, organizationId, technicianIds),
  ]);
  const customerIds = [...new Set((projects.data ?? []).map((row) => row.customer_id))];
  const customers = customerIds.length
    ? await supabase.from("customers").select("id, display_name").eq("organization_id", organizationId).in("id", customerIds)
    : { data: [], error: null };
  const projectMap = Object.fromEntries((projects.data ?? []).map((row) => [row.id, row]));
  const siteMap = Object.fromEntries((sites.data ?? []).map((row) => [row.id, row]));
  const customerMap = Object.fromEntries((customers.data ?? []).map((row) => [row.id, row.display_name]));
  const memberMap = memberLabelMap(members);

  return rows.map((row) => {
    const project = projectMap[row.project_id];
    const site = siteMap[row.site_id];
    return {
      id: row.id,
      organizationId: row.organization_id,
      projectId: row.project_id,
      projectLabel: project?.name?.trim() || "Unavailable job",
      customerId: project?.customer_id || "",
      customerLabel: customerMap[project?.customer_id ?? ""]?.trim() || "Unavailable customer",
      siteId: row.site_id,
      siteLabel: site?.name?.trim() || "Unavailable site",
      siteAddress: site
        ? `${site.address_line_1}, ${site.postal_code} ${site.city}`
        : "Address unavailable",
      title: row.title,
      instructions: row.instructions,
      technicianMemberId: row.technician_member_id,
      technicianLabel: row.technician_member_id
        ? memberMap[row.technician_member_id] ?? "Team member"
        : null,
      scheduledFor: row.scheduled_for,
      status: row.status as WorkOrderStatus,
      completedAt: row.completed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  });
}

export async function listSites(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  filters: { projectId?: string; archived?: boolean } = {},
) {
  let query = supabase.from("sites").select(SITE_COLUMNS).eq("organization_id", organizationId);
  query = filters.archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  const { data, error } = await query.order("updated_at", { ascending: false }).limit(100);
  if (error) return { data: [] as SiteRecord[], error: "Unable to load sites." };
  return { data: await hydrateSites(supabase, organizationId, (data ?? []) as SiteRow[]), error: null };
}

export async function getSite(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  siteId: string,
) {
  const { data, error } = await supabase
    .from("sites")
    .select(SITE_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", siteId)
    .maybeSingle();
  if (error) return { data: null, error: "Unable to load this site." };
  if (!data) return { data: null, error: null };
  const [site] = await hydrateSites(supabase, organizationId, [data as SiteRow]);
  return { data: site, error: null };
}

export async function listWorkOrders(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  filters: { projectId?: string; siteId?: string; status?: WorkOrderStatus } = {},
) {
  let query = supabase.from("work_orders").select(WORK_ORDER_COLUMNS).eq("organization_id", organizationId);
  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.siteId) query = query.eq("site_id", filters.siteId);
  if (filters.status) query = query.eq("status", filters.status);
  const { data, error } = await query
    .order("scheduled_for", { ascending: true, nullsFirst: false })
    .limit(200);
  if (error) return { data: [] as WorkOrderRecord[], error: "Unable to load work orders." };
  return {
    data: await hydrateWorkOrders(supabase, organizationId, (data ?? []) as WorkOrderRow[]),
    error: null,
  };
}

export async function getWorkOrder(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  workOrderId: string,
) {
  const { data, error } = await supabase
    .from("work_orders")
    .select(WORK_ORDER_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", workOrderId)
    .maybeSingle();
  if (error) return { data: null, error: "Unable to load this work order." };
  if (!data) return { data: null, error: null };
  const [workOrder] = await hydrateWorkOrders(supabase, organizationId, [data as WorkOrderRow]);
  return { data: workOrder, error: null };
}

export async function loadSiteFormOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<SiteFormOptions> {
  const { data } = await supabase
    .from("projects")
    .select("id, name, customer_id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("name");
  return {
    projects: (data ?? []).map((row) => ({
      value: row.id,
      label: row.name,
      customerId: row.customer_id,
    })),
  };
}

export async function loadWorkOrderFormOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<WorkOrderFormOptions> {
  const [sites, technicians] = await Promise.all([
    supabase
      .from("sites")
      .select("id, name, project_id")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("name"),
    listOrganizationMemberLabels(supabase, organizationId),
  ]);
  return {
    sites: (sites.data ?? []).map((row) => ({
      value: row.id,
      label: row.name,
      projectId: row.project_id,
    })),
    technicians: technicians.map((member) => ({
      value: member.membershipId,
      label: member.label,
    })),
  };
}
