import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  canManageFirstValueChecklist,
  deriveFirstValueChecklist,
  type FirstValueChecklistViewModel,
} from "@/features/onboarding/domain/first-value-checklist";

async function hasNonArchivedRow(
  supabase: SupabaseClient<Database>,
  table: "leads" | "tasks",
  organizationId: string,
): Promise<{ ok: true; exists: boolean } | { ok: false }> {
  const { count, error } = await supabase
    .from(table)
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .is("archived_at", null);

  if (error) {
    return { ok: false };
  }

  return { ok: true, exists: (count ?? 0) >= 1 };
}

/**
 * Loads B1.4 checklist state for the already-resolved leads organization.
 * Staff/viewer short-circuit without CRM count queries.
 */
export async function loadFirstValueChecklist(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: string;
}): Promise<FirstValueChecklistViewModel | null> {
  if (!canManageFirstValueChecklist(params.role)) {
    return null;
  }

  const { data: org, error: orgError } = await params.supabase
    .from("organizations")
    .select("onboarding_completed_at, first_run_checklist_dismissed_at")
    .eq("id", params.organizationId)
    .maybeSingle();

  if (orgError || !org) {
    return null;
  }

  const onboardingCompletedAt = org.onboarding_completed_at;
  const firstRunChecklistDismissedAt = org.first_run_checklist_dismissed_at;

  if (!onboardingCompletedAt || firstRunChecklistDismissedAt != null) {
    return deriveFirstValueChecklist({
      organizationId: params.organizationId,
      role: params.role,
      onboardingCompletedAt,
      firstRunChecklistDismissedAt,
      hasNonArchivedLead: false,
      hasNonArchivedTask: false,
    });
  }

  const [leadResult, taskResult] = await Promise.all([
    hasNonArchivedRow(params.supabase, "leads", params.organizationId),
    hasNonArchivedRow(params.supabase, "tasks", params.organizationId),
  ]);

  if (!leadResult.ok || !taskResult.ok) {
    return null;
  }

  return deriveFirstValueChecklist({
    organizationId: params.organizationId,
    role: params.role,
    onboardingCompletedAt,
    firstRunChecklistDismissedAt,
    hasNonArchivedLead: leadResult.exists,
    hasNonArchivedTask: taskResult.exists,
  });
}
