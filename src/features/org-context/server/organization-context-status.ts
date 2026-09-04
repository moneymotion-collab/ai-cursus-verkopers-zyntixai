import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function organizationHasBusinessActivities(input: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
}): Promise<{ ok: true; hasActivities: boolean } | { ok: false }> {
  const { data, error } = await input.supabase
    .from("organization_business_activities")
    .select("id")
    .eq("organization_id", input.organizationId)
    .limit(1);

  if (error) {
    return { ok: false };
  }
  return { ok: true, hasActivities: (data?.length ?? 0) > 0 };
}
