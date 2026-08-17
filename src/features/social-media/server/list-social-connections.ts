/**
 * Session-client listing for Social account connections (SMM-B1.7-R1).
 * Safe metadata only — never credentials.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type QueryCapableClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => PromiseLike<{
        data: unknown;
        error: { message?: string } | null;
      }>;
    };
  };
};

export type ListedSocialConnection = {
  id: string;
  workspaceId: string;
  provider: string;
  status: string;
  professionalAccountType: string | null;
  externalAccountId: string | null;
  health: string | null;
};

export type ListSocialConnectionsResult =
  | { ok: true; connections: ListedSocialConnection[] }
  | { ok: false; reason: "transport_error" | "unexpected" };

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function listSocialAccountConnections(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ListSocialConnectionsResult> {
  const client = supabase as unknown as QueryCapableClient;
  try {
    const { data, error } = await client
      .from("social_account_connections")
      .select(
        "id, workspace_id, provider, status, professional_account_type, external_account_id, health",
      )
      .eq("organization_id", organizationId);
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    if (!Array.isArray(data)) {
      return { ok: false, reason: "unexpected" };
    }
    const connections: ListedSocialConnection[] = [];
    for (const row of data) {
      if (!row || typeof row !== "object") {
        continue;
      }
      const record = row as Record<string, unknown>;
      const id = asString(record.id);
      const workspaceId = asString(record.workspace_id);
      const provider = asString(record.provider);
      const status = asString(record.status);
      if (!id || !workspaceId || !provider || !status) {
        continue;
      }
      connections.push({
        id,
        workspaceId,
        provider,
        status,
        professionalAccountType: asString(record.professional_account_type),
        externalAccountId: asString(record.external_account_id),
        health: asString(record.health),
      });
    }
    return { ok: true, connections };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}
