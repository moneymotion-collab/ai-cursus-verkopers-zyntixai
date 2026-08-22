import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { MEMBER_DISPLAY_FALLBACK_LABEL } from "@/features/tasks/domain/member-display-label";
import {
  listOrganizationMemberLabels,
  memberLabelMap,
} from "@/features/tasks/server/list-organization-member-labels";

export const MAX_TASK_FORM_OPTIONS = 100;

export type TaskMemberOption = {
  value: string;
  label: string;
};

export type LeadTaskContextOption = {
  value: string;
  label: string;
};

export type CustomerTaskContextOption = {
  value: string;
  label: string;
};

export type EnrollmentTaskContextOption = {
  value: string;
  label: string;
  customerId: string;
  programId: string;
};

export type TaskFormOptions = {
  members: TaskMemberOption[];
  leads: LeadTaskContextOption[];
  customers: CustomerTaskContextOption[];
  enrollments: EnrollmentTaskContextOption[];
  capped: {
    members: boolean;
    leads: boolean;
    customers: boolean;
    enrollments: boolean;
  };
};

const LEAD_FALLBACK = "Linked lead";
const CUSTOMER_FALLBACK = "Linked customer";
const PROGRAM_FALLBACK = "Linked program";

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids)];
}

export function emptyTaskFormOptions(): TaskFormOptions {
  return {
    members: [],
    leads: [],
    customers: [],
    enrollments: [],
    capped: {
      members: false,
      leads: false,
      customers: false,
      enrollments: false,
    },
  };
}

export async function loadTaskFormOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<TaskFormOptions> {
  const { data: members } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(MAX_TASK_FORM_OPTIONS + 1);

  const memberRows = members ?? [];
  const memberSlice = memberRows.slice(0, MAX_TASK_FORM_OPTIONS);
  const memberLabels = memberLabelMap(
    memberSlice.length > 0
      ? await listOrganizationMemberLabels(
          supabase,
          organizationId,
          memberSlice.map((row) => row.id),
        )
      : [],
  );

  const memberOptions: TaskMemberOption[] = memberSlice.map((row) => ({
    value: row.id,
    label: memberLabels[row.id] ?? MEMBER_DISPLAY_FALLBACK_LABEL,
  }));

  const { data: leadRows } = await supabase
    .from("leads")
    .select("id, display_name")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("display_name", { ascending: true })
    .limit(MAX_TASK_FORM_OPTIONS + 1);

  const leadOptions: LeadTaskContextOption[] = (leadRows ?? [])
    .slice(0, MAX_TASK_FORM_OPTIONS)
    .map((row) => ({
      value: row.id,
      label: normalizeLabel(row.display_name, LEAD_FALLBACK),
    }));

  const { data: customerRows } = await supabase
    .from("customers")
    .select("id, display_name")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("display_name", { ascending: true })
    .limit(MAX_TASK_FORM_OPTIONS + 1);

  const customerOptions: CustomerTaskContextOption[] = (customerRows ?? [])
    .slice(0, MAX_TASK_FORM_OPTIONS)
    .map((row) => ({
      value: row.id,
      label: normalizeLabel(row.display_name, CUSTOMER_FALLBACK),
    }));

  const { data: enrollmentRows } = await supabase
    .from("enrollments")
    .select("id, customer_id, program_id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("enrolled_at", { ascending: true })
    .limit(MAX_TASK_FORM_OPTIONS + 1);

  const enrollmentSlice = (enrollmentRows ?? []).slice(0, MAX_TASK_FORM_OPTIONS);
  const enrollmentCustomerIds = uniqueIds(enrollmentSlice.map((row) => row.customer_id));
  const enrollmentProgramIds = uniqueIds(enrollmentSlice.map((row) => row.program_id));

  const customerLabelById = Object.fromEntries(customerOptions.map((row) => [row.value, row.label]));
  const programLabelById: Record<string, string> = {};

  if (enrollmentProgramIds.length > 0) {
    const { data: programs } = await supabase
      .from("programs")
      .select("id, name")
      .eq("organization_id", organizationId)
      .in("id", enrollmentProgramIds);

    for (const program of programs ?? []) {
      programLabelById[program.id] = normalizeLabel(program.name, PROGRAM_FALLBACK);
    }
  }

  if (enrollmentCustomerIds.length > 0) {
    const missingCustomerIds = enrollmentCustomerIds.filter((id) => !customerLabelById[id]);
    if (missingCustomerIds.length > 0) {
      const { data: extraCustomers } = await supabase
        .from("customers")
        .select("id, display_name")
        .eq("organization_id", organizationId)
        .in("id", missingCustomerIds);

      for (const customer of extraCustomers ?? []) {
        customerLabelById[customer.id] = normalizeLabel(customer.display_name, CUSTOMER_FALLBACK);
      }
    }
  }

  const enrollmentOptions: EnrollmentTaskContextOption[] = enrollmentSlice.map((row) => {
    const customer = customerLabelById[row.customer_id] ?? CUSTOMER_FALLBACK;
    const program = programLabelById[row.program_id] ?? PROGRAM_FALLBACK;
    return {
      value: row.id,
      customerId: row.customer_id,
      programId: row.program_id,
      label: customer === CUSTOMER_FALLBACK && program === PROGRAM_FALLBACK
        ? "Enrollment"
        : `${customer} · ${program}`,
    };
  });

  return {
    members: memberOptions,
    leads: leadOptions,
    customers: customerOptions,
    enrollments: enrollmentOptions,
    capped: {
      members: memberRows.length > MAX_TASK_FORM_OPTIONS,
      leads: (leadRows ?? []).length > MAX_TASK_FORM_OPTIONS,
      customers: (customerRows ?? []).length > MAX_TASK_FORM_OPTIONS,
      enrollments: (enrollmentRows ?? []).length > MAX_TASK_FORM_OPTIONS,
    },
  };
}

export async function loadTaskMemberFilterOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<TaskMemberOption[]> {
  const options = await loadTaskFormOptions(supabase, organizationId);
  return options.members;
}
