/**
 * Session-client adapters for Social Workspace RPCs (SMM-B1.2).
 * No service-role client. Maps result_code only.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

function firstRow(data: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  return candidate as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export type CreateSocialWorkspaceSuccess = {
  ok: true;
  brandId: string;
  workspaceId: string;
};

export type CreateSocialWorkspaceFailure = {
  ok: false;
  reason:
    | "invalid_input"
    | "forbidden"
    | "transport_error"
    | "unexpected";
};

export async function createSocialWorkspace(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    displayName: string;
    customerId?: string | null;
  },
): Promise<CreateSocialWorkspaceSuccess | CreateSocialWorkspaceFailure> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc("create_social_workspace", {
      p_organization_id: input.organizationId,
      p_display_name: input.displayName,
      p_customer_id: input.customerId ?? null,
    });
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      const brandId = asString(row?.brand_id);
      const workspaceId = asString(row?.workspace_id);
      if (!brandId || !workspaceId) {
        return { ok: false, reason: "unexpected" };
      }
      return { ok: true, brandId, workspaceId };
    }
    if (resultCode === "invalid_input" || resultCode === "forbidden") {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type UpdateSocialWorkspaceFailure = {
  ok: false;
  reason:
    | "invalid_input"
    | "forbidden"
    | "not_found"
    | "conflict"
    | "transport_error"
    | "unexpected";
};

export async function updateSocialWorkspace(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    workspaceId: string;
    displayName: string;
  },
): Promise<{ ok: true } | UpdateSocialWorkspaceFailure> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc("update_social_workspace", {
      p_organization_id: input.organizationId,
      p_workspace_id: input.workspaceId,
      p_display_name: input.displayName,
    });
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      return { ok: true };
    }
    if (
      resultCode === "invalid_input" ||
      resultCode === "forbidden" ||
      resultCode === "not_found" ||
      resultCode === "conflict"
    ) {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type ArchiveSocialWorkspaceFailure = {
  ok: false;
  reason:
    | "invalid_input"
    | "forbidden"
    | "not_found"
    | "conflict"
    | "transport_error"
    | "unexpected";
};

export async function archiveSocialWorkspace(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    workspaceId: string;
  },
): Promise<{ ok: true } | ArchiveSocialWorkspaceFailure> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc("archive_social_workspace", {
      p_organization_id: input.organizationId,
      p_workspace_id: input.workspaceId,
    });
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "success") {
      return { ok: true };
    }
    if (
      resultCode === "invalid_input" ||
      resultCode === "forbidden" ||
      resultCode === "not_found" ||
      resultCode === "conflict"
    ) {
      return { ok: false, reason: resultCode };
    }
    return { ok: false, reason: "unexpected" };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}
