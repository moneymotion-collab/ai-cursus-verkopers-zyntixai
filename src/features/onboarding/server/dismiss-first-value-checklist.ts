import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { canManageFirstValueChecklist } from "@/features/onboarding/domain/first-value-checklist";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";

export type ChecklistErrorCode =
  | "not_authenticated"
  | "membership_required"
  | "organization_not_found"
  | "organization_ambiguous"
  | "forbidden"
  | "validation_error"
  | "unexpected_error";

export type ChecklistDismissResult =
  | { ok: true; dismissedAt: string }
  | { ok: false; code: ChecklistErrorCode; message: string };

const CHECKLIST_MESSAGE_BY_CODE: Record<ChecklistErrorCode, string> = {
  not_authenticated: "Sign in to continue.",
  membership_required: "Join an organization before continuing.",
  organization_not_found: "That organization could not be found.",
  organization_ambiguous: "Choose which organization to update before continuing.",
  forbidden: "You do not have access to update this organization.",
  validation_error: "Check the highlighted fields and try again.",
  unexpected_error: "Could not update your checklist. Please try again.",
};

export function checklistMessage(code: ChecklistErrorCode): string {
  return CHECKLIST_MESSAGE_BY_CODE[code];
}

/**
 * Idempotent dismiss of the first-value checklist for a membership-resolved org.
 * Updates only `first_run_checklist_dismissed_at`; relies on organizations_update_admin RLS.
 */
export async function dismissFirstValueChecklist(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ChecklistDismissResult> {
  const resolved = await resolveOnboardingOrganizationId(supabase, organizationId);
  if (!resolved.ok) {
    return {
      ok: false,
      code: resolved.code,
      message: checklistMessage(resolved.code),
    };
  }

  if (!canManageFirstValueChecklist(resolved.role)) {
    return {
      ok: false,
      code: "forbidden",
      message: checklistMessage("forbidden"),
    };
  }

  // Defense in depth: only write the org that membership resolution accepted.
  const targetOrganizationId = resolved.organizationId;

  const { data: existing, error: readError } = await supabase
    .from("organizations")
    .select("first_run_checklist_dismissed_at")
    .eq("id", targetOrganizationId)
    .maybeSingle();

  if (readError) {
    return {
      ok: false,
      code: "unexpected_error",
      message: checklistMessage("unexpected_error"),
    };
  }

  if (!existing) {
    return {
      ok: false,
      code: "organization_not_found",
      message: checklistMessage("organization_not_found"),
    };
  }

  if (existing.first_run_checklist_dismissed_at) {
    return {
      ok: true,
      dismissedAt: existing.first_run_checklist_dismissed_at,
    };
  }

  const dismissedAt = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("organizations")
    .update({ first_run_checklist_dismissed_at: dismissedAt })
    .eq("id", targetOrganizationId)
    .is("first_run_checklist_dismissed_at", null)
    .select("first_run_checklist_dismissed_at")
    .maybeSingle();

  if (updateError) {
    return {
      ok: false,
      code: "unexpected_error",
      message: checklistMessage("unexpected_error"),
    };
  }

  if (updated?.first_run_checklist_dismissed_at) {
    return {
      ok: true,
      dismissedAt: updated.first_run_checklist_dismissed_at,
    };
  }

  // Concurrent dismiss won the race — re-read and treat as idempotent success.
  const { data: raced, error: raceError } = await supabase
    .from("organizations")
    .select("first_run_checklist_dismissed_at")
    .eq("id", targetOrganizationId)
    .maybeSingle();

  if (raceError || !raced?.first_run_checklist_dismissed_at) {
    return {
      ok: false,
      code: "unexpected_error",
      message: checklistMessage("unexpected_error"),
    };
  }

  return {
    ok: true,
    dismissedAt: raced.first_run_checklist_dismissed_at,
  };
}
