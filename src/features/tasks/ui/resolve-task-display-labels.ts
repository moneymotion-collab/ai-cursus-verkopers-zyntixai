import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TaskHistoryReadEntry,
  TaskListItemReadModel,
  TaskReadModel,
} from "@/features/tasks/domain/read-types";
import type { Database } from "@/types/database";
import { MEMBER_DISPLAY_FALLBACK_LABEL } from "@/features/tasks/domain/member-display-label";
import {
  listOrganizationMemberLabels,
  memberLabelMap,
} from "@/features/tasks/server/list-organization-member-labels";

export type TaskDisplayLabelBundle = {
  members: Record<string, string>;
  leads: Record<string, string>;
  customers: Record<string, string>;
  programs: Record<string, string>;
  projects?: Record<string, string>;
};

export type TaskLabelReferences = {
  memberIds: string[];
  leadIds: string[];
  customerIds: string[];
  programIds: string[];
  projectIds?: string[];
};

const LEAD_FALLBACK = "Linked lead";
const CUSTOMER_FALLBACK = "Linked customer";
const PROGRAM_FALLBACK = "Linked program";
const ENROLLMENT_FALLBACK = "Enrollment";
const PROJECT_FALLBACK = "Linked project";

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function collectLabelReferencesFromListItems(
  tasks: TaskListItemReadModel[],
): TaskLabelReferences {
  const memberIds: string[] = [];
  const leadIds: string[] = [];
  const customerIds: string[] = [];
  const programIds: string[] = [];
  const projectIds: string[] = [];

  for (const task of tasks) {
    if (task.assigneeMemberId) {
      memberIds.push(task.assigneeMemberId);
    }

    if (task.linkedContext.kind === "lead") {
      leadIds.push(task.linkedContext.leadId);
    } else if (task.linkedContext.kind === "customer") {
      customerIds.push(task.linkedContext.customerId);
    } else if (task.linkedContext.kind === "enrollment") {
      customerIds.push(task.linkedContext.customerId);
      programIds.push(task.linkedContext.programId);
    } else if (task.linkedContext.kind === "project") {
      projectIds.push(task.linkedContext.projectId);
    }
  }

  return {
    memberIds: uniqueIds(memberIds),
    leadIds: uniqueIds(leadIds),
    customerIds: uniqueIds(customerIds),
    programIds: uniqueIds(programIds),
    projectIds: uniqueIds(projectIds),
  };
}

export function collectLabelReferencesFromTaskDetail(
  task: TaskReadModel,
  history: TaskHistoryReadEntry[],
): TaskLabelReferences {
  const memberIds = [
    task.assigneeMemberId,
    task.createdByMemberId,
    ...history.map((entry) => entry.changedByMemberId),
  ];

  const leadIds: string[] = [];
  const customerIds: string[] = [];
  const programIds: string[] = [];
  const projectIds: string[] = [];

  if (task.linkedContext.kind === "lead") {
    leadIds.push(task.linkedContext.leadId);
  } else if (task.linkedContext.kind === "customer") {
    customerIds.push(task.linkedContext.customerId);
  } else if (task.linkedContext.kind === "enrollment") {
    customerIds.push(task.linkedContext.customerId);
    programIds.push(task.linkedContext.programId);
  } else if (task.linkedContext.kind === "project") {
    projectIds.push(task.linkedContext.projectId);
  }

  return {
    memberIds: uniqueIds(memberIds),
    leadIds: uniqueIds(leadIds),
    customerIds: uniqueIds(customerIds),
    programIds: uniqueIds(programIds),
    projectIds: uniqueIds(projectIds),
  };
}

export function emptyLabelBundle(): TaskDisplayLabelBundle {
  return { members: {}, leads: {}, customers: {}, programs: {}, projects: {} };
}

