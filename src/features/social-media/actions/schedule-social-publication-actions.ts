/**
 * SMM-B1.11-A Owner/Admin schedule / reschedule / cancel-scheduled actions.
 * No provider write. No calendar UI. Authoritative org context only.
 */

"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { canScheduleSocialPublication } from "@/features/social-media/domain/permissions";
import {
  isFutureExecutionInstant,
  isSocialScheduleRpcSuccessCode,
  parseUnambiguousExecutionInstant,
} from "@/features/social-media/domain/scheduling";
import { isSocialInstagramConnectionsFeatureEnabled } from "@/features/social-media/server/social-connections-feature";

export type ScheduleSocialPublicationActionFailureCode =
  | "feature_disabled"
  | "unauthorized"
  | "forbidden"
  | "invalid_request"
  | "invalid_time"
  | "not_found"
  | "conflict"
  | "not_scheduled"
  | "workflow_not_ready"
  | "connection_ineligible"
  | "internal_error";

export type ScheduleSocialPublicationActionResult =
  | {
      ok: true;
      resultCode: "success" | "already_scheduled";
      publicationId: string;
      intendedExecuteAt: string | null;
      nextAttemptAt: string | null;
      executionMode: string | null;
      variantVersionId: string | null;
      connectionId: string | null;
    }
  | { ok: false; code: ScheduleSocialPublicationActionFailureCode };

export type CancelScheduledSocialPublicationActionResult =
  | {
      ok: true;
      resultCode: "success";
      publicationId: string;
      status: string | null;
    }
  | { ok: false; code: ScheduleSocialPublicationActionFailureCode };

function mapRpcFailure(
  code: string | null,
): ScheduleSocialPublicationActionFailureCode {
  switch (code) {
    case "forbidden":
      return "forbidden";
    case "not_found":
      return "not_found";
    case "invalid_time":
      return "invalid_time";
    case "invalid_input":
      return "invalid_request";
    case "conflict":
      return "conflict";
    case "not_scheduled":
      return "not_scheduled";
    case "workflow_not_ready":
      return "workflow_not_ready";
    case "connection_ineligible":
      return "connection_ineligible";
    default:
      return "internal_error";
  }
}

async function assertOwnerAdminScheduler(organizationId: string): Promise<
  | {
      ok: true;
      organizationId: string;
      supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    }
  | { ok: false; code: ScheduleSocialPublicationActionFailureCode }
> {
  if (!isSocialInstagramConnectionsFeatureEnabled()) {
    return { ok: false, code: "feature_disabled" };
  }
  const trimmed = organizationId.trim();
  if (!trimmed) {
    return { ok: false, code: "invalid_request" };
  }
  const supabase = await createSupabaseServerClient();
  const orgContext = await resolveOrganizationContext({
    supabase,
    organizationId: trimmed,
  });
  if (!orgContext.ok) {
    if (orgContext.error.code === "AUTH_REQUIRED") {
      return { ok: false, code: "unauthorized" };
    }
    return { ok: false, code: "forbidden" };
  }
  if (!canScheduleSocialPublication(orgContext.context.role, "active")) {
    return { ok: false, code: "forbidden" };
  }
  return {
    ok: true,
    organizationId: orgContext.context.organizationId,
    supabase,
  };
}

function requireFutureInstant(
  intendedExecuteAt: string,
):
  | { ok: true; iso: string }
  | { ok: false; code: "invalid_time" | "invalid_request" } {
  const parsed = parseUnambiguousExecutionInstant(intendedExecuteAt);
  if (!parsed) {
    return { ok: false, code: "invalid_request" };
  }
  if (!isFutureExecutionInstant(parsed, new Date())) {
    return { ok: false, code: "invalid_time" };
  }
  return { ok: true, iso: parsed.toISOString() };
}

