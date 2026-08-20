import "server-only";

import { revalidatePath } from "next/cache";
import { isKnownAttentionRole } from "@/features/attention/domain/permissions";
import { resolveAttentionPermissions } from "@/features/attention/domain/permissions";
import { evaluateAttentionRules } from "@/features/attention/server/attention-rpc-adapters";
import { listAttentionEvaluateRevalidationPaths } from "@/features/attention/ui/attention-evaluate-return";
import type { ProgressRole } from "@/features/progress/domain/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Event-driven Course Seller Attention re-evaluation after Progress mutations.
 *
 * Uses the existing Owner/Admin evaluate_attention_rules RPC (no scheduler).
 * Staff/Viewer progress commits intentionally skip evaluation — they lack
 * canEvaluateRules; expire/create waits for Owner/Admin evaluate.
 *
 * Fail-soft: progress is already committed; Attention errors never reverse it.
 */
export async function reevaluateEnrollmentAttentionAfterProgress(params: {
  supabase: SupabaseClient<Database>;
  organizationId: string;
  role: ProgressRole;
  enrollmentId: string;
}): Promise<{ attempted: boolean; ok: boolean }> {
  if (!isKnownAttentionRole(params.role)) {
    return { attempted: false, ok: false };
  }

  const permissions = resolveAttentionPermissions(params.role);
  if (!permissions.canEvaluateRules) {
    return { attempted: false, ok: false };
  }

  const result = await evaluateAttentionRules({
    supabase: params.supabase,
    organizationId: params.organizationId,
    input: {
      organizationId: params.organizationId,
      enrollmentId: params.enrollmentId,
    },
  });

  if (!result.ok) {
    return { attempted: true, ok: false };
  }

  for (const path of listAttentionEvaluateRevalidationPaths(
    params.organizationId,
    params.enrollmentId,
  )) {
    revalidatePath(path);
  }

  return { attempted: true, ok: true };
}
