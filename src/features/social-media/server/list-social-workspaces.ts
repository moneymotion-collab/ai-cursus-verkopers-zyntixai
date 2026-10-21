/**
 * Session-client listing for active Social workspaces (SMM-B1.7-R1).
 * No service-role client. Tables may be absent from generated Database types.
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
      ) => {
        is: (
          column: string,
          value: null,
        ) => PromiseLike<{
          data: unknown;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

export type ListedSocialWorkspace = {
  id: string;
  brandId: string;
  displayName: string;
};

export type ListSocialWorkspacesResult =
  | { ok: true; workspaces: ListedSocialWorkspace[] }
  | { ok: false; reason: "transport_error" | "unexpected" };

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export async function listActiveSocialWorkspaces(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ListSocialWorkspacesResult> {
  const client = supabase as unknown as QueryCapableClient;
  try {
    const { data, error } = await client
      .from("social_workspaces")
      .select("id, brand_id, display_name, archived_at")
      .eq("organization_id", organizationId)
      .is("archived_at", null);
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    if (!Array.isArray(data)) {
      return { ok: false, reason: "unexpected" };
    }
    const workspaces: ListedSocialWorkspace[] = [];
    for (const row of data) {
      if (!row || typeof row !== "object") {
        continue;
      }
      const record = row as Record<string, unknown>;
      const id = asString(record.id);
      const brandId = asString(record.brand_id);
      const displayName = asString(record.display_name);
      if (!id || !brandId || !displayName) {
        continue;
      }
      workspaces.push({ id, brandId, displayName });
    }
    return { ok: true, workspaces };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}