async function callScheduleRpc(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  fn: "schedule_social_publication" | "reschedule_social_publication" | "reschedule_missed_social_publication",
  organizationId: string,
  publicationId: string,
  intendedExecuteAtIso: string,
): Promise<ScheduleSocialPublicationActionResult> {
  try {
    const { data, error } = await supabase.rpc(fn as never, {
      p_organization_id: organizationId,
      p_publication_id: publicationId,
      p_intended_execute_at: intendedExecuteAtIso,
    } as never);
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
    if (!isSocialScheduleRpcSuccessCode(resultCode)) {
      return { ok: false, code: mapRpcFailure(resultCode) };
    }
    return {
      ok: true,
      resultCode,
      publicationId:
        typeof record.publication_id === "string"
          ? record.publication_id
          : publicationId,
      intendedExecuteAt:
        typeof record.intended_execute_at === "string"
          ? record.intended_execute_at
          : null,
      nextAttemptAt:
        typeof record.next_attempt_at === "string"
          ? record.next_attempt_at
          : null,
      executionMode:
        typeof record.execution_mode === "string"
          ? record.execution_mode
          : null,
      variantVersionId:
        typeof record.variant_version_id === "string"
          ? record.variant_version_id
          : null,
      connectionId:
        typeof record.connection_id === "string"
          ? record.connection_id
          : null,
    };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}

export async function scheduleSocialPublicationAction(input: {
  organizationId: string;
  publicationId: string;
  intendedExecuteAt: string;
}): Promise<ScheduleSocialPublicationActionResult> {
  const gate = await assertOwnerAdminScheduler(input.organizationId);
  if (!gate.ok) return gate;
  const publicationId = input.publicationId?.trim();
  if (!publicationId) {
    return { ok: false, code: "invalid_request" };
  }
  const instant = requireFutureInstant(input.intendedExecuteAt);
  if (!instant.ok) return instant;
  return callScheduleRpc(
    gate.supabase,
    "schedule_social_publication",
    gate.organizationId,
    publicationId,
    instant.iso,
  );
}

export async function rescheduleSocialPublicationAction(input: {
  organizationId: string;
  publicationId: string;
  intendedExecuteAt: string;
}): Promise<ScheduleSocialPublicationActionResult> {
  const gate = await assertOwnerAdminScheduler(input.organizationId);
  if (!gate.ok) return gate;
  const publicationId = input.publicationId?.trim();
  if (!publicationId) {
    return { ok: false, code: "invalid_request" };
  }
  const instant = requireFutureInstant(input.intendedExecuteAt);
  if (!instant.ok) return instant;
  return callScheduleRpc(
    gate.supabase,
    "reschedule_social_publication",
    gate.organizationId,
    publicationId,
    instant.iso,
  );
}

export async function rescheduleMissedSocialPublicationAction(input: {
  organizationId: string;
  publicationId: string;
  intendedExecuteAt: string;
}): Promise<ScheduleSocialPublicationActionResult> {
  const gate = await assertOwnerAdminScheduler(input.organizationId);
  if (!gate.ok) return gate;
  const publicationId = input.publicationId?.trim();
  if (!publicationId) {
    return { ok: false, code: "invalid_request" };
  }
  const instant = requireFutureInstant(input.intendedExecuteAt);
  if (!instant.ok) return instant;
  return callScheduleRpc(
    gate.supabase,
    "reschedule_missed_social_publication",
    gate.organizationId,
    publicationId,
    instant.iso,
  );
}

export async function cancelMissedSocialPublicationAction(input: {
  organizationId: string;
  publicationId: string;
}): Promise<CancelScheduledSocialPublicationActionResult> {
  const gate = await assertOwnerAdminScheduler(input.organizationId);
  if (!gate.ok) return gate;
  const publicationId = input.publicationId?.trim();
  if (!publicationId) {
    return { ok: false, code: "invalid_request" };
  }
  try {
    const { data, error } = await gate.supabase.rpc(
      "cancel_missed_social_publication" as never,
      {
        p_organization_id: gate.organizationId,
        p_publication_id: publicationId,
      } as never,
    );
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
    if (resultCode !== "success") {
      return { ok: false, code: mapRpcFailure(resultCode) };
    }
    return {
      ok: true,
      resultCode: "success",
      publicationId:
        typeof record.publication_id === "string"
          ? record.publication_id
          : publicationId,
      status: typeof record.status === "string" ? record.status : null,
    };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}

export async function cancelScheduledSocialPublicationAction(input: {
  organizationId: string;
  publicationId: string;
}): Promise<CancelScheduledSocialPublicationActionResult> {
  const gate = await assertOwnerAdminScheduler(input.organizationId);
  if (!gate.ok) return gate;
  const publicationId = input.publicationId?.trim();
  if (!publicationId) {
    return { ok: false, code: "invalid_request" };
  }
  try {
    const { data, error } = await gate.supabase.rpc(
      "cancel_scheduled_social_publication" as never,
      {
        p_organization_id: gate.organizationId,
        p_publication_id: publicationId,
      } as never,
    );
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
    if (resultCode !== "success") {
      return { ok: false, code: mapRpcFailure(resultCode) };
    }
    return {
      ok: true,
      resultCode: "success",
      publicationId:
        typeof record.publication_id === "string"
          ? record.publication_id
          : publicationId,
      status: typeof record.status === "string" ? record.status : null,
    };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}
