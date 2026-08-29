import "server-only";

import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import type { DataIntakeFoundationRpcClient } from "@/features/data-intake/server/data-intake-rpc";
import type { DataIntakeSourceObjectRpcClient } from "@/features/data-intake/server/data-intake-object-rpc";
import type { DataIntakeSourceStructureRpcClient } from "@/features/data-intake/server/data-intake-structure-rpc";
import type { DataIntakeMappingRpcClient } from "@/features/data-intake/server/data-intake-mapping-rpc";
import {
  createQueryDataIntakeRecordLookup,
  type DataIntakeRecordLookup,
} from "@/features/data-intake/server/data-intake-lookup";
import {
  createSupabaseDataIntakeObjectStore,
  type DataIntakeObjectStore,
} from "@/features/data-intake/server/source-object-store";

/**
 * Canonical privileged construction point for DATA-1C/1D/1E commands.
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

export function createDataIntakeSourceObjectRpcClient(
  env: Record<string, string | undefined> = process.env,
): DataIntakeSourceObjectRpcClient {
  return createSupabaseServiceRoleClient(env) as unknown as DataIntakeSourceObjectRpcClient;
}

export function createDataIntakeSourceStructureRpcClient(
  env: Record<string, string | undefined> = process.env,
): DataIntakeSourceStructureRpcClient {
  return createSupabaseServiceRoleClient(env) as unknown as DataIntakeSourceStructureRpcClient;
}

export function createDataIntakeMappingRpcClient(
  env: Record<string, string | undefined> = process.env,
): DataIntakeMappingRpcClient {
  return createSupabaseServiceRoleClient(env) as unknown as DataIntakeMappingRpcClient;
}

export function createDataIntakeRecordLookup(
  env: Record<string, string | undefined> = process.env,
): DataIntakeRecordLookup {
  return createQueryDataIntakeRecordLookup(createDataIntakeQueryClient(env));
}

export function createDataIntakeObjectStore(
  env: Record<string, string | undefined> = process.env,
): DataIntakeObjectStore {
  const client = createSupabaseServiceRoleClient(env);
  return createSupabaseDataIntakeObjectStore(client.storage);
}
