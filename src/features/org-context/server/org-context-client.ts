import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { OrgContextQueryClient } from "@/features/org-context/server/org-context-query";

/**
 * Canonical privileged construction point for ORG-CONTEXT tenant reads.
 * Server-only. Not a browser client. Not a public API.
 */
export function createOrgContextQueryClient(
  env: Record<string, string | undefined> = process.env,
): OrgContextQueryClient {
  return createSupabaseServiceRoleClient(env) as unknown as OrgContextQueryClient;
}
