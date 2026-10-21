/**
 * B1.9 Owner/Admin lifecycle mutations — no Meta provider writes.
 */

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canManageSocialConnections } from "@/features/social-media/domain/permissions";
import { isUnknownExternalResolution } from "@/features/social-media/domain/lifecycle";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";

type LifecycleActionFailureCode =
  | "feature_disabled"
  | "unauthorized"
  | "forbidden"
  | "invalid_request"
  | "not_found"
  | "conflict"
  | "lease_active"
  | "already_terminal"
  | "rate_limited"
  | "external_id_required"
  | "internal_error";

export type LifecycleMutationResult =
  | { ok: true; resultCode: string; nextStatus?: string | null }
  | { ok: false; code: LifecycleActionFailureCode };

function mapRpcCode(code: string | null): LifecycleActionFailureCode {
  switch (code) {
    case "forbidden":
      return "forbidden";
    case "not_found":
      return "not_found";
    case "conflict":
      return "conflict";
    case "lease_active":
      return "lease_active";
    case "already_terminal":
      return "already_terminal";
    case "rate_limited":
      return "rate_limited";
    case "external_id_required":
      return "external_id_required";
    case "invalid_input":
      return "invalid_request";
    default:
      return "internal_error";
  }
}

async function assertOwnerAdmin(
  organizationId: string,
): Promise<
  | { ok: true; organizationId: string; supabase: Awaited<ReturnType<typeof createSupabaseServerClient>> }
  | { ok: false; code: LifecycleActionFailureCode }
> {
  if (!isSocialInstagramConnectionsFeatureEnabled()) {
    return { ok: false, code: "feature_disabled" };
  }
  if (!organizationId) {
    return { ok: false, code: "invalid_request" };
  }
  const supabase = await createSupabaseServerClient();
  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId,
  });
  if (!orgContext.ok) {
    if (orgContext.error.code === "AUTH_REQUIRED") {
      return { ok: false, code: "unauthorized" };
    }
    return { ok: false, code: "forbidden" };
  }
  if (!canManageSocialConnections(orgContext.context.role, "active")) {
    return { ok: false, code: "forbidden" };
  }
  return {
    ok: true,
    organizationId: orgContext.context.organizationId,
    supabase,
  };
}

async function callLifecycleRpc(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  fn: string,
  args: Record<string, unknown>,
): Promise<LifecycleMutationResult> {
  try {
    const { data, error } = await supabase.rpc(fn as never, args as never);
    if (error) {
      return { ok: false, code: "internal_error" };
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || typeof row !== "object") {
      return { ok: false, code: "internal_error" };
    }
    const record = row as Record<string, unknown>;
    const resultCode =
      typeof record.result_code === "string" ? record.result_code : null;
    if (
      resultCode === "abandoned" ||
      resultCode === "reclaimed" ||
      resultCode === "resolved" ||
      resultCode === "expired" ||
      resultCode === "success"
    ) {
      return {
        ok: true,
        resultCode,
        nextStatus:
          typeof record.next_status === "string" ? record.next_status : null,
      };
    }
    return { ok: false, code: mapRpcCode(resultCode) };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}

export async function abandonPendingSocialConnectionAction(input: {
  organizationId: string;
  connectionId: string;
}): Promise<LifecycleMutationResult> {
  const gate = await assertOwnerAdmin(input.organizationId);
  if (!gate.ok) return gate;
  if (!input.connectionId) return { ok: false, code: "invalid_request" };
  return callLifecycleRpc(
    gate.supabase,
    "abandon_authorization_pending_social_connection",
    { p_connection_id: input.connectionId },
  );
}

export async function abandonQueuedSocialPublicationAction(input: {
  organizationId: string;
  publicationId: string;
}): Promise<LifecycleMutationResult> {
  const gate = await assertOwnerAdmin(input.organizationId);
  if (!gate.ok) return gate;
  if (!input.publicationId) return { ok: false, code: "invalid_request" };
  return callLifecycleRpc(gate.supabase, "abandon_queued_social_publication", {
    p_organization_id: gate.organizationId,
    p_publication_id: input.publicationId,
  });
}

export async function reclaimStaleSocialPublicationAction(input: {
  organizationId: string;
  publicationId: string;
}): Promise<LifecycleMutationResult> {
  const gate = await assertOwnerAdmin(input.organizationId);
  if (!gate.ok) return gate;
  if (!input.publicationId) return { ok: false, code: "invalid_request" };
  return callLifecycleRpc(
    gate.supabase,
    "reclaim_stale_social_publication_execution",
    {
      p_organization_id: gate.organizationId,
      p_publication_id: input.publicationId,
    },
  );
}

export async function resolveUnknownExternalPublicationAction(input: {
  organizationId: string;
  publicationId: string;
  resolution: string;
}): Promise<LifecycleMutationResult> {
  const gate = await assertOwnerAdmin(input.organizationId);
  if (!gate.ok) return gate;
  if (!input.publicationId || !isUnknownExternalResolution(input.resolution)) {
    return { ok: false, code: "invalid_request" };
  }
  return callLifecycleRpc(
    gate.supabase,
    "resolve_unknown_external_social_publication",
    {
      p_organization_id: gate.organizationId,
      p_publication_id: input.publicationId,
      p_resolution: input.resolution,
    },
  );
}

export async function requestSocialPublicationRetryAction(input: {
  organizationId: string;
  publicationId: string;
}): Promise<LifecycleMutationResult> {
  const gate = await assertOwnerAdmin(input.organizationId);
  if (!gate.ok) return gate;
  if (!input.publicationId) return { ok: false, code: "invalid_request" };
  return callLifecycleRpc(gate.supabase, "request_social_publication_retry", {
    p_organization_id: gate.organizationId,
    p_publication_id: input.publicationId,
  });
}
