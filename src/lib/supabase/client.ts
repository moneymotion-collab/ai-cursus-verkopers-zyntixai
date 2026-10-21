import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getBrowserSupabaseEnv } from "@/lib/env/public";

export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getBrowserSupabaseEnv();
  return createBrowserClient<Database>(url, publishableKey);
}
