import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { BqaQueryClient } from "@/features/business-qualification/server/bqa-query";
import type { BqaMutationRpcClient } from "@/features/business-qualification/server/bqa-rpc";
import type { BqaHandoffRpcClient } from "@/features/business-qualification/server/bqa-handoff-rpc";

/**
 * Canonical privileged construction point for BQA tenant reads and named mutations.
 * Server-only. Not a browser client. Not caller identity.
 */
export function createBqaQueryClient(
  env: Record<string, string | undefined> = process.env,
): BqaQueryClient {
  return createSupabaseServiceRoleClient(env) as unknown as BqaQueryClient;
}

export function createBqaMutationRpcClient(
  env: Record<string, string | undefined> = process.env,
): BqaMutationRpcClient {
  return createSupabaseServiceRoleClient(env) as unknown as BqaMutationRpcClient;
}

export function createBqaHandoffRpcClient(
  env: Record<string, string | undefined> = process.env,
): BqaHandoffRpcClient {
  return createSupabaseServiceRoleClient(env) as unknown as BqaHandoffRpcClient;
}