export async function resolveTaskDisplayLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  references: TaskLabelReferences,
): Promise<TaskDisplayLabelBundle> {
  const bundle = emptyLabelBundle();

  if (references.memberIds.length > 0) {
    const labels = memberLabelMap(
      await listOrganizationMemberLabels(
        supabase,
        organizationId,
        references.memberIds,
      ),
    );
    for (const memberId of references.memberIds) {
      bundle.members[memberId] = labels[memberId] ?? MEMBER_DISPLAY_FALLBACK_LABEL;
    }
  }

  if (references.leadIds.length > 0) {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, display_name")
      .eq("organization_id", organizationId)
      .in("id", references.leadIds);

    for (const lead of leads ?? []) {
      bundle.leads[lead.id] = normalizeLabel(lead.display_name, LEAD_FALLBACK);
    }
  }

  if (references.customerIds.length > 0) {
    const { data: customers } = await supabase
      .from("customers")
      .select("id, display_name")
      .eq("organization_id", organizationId)
      .in("id", references.customerIds);

    for (const customer of customers ?? []) {
      bundle.customers[customer.id] = normalizeLabel(customer.display_name, CUSTOMER_FALLBACK);
    }
  }

  if (references.programIds.length > 0) {
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", references.programIds);

    for (const program of programs ?? []) {
      bundle.programs[program.id] = normalizeLabel(program.name, PROGRAM_FALLBACK);
    }
  }

  const projectIds = references.projectIds ?? [];
  if (projectIds.length > 0) {
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", projectIds);

    for (const project of projects ?? []) {
      if (bundle.projects) {
        bundle.projects[project.id] = normalizeLabel(project.name, PROJECT_FALLBACK);
      }
    }
  }

  return bundle;
}

export function resolveMemberLabel(
  memberId: string | null | undefined,
  labels: TaskDisplayLabelBundle,
): string {
  if (!memberId) {
    return "Unassigned";
  }
  return labels.members[memberId] ?? MEMBER_DISPLAY_FALLBACK_LABEL;
}

export function resolveLinkedContextLabel(
  linkedContext: TaskListItemReadModel["linkedContext"] | TaskReadModel["linkedContext"],
  labels: TaskDisplayLabelBundle,
): string {
  if (linkedContext.kind === "lead") {
    return labels.leads[linkedContext.leadId] ?? LEAD_FALLBACK;
  }
  if (linkedContext.kind === "customer") {
    return labels.customers[linkedContext.customerId] ?? CUSTOMER_FALLBACK;
  }
  if (linkedContext.kind === "project") {
    return labels.projects?.[linkedContext.projectId] ?? PROJECT_FALLBACK;
  }

  const customer = labels.customers[linkedContext.customerId] ?? CUSTOMER_FALLBACK;
  const program = labels.programs[linkedContext.programId] ?? PROGRAM_FALLBACK;
  if (customer === CUSTOMER_FALLBACK && program === PROGRAM_FALLBACK) {
    return ENROLLMENT_FALLBACK;
  }
  return `${customer} · ${program}`;
}

export function resolveLeadLabel(leadId: string | undefined, labels: TaskDisplayLabelBundle): string | undefined {
  if (!leadId) return undefined;
  return labels.leads[leadId] ?? LEAD_FALLBACK;
}

export function resolveCustomerLabel(
  customerId: string | undefined,
  labels: TaskDisplayLabelBundle,
): string | undefined {
  if (!customerId) return undefined;
  return labels.customers[customerId] ?? CUSTOMER_FALLBACK;
}

export function resolveProgramLabel(
  programId: string | undefined,
  labels: TaskDisplayLabelBundle,
): string | undefined {
  if (!programId) return undefined;
  return labels.programs[programId] ?? PROGRAM_FALLBACK;
}

export function resolveProjectLabel(
  projectId: string | undefined,
  labels: TaskDisplayLabelBundle,
): string | undefined {
  if (!projectId) return undefined;
  return labels.projects?.[projectId] ?? PROJECT_FALLBACK;
}
