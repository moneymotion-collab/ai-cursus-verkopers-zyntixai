import "server-only";

import { updateAttentionSeverity } from "@/features/attention/server/attention-rpc-adapters";
import { ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY } from "@/features/attention/domain/signal";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * B1-C3 Course Seller usefulness:
 * B1-C1 /home Organization attention only composes critical/high items.
 * evaluate_attention_rules still creates enrollment_no_recent_progress at medium
 * (B1.7 contract, no migration). Elevate to high via existing severity RPC so
 * stalled enrollments surface on /home without rewriting Daily Operating.
 *
 * Idempotent: skips items already high/critical. Audited via update_attention_severity.
 */
export async function elevateStaleProgressAttentionForHomeSurfacing(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
}): Promise<{ examined: number; elevated: number }> {
  const { data, error } = await params.supabase
    .from("attention_items")
    .select("id, severity, dedupe_key")
    .eq("organization_id", params.organizationId)
    .in("status", ["open", "acknowledged"])
    .is("archived_at", null)
    .like("dedupe_key", `%:${ENROLLMENT_NO_RECENT_PROGRESS_RULE_KEY}`)
    .in("severity", ["low", "medium"]);

  if (error || !data) {
    return { examined: 0, elevated: 0 };
  }

  let elevated = 0;
  for (const row of data) {
    const result = await updateAttentionSeverity({
      supabase: params.supabase,
      organizationId: params.organizationId,
      input: {
        organizationId: params.organizationId,
        attentionItemId: row.id,
        severity: "high",
      },
    });
    if (result.ok) {
      elevated += 1;
    }
  }

  return { examined: data.length, elevated };
}
