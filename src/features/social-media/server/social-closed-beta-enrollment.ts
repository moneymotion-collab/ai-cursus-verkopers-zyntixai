/**
 * Load / assert closed-beta enrollment for prepare & execute paths.
 * Never exposes secrets. Does not enable SOCIAL_PUBLISHING_ENABLED.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  closedBetaPrepareDenialCode,
  closedBetaPublishDenialCode,
  isSocialClosedBetaEffectiveStatus,
  type SocialClosedBetaEffectiveStatus,
  type SocialClosedBetaEntitlementDenialCode,
} from "@/features/social-media/domain/closed-beta-enrollment";
import { canConnectWithClosedBetaEnrollment } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import type { SocialConnectFailureCode } from "@/features/social-media/domain/results";

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

export type LoadClosedBetaEnrollmentResult =
  | {
      ok: true;
      status: SocialClosedBetaEffectiveStatus;
      statusBeforePause: "approved" | "publishing_allowed" | null;
    }
  | { ok: false; reason: "forbidden" | "transport_error" | "unexpected" };

export async function loadSocialClosedBetaEnrollmentStatus(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<LoadClosedBetaEnrollmentResult> {
  const client = supabase as unknown as RpcCapableClient;
  try {
    const { data, error } = await client.rpc(
      "get_social_closed_beta_enrollment_status",
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
    const statusRaw = asString(row?.enrollment_status);
    if (!statusRaw || !isSocialClosedBetaEffectiveStatus(statusRaw)) {
      return { ok: false, reason: "unexpected" };
    }
    const beforeRaw = asString(row?.status_before_pause);
    const statusBeforePause =
      beforeRaw === "approved" || beforeRaw === "publishing_allowed"
        ? beforeRaw
        : null;
    return { ok: true, status: statusRaw, statusBeforePause };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}

export type ClosedBetaPrepareAssertResult =
  | { ok: true }
  | {
      ok: false;
      code: SocialClosedBetaEntitlementDenialCode | "forbidden" | "unexpected";
    };

export async function assertClosedBetaPrepareAllowed(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ClosedBetaPrepareAssertResult> {
  const loaded = await loadSocialClosedBetaEnrollmentStatus(
    supabase,
    organizationId,
  );
  if (!loaded.ok) {
    if (loaded.reason === "forbidden") {
      return { ok: false, code: "forbidden" };
    }
    return { ok: false, code: "unexpected" };
  }
  const denial = closedBetaPrepareDenialCode(loaded.status);
  if (denial) {
    return { ok: false, code: denial };
  }
  return { ok: true };
}

export type ClosedBetaPublishAssertResult =
  | { ok: true }
  | {
      ok: false;
      code: SocialClosedBetaEntitlementDenialCode | "forbidden" | "unexpected";
    };

export async function assertClosedBetaPublishAllowed(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ClosedBetaPublishAssertResult> {
  const loaded = await loadSocialClosedBetaEnrollmentStatus(
    supabase,
    organizationId,
  );
  if (!loaded.ok) {
    if (loaded.reason === "forbidden") {
      return { ok: false, code: "forbidden" };
    }
    return { ok: false, code: "unexpected" };
  }
  const denial = closedBetaPublishDenialCode(loaded.status);
  if (denial) {
    return { ok: false, code: denial };
  }
  return { ok: true };
}

export type ClosedBetaConnectAssertResult =
  | { ok: true }
  | {
      ok: false;
      code: SocialClosedBetaEntitlementDenialCode | "forbidden" | "unexpected";
    };

export async function assertClosedBetaConnectAllowed(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<ClosedBetaConnectAssertResult> {
  const loaded = await loadSocialClosedBetaEnrollmentStatus(
    supabase,
    organizationId,
  );
  if (!loaded.ok) {
    if (loaded.reason === "forbidden") {
      return { ok: false, code: "forbidden" };
    }
    return { ok: false, code: "unexpected" };
  }
  if (!canConnectWithClosedBetaEnrollment(loaded.status)) {
    if (loaded.status === "paused") {
      return { ok: false, code: "closed_beta_paused" };
    }
    if (loaded.status === "revoked") {
      return { ok: false, code: "closed_beta_revoked" };
    }
    return { ok: false, code: "closed_beta_not_enrolled" };
  }
  return { ok: true };
}

export function mapClosedBetaConnectFailure(
  result: Extract<ClosedBetaConnectAssertResult, { ok: false }>,
): { ok: false; code: SocialConnectFailureCode } {
  if (
    result.code === "closed_beta_not_enrolled" ||
    result.code === "closed_beta_paused" ||
    result.code === "closed_beta_revoked"
  ) {
    return { ok: false, code: result.code };
  }
  if (result.code === "forbidden") {
    return { ok: false, code: "forbidden" };
  }
  return { ok: false, code: "internal_error" };
}
