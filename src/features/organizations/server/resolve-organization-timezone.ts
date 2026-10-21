import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  DEFAULT_ORGANIZATION_TIMEZONE,
  resolveEffectiveTimezone,
} from "@/features/tasks/domain/due-state";
import type { TaskApplicationError } from "@/features/tasks/domain/types";
import { normalizeTaskError } from "@/features/tasks/server/normalize-task-error";

export type ResolveOrganizationTimezoneResult =
  | { ok: true; timezone: string }
  | { ok: false; error: TaskApplicationError };

export async function resolveOrganizationTimezone(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ResolveOrganizationTimezoneResult> {
  const { data, error } = await supabase
    .from("organizations")
    .select("timezone")
    .eq("id", organizationId)
    .maybeSingle();

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  if (!data) {
    return { ok: true, timezone: DEFAULT_ORGANIZATION_TIMEZONE };
  }

  return {
    ok: true,
    timezone: resolveEffectiveTimezone(data.timezone),
  };
}
