import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  ProjectFormOptions,
  ProjectRecord,
  ProjectRole,
  ProjectStatus,
  ProjectTask,
} from "@/features/projects/domain/types";
import {
  listOrganizationMemberLabels,
  memberLabelMap,
} from "@/features/tasks/server/list-organization-member-labels";
import type { Database } from "@/types/database";

type ProjectRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  name: string;
  summary: string | null;
  status: ProjectStatus;
  owner_member_id: string | null;
  planned_start: string | null;
  planned_end: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

const PROJECT_COLUMNS =
  "id, organization_id, customer_id, name, summary, status, owner_member_id, planned_start, planned_end, archived_at, created_at, updated_at";

function label(value: string | null | undefined, fallback: string): string {
  return value?.trim() || fallback;
}

async function hydrateProjects(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  rows: ProjectRow[],
): Promise<ProjectRecord[]> {
  const customerIds = [...new Set(rows.map((row) => row.customer_id))];
  const ownerIds = [
    ...new Set(rows.map((row) => row.owner_member_id).filter((id): id is string => Boolean(id))),
  ];

  const [customersResult, memberLabels] = await Promise.all([
    customerIds.length
      ? supabase
          .from("customers")
          .select("id, display_name")
          .eq("organization_id", organizationId)
          .in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),
    listOrganizationMemberLabels(supabase, organizationId, ownerIds),
  ]);
  const customerLabels = Object.fromEntries(
    (customersResult.data ?? []).map((customer) => [
      customer.id,
      label(customer.display_name, "Unnamed customer"),
    ]),
  );
  const ownerLabels = memberLabelMap(memberLabels);

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    customerId: row.customer_id,
    customerLabel: customerLabels[row.customer_id] ?? "Unavailable customer",
    name: row.name,
    summary: row.summary,
    status: row.status,
    ownerMemberId: row.owner_member_id,
    ownerLabel: row.owner_member_id
      ? ownerLabels[row.owner_member_id] ?? "Team member"
      : null,
    plannedStart: row.planned_start,
    plannedEnd: row.planned_end,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function listProjects(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  role: ProjectRole,
  filters: { search?: string; status?: ProjectStatus; archived?: boolean },
): Promise<{ data: ProjectRecord[]; error: string | null }> {
  let query = supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("organization_id", organizationId);

  if (filters.archived && (role === "owner" || role === "admin")) {
    query = query.not("archived_at", "is", null);
  } else query = query.is("archived_at", null);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.search?.trim()) {
    const escaped = filters.search.trim().replace(/[%_\\]/g, "\\$&");
    query = query.ilike("name", `%${escaped}%`);
  }

  const { data, error } = await query
    .order("updated_at", { ascending: false })
    .limit(100);
  if (error) return { data: [], error: "Unable to load projects. Please try again." };

  return {
    data: await hydrateProjects(supabase, organizationId, (data ?? []) as ProjectRow[]),
    error: null,
  };
}

export async function listProjectsForCustomer(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  customerId: string,
  options: { limit?: number } = {},
): Promise<{ data: ProjectRecord[]; error: string | null }> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("customer_id", customerId)
    .is("archived_at", null)
    .order("updated_at", { ascending: false })
    .limit(options.limit ?? 10);
  if (error) return { data: [], error: "Related projects could not be loaded." };

  return {
    data: await hydrateProjects(supabase, organizationId, (data ?? []) as ProjectRow[]),
    error: null,
  };
}

export async function getProject(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  projectId: string,
  role: ProjectRole,
): Promise<{ data: ProjectRecord | null; error: string | null }> {
  const { data, error } = await supabase
    .from("projects")
    .select(PROJECT_COLUMNS)
    .eq("organization_id", organizationId)
    .eq("id", projectId)
    .maybeSingle();
  if (error) return { data: null, error: "Unable to load this project." };
  if (!data) return { data: null, error: null };

  const row = data as ProjectRow;
  if (role === "viewer" && (row.status !== "active" || row.archived_at)) {
    return { data: null, error: null };
  }
  if (row.archived_at && role !== "owner" && role !== "admin") {
    return { data: null, error: null };
  }

  const [project] = await hydrateProjects(supabase, organizationId, [row]);
  return { data: project, error: null };
}

export async function listProjectTasks(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  projectId: string,
): Promise<{ data: ProjectTask[]; error: string | null }> {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, due_at")
    .eq("organization_id", organizationId)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return { data: [], error: "Related tasks could not be loaded." };
  return {
    data: (data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      status: String(row.status),
      dueAt: typeof row.due_at === "string" ? row.due_at : null,
    })),
    error: null,
  };
}

export async function loadProjectFormOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ProjectFormOptions> {
  const [customers, members] = await Promise.all([
    supabase
      .from("customers")
      .select("id, display_name")
      .eq("organization_id", organizationId)
      .is("archived_at", null)
      .order("display_name", { ascending: true })
      .limit(200),
    listOrganizationMemberLabels(supabase, organizationId),
  ]);
  return {
    customers: (customers.data ?? []).map((customer) => ({
      value: customer.id,
      label: label(customer.display_name, "Unnamed customer"),
    })),
    members: members.map((member) => ({ value: member.membershipId, label: member.label })),
    warning: customers.error
      ? "Customer options could not be loaded. Refresh before continuing."
      : null,
  };
}
