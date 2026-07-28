import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const MAX_PROGRESS_ENROLLMENT_OPTIONS = 100;

/** Manual progress record is only allowed for these enrollment statuses (RPC). */
const ELIGIBLE_ENROLLMENT_STATUSES = ["active", "paused"] as const;

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  paused: "Paused",
};

export type ProgressEnrollmentOption = {
  value: string;
  label: string;
};

export type ProgressEnrollmentOptionsResult = {
  options: ProgressEnrollmentOption[];
  capped: boolean;
  error?: string;
};

function normalizeLabel(value: string | null | undefined, fallback: string): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

function uniqueIds(ids: Array<string | null | undefined>): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}

/**
 * Org-scoped enrollments eligible for a MANUAL progress record.
 * Queries enrollments/customers/programs directly from the progress server
 * module only — it does not import or reuse enrollments feature mutation code.
 */
export async function loadProgressEnrollmentOptions(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ProgressEnrollmentOptionsResult> {
  const { data, error } = await supabase
    .from("enrollments")
    .select("id, status, customer_id, program_id")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .in("status", ELIGIBLE_ENROLLMENT_STATUSES)
    .order("enrolled_at", { ascending: false })
    .limit(MAX_PROGRESS_ENROLLMENT_OPTIONS + 1);

  if (error) {
    return {
      options: [],
      capped: false,
      error: "Unable to load eligible enrollments. Please try again.",
    };
  }

  const rows = data ?? [];
  const slice = rows.slice(0, MAX_PROGRESS_ENROLLMENT_OPTIONS);

  const customerIds = uniqueIds(slice.map((row) => row.customer_id));
  const programIds = uniqueIds(slice.map((row) => row.program_id));

  const [customersResult, programsResult] = await Promise.all([
    customerIds.length > 0
      ? supabase.from("customers").select("id, display_name").in("id", customerIds)
      : Promise.resolve({ data: [] as Array<{ id: string; display_name: string | null }> }),
    programIds.length > 0
      ? supabase.from("programs").select("id, name").in("id", programIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string | null }> }),
  ]);

  const customerLabels = Object.fromEntries(
    (customersResult.data ?? []).map((row) => [row.id, row.display_name]),
  );
  const programLabels = Object.fromEntries(
    (programsResult.data ?? []).map((row) => [row.id, row.name]),
  );

  const options = slice.map((row) => {
    const customerLabel = normalizeLabel(customerLabels[row.customer_id], "Unknown customer");
    const programLabel = normalizeLabel(programLabels[row.program_id], "Unknown program");
    const statusLabel = STATUS_LABELS[row.status] ?? row.status;
    return {
      value: row.id,
      label: `${customerLabel} · ${programLabel} (${statusLabel})`,
    };
  });

  return {
    options,
    capped: rows.length > MAX_PROGRESS_ENROLLMENT_OPTIONS,
  };
}
