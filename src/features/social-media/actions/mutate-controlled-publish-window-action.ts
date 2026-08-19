"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolvePlatformClosedBetaOperatorSession } from "@/features/social-media/server/platform-operator-session";

export type MutateControlledPublishWindowActionResult =
  | {
      ok: true;
      action: "open" | "close";
      windowId: string;
      publicationId?: string;
    }
  | {
      ok: false;
      code:
        | "unauthorized"
        | "forbidden"
        | "invalid_request"
        | "not_found"
        | "conflict"
        | "internal_error";
    };

/**
 * Platform-operator only. Opens/closes a one-shot controlled Execute window.
 * Does not enable SOCIAL_PUBLISHING_ENABLED.
 */
export async function mutateControlledPublishWindowAction(input: {
  action: "open" | "close";
  organizationId: string;
  publicationId?: string;
  windowId?: string;
  maxExecuteCount?: number;
  reason?: string;
}): Promise<MutateControlledPublishWindowActionResult> {
  const organizationId = input.organizationId?.trim();
  if (!organizationId) {
    return { ok: false, code: "invalid_request" };
  }

  const supabase = await createSupabaseServerClient();
  const session = await resolvePlatformClosedBetaOperatorSession(supabase);
  if (!session.ok) {
    return {
      ok: false,
      code: session.reason === "auth_required" ? "unauthorized" : "forbidden",
    };
  }

  const client = session.service as unknown as {
    rpc: (
      fn: string,
      args?: Record<string, unknown>,
    ) => PromiseLike<{
      data: unknown;
      error: { message?: string } | null;
    }>;
  };

  try {
    if (input.action === "open") {
      const publicationId = input.publicationId?.trim();
      if (!publicationId) {
        return { ok: false, code: "invalid_request" };
      }
      const maxExecuteCount =
        typeof input.maxExecuteCount === "number" &&
        Number.isInteger(input.maxExecuteCount)
          ? input.maxExecuteCount
          : 1;
      const { data, error } = await client.rpc(
        "operator_open_social_controlled_publish_window",
        {
          p_organization_id: organizationId,
          p_publication_id: publicationId,
          p_max_execute_count: maxExecuteCount,
          p_reason: input.reason?.trim() || null,
          p_actor_user_id: session.userId,
        },
      );
      if (error) {
        return { ok: false, code: "internal_error" };
      }
      return mapOpenResult(data);
    }

    const windowId = input.windowId?.trim();
    if (!windowId) {
      return { ok: false, code: "invalid_request" };
    }
    const { data, error } = await client.rpc(
      "operator_close_social_controlled_publish_window",
      {
        p_organization_id: organizationId,
        p_window_id: windowId,
        p_reason: input.reason?.trim() || null,
        p_actor_user_id: session.userId,
      },
    );
    if (error) {
      return { ok: false, code: "internal_error" };
    }
    return mapCloseResult(data, windowId);
  } catch {
    return { ok: false, code: "internal_error" };
  }
}

function mapOpenResult(
  data: unknown,
): MutateControlledPublishWindowActionResult {
  const row = Array.isArray(data) ? data[0] : data;
  const resultCode =
    row && typeof row === "object"
      ? String((row as Record<string, unknown>).result_code ?? "")
      : "";
  if (resultCode === "not_found") return { ok: false, code: "not_found" };
  if (resultCode === "conflict") return { ok: false, code: "conflict" };
  if (resultCode === "invalid_input")
    return { ok: false, code: "invalid_request" };
  if (resultCode === "forbidden") return { ok: false, code: "forbidden" };
  if (resultCode !== "success") return { ok: false, code: "internal_error" };
  const windowId = String((row as Record<string, unknown>).window_id ?? "");
  const publicationId = String(
    (row as Record<string, unknown>).publication_id ?? "",
  );
  if (!windowId || !publicationId) return { ok: false, code: "internal_error" };
  return { ok: true, action: "open", windowId, publicationId };
}

function mapCloseResult(
  data: unknown,
  windowId: string,
): MutateControlledPublishWindowActionResult {
  const row = Array.isArray(data) ? data[0] : data;
  const resultCode =
    row && typeof row === "object"
      ? String((row as Record<string, unknown>).result_code ?? "")
      : "";
  if (resultCode === "not_found") return { ok: false, code: "not_found" };
  if (resultCode === "conflict") return { ok: false, code: "conflict" };
  if (resultCode === "forbidden") return { ok: false, code: "forbidden" };
  if (resultCode !== "success") return { ok: false, code: "internal_error" };
  return { ok: true, action: "close", windowId };
}
