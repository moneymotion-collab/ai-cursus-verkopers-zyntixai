/**
 * Server-only Supabase client for the Social scheduler worker.
 * Machine execution — not a member session. Never import from client components.
 */

import "server-only";

import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/service-role";

export function isSocialSchedulerDatabaseConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return isSupabaseServiceRoleConfigured(env);
}

export function createSocialSchedulerDatabaseClient(
  env: Record<string, string | undefined> = process.env,
): SupabaseClient<Database> {
  return createSupabaseServiceRoleClient(env);
}
