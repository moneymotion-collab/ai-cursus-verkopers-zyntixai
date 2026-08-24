import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { CapabilitiesRepository } from "@/features/control-plane/server/capabilities.repository";
import type { ControlPlaneQueryClient } from "@/features/control-plane/server/control-plane-query";
import { ContextRepository } from "@/features/control-plane/server/context.repository";
import { TaxonomyRepository } from "@/features/control-plane/server/taxonomy.repository";

/**
 * Canonical privileged construction point for control-plane catalog reads.
 * Server-only. Not a browser client. Not a public API.
 */
export function createControlPlaneQueryClient(
  env: Record<string, string | undefined> = process.env,
): ControlPlaneQueryClient {
  return createSupabaseServiceRoleClient(env) as unknown as ControlPlaneQueryClient;
}

export function createControlPlaneReaders(client?: ControlPlaneQueryClient) {
  const query = client ?? createControlPlaneQueryClient();
  return {
    taxonomy: new TaxonomyRepository(query),
    capabilities: new CapabilitiesRepository(query),
    context: new ContextRepository(query),
  };
}

export { CapabilitiesRepository } from "@/features/control-plane/server/capabilities.repository";
export { ContextRepository } from "@/features/control-plane/server/context.repository";
export { TaxonomyRepository } from "@/features/control-plane/server/taxonomy.repository";
