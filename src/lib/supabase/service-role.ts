import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "@/lib/env/public";

/**
 * Server-only Supabase client with service_role.
 * Never import from client components. Never serialize the key.
 */
export function createSupabaseServiceRoleClient(
  env: Record<string, string | undefined> = process.env,
) {
  const { url } = getPublicSupabaseEnv();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function isSupabaseServiceRoleConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "").length > 0;
}
