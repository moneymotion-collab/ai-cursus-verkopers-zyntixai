import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import type { DataIntakeFoundationRpcClient } from "@/features/data-intake/server/data-intake-rpc";

/**
 * Canonical privileged construction point for DATA-1C foundation commands.
 * Server-only. Not a browser client. Not caller identity.
 */
export function createDataIntakeQueryClient(
  env: Record<string, string | undefined> = process.env,
): DataIntakeQueryClient {
  return createSupabaseServiceRoleClient(env) as unknown as DataIntakeQueryClient;
}

export function createDataIntakeFoundationRpcClient(
  env: Record<string, string | undefined> = process.env,
): DataIntakeFoundationRpcClient {
  return createSupabaseServiceRoleClient(env) as unknown as DataIntakeFoundationRpcClient;
}
