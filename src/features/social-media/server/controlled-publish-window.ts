/**
 * Load / assert controlled publish window binding (R1-E-R2-P2).
 * Does not enable SOCIAL_PUBLISHING_ENABLED. Never exposes secrets.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  evaluateControlledPublishWindowBinding,
  isSocialControlledPublishWindowStatus,
  type ActiveControlledPublishWindow,
  PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW,
  CONTROLLED_WINDOW_EXHAUSTED,
} from "@/features/social-media/domain/controlled-publish-window";

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

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export type LoadActiveControlledPublishWindowResult =
  | { ok: true; window: ActiveControlledPublishWindow | null }
  | { ok: false; reason: "forbidden" | "transport_error" | "unexpected" };

export async function loadActiveControlledPublishWindow(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<LoadActiveControlledPublishWindowResult> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc(
      "get_active_social_controlled_publish_window",
      { p_organization_id: organizationId },
    );
    if (error) {
      return { ok: false, reason: "transport_error" };
    }
    const row = firstRow(data);
    const resultCode = asString(row?.result_code);
    if (resultCode === "forbidden") {
      return { ok: false, reason: "forbidden" };
    }
    if (resultCode !== "success") {
      return { ok: false, reason: "unexpected" };
    }
    const windowId = asString(row?.window_id);
    const publicationId = asString(row?.publication_id);
    const status = asString(row?.status);
    const maxExecuteCount = asNumber(row?.max_execute_count);
    const consumedExecuteCount = asNumber(row?.consumed_execute_count);
    const authorizedAt = asString(row?.authorized_at);
    if (!windowId || !publicationId) {
      return { ok: true, window: null };
    }
    if (
      status !== "active" ||
      !isSocialControlledPublishWindowStatus(status) ||
      maxExecuteCount == null ||
      consumedExecuteCount == null ||
      !authorizedAt
    ) {
      return { ok: false, reason: "unexpected" };
    }
    return {
      ok: true,
      window: {
        windowId,
        publicationId,
        status: "active",
        maxExecuteCount,
        consumedExecuteCount,
        authorizedAt,
      },
    };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type AssertControlledWindowBindingResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | typeof PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW
        | typeof CONTROLLED_WINDOW_EXHAUSTED
        | "forbidden"
        | "internal_error";
    };

/**
 * App-layer fail-closed check before calling execute server.
 * DB still re-checks and consumes atomically inside b18_start.
 */
export async function assertControlledPublishWindowBinding(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  requestedPublicationId: string,
): Promise<AssertControlledWindowBindingResult> {
  const loaded = await loadActiveControlledPublishWindow(
    supabase,
    organizationId,
  );
  if (!loaded.ok) {
    if (loaded.reason === "forbidden") {
      return { ok: false, code: "forbidden" };
    }
    return { ok: false, code: "internal_error" };
  }
  const evaluation = evaluateControlledPublishWindowBinding({
    activeWindow: loaded.window,
    requestedPublicationId,
  });
  if (!evaluation.allowed) {
    if (
      evaluation.reason === PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW ||
      evaluation.reason === CONTROLLED_WINDOW_EXHAUSTED
    ) {
      return { ok: false, code: evaluation.reason };
    }
    return { ok: false, code: "internal_error" };
  }
  return { ok: true };
}
