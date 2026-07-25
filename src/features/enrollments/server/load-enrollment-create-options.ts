import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const MAX_ENROLLMENT_CREATE_OPTIONS = 100;

/** Eligible customer lifecycle statuses for new enrollments. */
const ELIGIBLE_CUSTOMER_STATUSES = ["onboarding", "active"] as const;

/** Eligible program lifecycle status for new enrollments. */
const ELIGIBLE_PROGRAM_STATUS = "active" as const;

const MEMBER_FALLBACK = "Team member";

export type EnrollmentCustomerOption = {
  value: string;
  label: string;
  status: string;
};

export type EnrollmentProgramOption = {
  value: string;
  label: string;
};

export type EnrollmentMemberOption = {
  value: string;
  label: string;
};

export type EnrollmentCreateOptionsResult = {
  customers: EnrollmentCustomerOption[];
  programs: EnrollmentProgramOption[];
  members: EnrollmentMemberOption[];
  capped: {
    customers: boolean;
    programs: boolean;
    members: boolean;
  };
  error?: string;
};

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

export async function loadEligibleEnrollmentCustomers(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{ options: EnrollmentCustomerOption[]; capped: boolean; failed: boolean }> {
  const { data, error } = await supabase
    .from("customers")
    .select("id, display_name, status")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .in("status", ELIGIBLE_CUSTOMER_STATUSES)
    .order("display_name", { ascending: true })
    .limit(MAX_ENROLLMENT_CREATE_OPTIONS + 1);

  if (error) {
    return { options: [], capped: false, failed: true };
  }

  const rows = data ?? [];
  const options = rows.slice(0, MAX_ENROLLMENT_CREATE_OPTIONS).map((row) => ({
    value: row.id,
    label: normalizeLabel(row.display_name, "Unnamed customer"),
    status: row.status,
  }));

  return { options, capped: rows.length > MAX_ENROLLMENT_CREATE_OPTIONS, failed: false };
}

export async function loadEligibleEnrollmentPrograms(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{ options: EnrollmentProgramOption[]; capped: boolean; failed: boolean }> {
  const { data, error } = await supabase
    .from("programs")
    .select("id, name")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .eq("status", ELIGIBLE_PROGRAM_STATUS)
    .order("name", { ascending: true })
    .limit(MAX_ENROLLMENT_CREATE_OPTIONS + 1);

  if (error) {
    return { options: [], capped: false, failed: true };
  }

  const rows = data ?? [];
  const options = rows.slice(0, MAX_ENROLLMENT_CREATE_OPTIONS).map((row) => ({
    value: row.id,
    label: normalizeLabel(row.name, "Unnamed program"),
  }));

  return { options, capped: rows.length > MAX_ENROLLMENT_CREATE_OPTIONS, failed: false };
}

export async function loadEligibleEnrollmentMembers(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<{ options: EnrollmentMemberOption[]; capped: boolean; failed: boolean }> {
  const { data: members, error } = await supabase
    .from("organization_members")
    .select("id, user_id")
    .eq("organization_id", organizationId)
    .eq("status", "active")
    .order("joined_at", { ascending: true })
    .limit(MAX_ENROLLMENT_CREATE_OPTIONS + 1);

  if (error) {
    return { options: [], capped: false, failed: true };
  }

  const memberRows = members ?? [];
  if (memberRows.length === 0) {
    return { options: [], capped: false, failed: false };
  }

  const slice = memberRows.slice(0, MAX_ENROLLMENT_CREATE_OPTIONS);
  const userIds = uniqueIds(slice.map((row) => row.user_id));
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

  const options = slice.map((row) => ({
    value: row.id,
    label: profileNames[row.user_id] ?? MEMBER_FALLBACK,
  }));

  return { options, capped: memberRows.length > MAX_ENROLLMENT_CREATE_OPTIONS, failed: false };
}

export async function loadEnrollmentCreateOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<EnrollmentCreateOptionsResult> {
  const [customersResult, programsResult, membersResult] = await Promise.all([
    loadEligibleEnrollmentCustomers(supabase, organizationId),
    loadEligibleEnrollmentPrograms(supabase, organizationId),
    loadEligibleEnrollmentMembers(supabase, organizationId),
  ]);

  const failed = customersResult.failed || programsResult.failed || membersResult.failed;

  return {
    customers: customersResult.options,
    programs: programsResult.options,
    members: membersResult.options,
    capped: {
      customers: customersResult.capped,
      programs: programsResult.capped,
      members: membersResult.capped,
    },
    error: failed
      ? "Some enrollment create options could not be loaded. Please try again."
      : undefined,
  };
}
