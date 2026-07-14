import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  TaskHistoryReadEntry,
  TaskListItemReadModel,
  TaskReadModel,
} from "@/features/tasks/domain/read-types";
import type { Database } from "@/types/database";

export type TaskDisplayLabelBundle = {
  members: Record<string, string>;
  leads: Record<string, string>;
  customers: Record<string, string>;
  programs: Record<string, string>;
};

export type TaskLabelReferences = {
  memberIds: string[];
  leadIds: string[];
  customerIds: string[];
  programIds: string[];
};

const MEMBER_FALLBACK = "Team member";
const LEAD_FALLBACK = "Linked lead";
const CUSTOMER_FALLBACK = "Linked customer";
const PROGRAM_FALLBACK = "Linked program";
const ENROLLMENT_FALLBACK = "Enrollment";

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
    }
  }

  return {
    memberIds: uniqueIds(memberIds),
    leadIds: uniqueIds(leadIds),
    customerIds: uniqueIds(customerIds),
    programIds: uniqueIds(programIds),
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

  if (task.linkedContext.kind === "lead") {
    leadIds.push(task.linkedContext.leadId);
  } else if (task.linkedContext.kind === "customer") {
    customerIds.push(task.linkedContext.customerId);
  } else if (task.linkedContext.kind === "enrollment") {
    customerIds.push(task.linkedContext.customerId);
    programIds.push(task.linkedContext.programId);
  }

  return {
    memberIds: uniqueIds(memberIds),
    leadIds: uniqueIds(leadIds),
    customerIds: uniqueIds(customerIds),
    programIds: uniqueIds(programIds),
  };
}

export function emptyLabelBundle(): TaskDisplayLabelBundle {
  return { members: {}, leads: {}, customers: {}, programs: {} };
}

export async function resolveTaskDisplayLabels(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  references: TaskLabelReferences,
): Promise<TaskDisplayLabelBundle> {
  const bundle = emptyLabelBundle();

  if (references.memberIds.length > 0) {
    const { data: members } = await supabase
      .from("organization_members")
      .select("id, user_id")
      .eq("organization_id", organizationId)
      .in("id", references.memberIds);

    const userIds = uniqueIds((members ?? []).map((row) => row.user_id));
    const profileNames: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", userIds);

      for (const profile of profiles ?? []) {
        profileNames[profile.id] = normalizeLabel(profile.display_name, MEMBER_FALLBACK);
      }
    }

    for (const member of members ?? []) {
      bundle.members[member.id] = profileNames[member.user_id] ?? MEMBER_FALLBACK;
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

  return bundle;
}

export function resolveMemberLabel(
  memberId: string | null | undefined,
  labels: TaskDisplayLabelBundle,
): string {
  if (!memberId) {
    return "Unassigned";
  }
  return labels.members[memberId] ?? MEMBER_FALLBACK;
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
