import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  buildSocialClosedBetaCustomerReadModel,
  type SocialClosedBetaCustomerReadModel,
} from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import {
  isSocialClosedBetaEffectiveStatus,
  type SocialClosedBetaEffectiveStatus,
  type SocialClosedBetaOperatorAction,
} from "@/features/social-media/domain/closed-beta-enrollment";
import { isSocialPublishingFeatureEnabled } from "@/features/social-media/server/social-publishing-feature";

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string } | null;
  }>;
};

function asRows(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter(
    (row): row is Record<string, unknown> =>
      !!row && typeof row === "object" && !Array.isArray(row),
  );
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asStatus(value: unknown): SocialClosedBetaEffectiveStatus {
  const raw = asString(value) ?? "not_enrolled";
  return isSocialClosedBetaEffectiveStatus(raw) ? raw : "not_enrolled";
}

export type OperatorOrgListItem = {
  organizationId: string;
  organizationName: string;
  organizationStatus: string;
  enrollmentStatus: SocialClosedBetaEffectiveStatus;
  enrollmentUpdatedAt: string | null;
  hasSocialWorkspace: boolean;
  instagramConnectionCount: number;
  healthyInstagramConnectionCount: number;
  credentialPresentCount: number;
  publishImageCapabilityCount: number;
  activePublicationCount: number;
  queuedPublicationCount: number;
  hasOwnerOrAdmin: boolean;
  lastSocialActivityAt: string | null;
  diagnostic: SocialClosedBetaCustomerReadModel;
};

export type OperatorEnrollmentEvent = {
  eventId: string;
  eventType: string;
  previousStatus: string | null;
  nextStatus: string;
  actorSource: string;
  actorUserId: string | null;
  reason: string | null;
  createdAt: string;
};

export type OperatorOrgDetail = OperatorOrgListItem & {
  statusBeforePause: "approved" | "publishing_allowed" | null;
  enrollmentReason: string | null;
  enrollmentCreatedAt: string | null;
  approvedAt: string | null;
  publishingAllowedAt: string | null;
  pausedAt: string | null;
  revokedAt: string | null;
  reauthorizationRequiredCount: number;
  succeededPublicationCount: number;
  events: OperatorEnrollmentEvent[];
  availableActions: SocialClosedBetaOperatorAction[];
};

function availableActionsFor(
  status: SocialClosedBetaEffectiveStatus,
  statusBeforePause: "approved" | "publishing_allowed" | null,
): SocialClosedBetaOperatorAction[] {
  switch (status) {
    case "not_enrolled":
      return ["enroll_approved"];
    case "approved":
      return ["allow_publishing", "pause", "revoke"];
    case "publishing_allowed":
      return ["pause", "revoke"];
    case "paused":
      return statusBeforePause ? ["resume", "revoke"] : ["revoke"];
    case "revoked":
      return [];
    default:
      return [];
  }
}

export async function listOperatorClosedBetaOrganizations(
  service: SupabaseClient<Database>,
): Promise<OperatorOrgListItem[]> {
  const client = service as unknown as RpcClient;
  const { data, error } = await client.rpc(
    "operator_list_social_closed_beta_organizations",
  );
  if (error) {
    throw new Error("operator_list_failed");
  }

  const globalOn = isSocialPublishingFeatureEnabled();
  return asRows(data).map((row) => {
    const enrollmentStatus = asStatus(row.enrollment_status);
    return {
      organizationId: asString(row.organization_id) ?? "",
      organizationName: asString(row.organization_name) ?? "Organization",
      organizationStatus: asString(row.organization_status) ?? "active",
      enrollmentStatus,
      enrollmentUpdatedAt: asString(row.enrollment_updated_at),
      hasSocialWorkspace: asBoolean(row.has_social_workspace),
      instagramConnectionCount: asNumber(row.instagram_connection_count),
      healthyInstagramConnectionCount: asNumber(
        row.healthy_instagram_connection_count,
      ),
      credentialPresentCount: asNumber(row.credential_present_count),
      publishImageCapabilityCount: asNumber(
        row.publish_image_capability_count,
      ),
      activePublicationCount: asNumber(row.active_publication_count),
      queuedPublicationCount: asNumber(row.queued_publication_count),
      hasOwnerOrAdmin: asBoolean(row.has_owner_or_admin),
      lastSocialActivityAt: asString(row.last_social_activity_at),
      diagnostic: buildSocialClosedBetaCustomerReadModel({
        enrollmentStatus,
        socialPublishingEnabled: globalOn ? "true" : undefined,
      }),
    };
  }).filter((row) => row.organizationId.length > 0);
}

export async function loadOperatorClosedBetaOrganizationDetail(
  service: SupabaseClient<Database>,
  organizationId: string,
): Promise<OperatorOrgDetail | null> {
  const client = service as unknown as RpcClient;
  const { data, error } = await client.rpc(
    "operator_get_social_closed_beta_organization",
    { p_organization_id: organizationId },
  );
  if (error) {
    throw new Error("operator_detail_failed");
  }
  const row = asRows(data)[0];
  if (!row || asString(row.result_code) !== "success") {
    return null;
  }

  const { data: eventData, error: eventError } = await client.rpc(
    "operator_list_social_closed_beta_enrollment_events",
    { p_organization_id: organizationId },
  );
  if (eventError) {
    throw new Error("operator_events_failed");
  }

  const enrollmentStatus = asStatus(row.enrollment_status);
  const beforeRaw = asString(row.status_before_pause);
  const statusBeforePause =
    beforeRaw === "approved" || beforeRaw === "publishing_allowed"
      ? beforeRaw
      : null;
  const globalOn = isSocialPublishingFeatureEnabled();

  const events: OperatorEnrollmentEvent[] = asRows(eventData)
    .filter((ev) => asString(ev.result_code) === "success")
    .map((ev) => ({
      eventId: asString(ev.event_id) ?? "",
      eventType: asString(ev.event_type) ?? "",
      previousStatus: asString(ev.previous_status),
      nextStatus: asString(ev.next_status) ?? "",
      actorSource: asString(ev.actor_source) ?? "platform_operator",
      actorUserId: asString(ev.actor_user_id),
      reason: asString(ev.reason),
      createdAt: asString(ev.created_at) ?? "",
    }))
    .filter((ev) => ev.eventId.length > 0);

  return {
    organizationId: asString(row.organization_id) ?? organizationId,
    organizationName: asString(row.organization_name) ?? "Organization",
    organizationStatus: asString(row.organization_status) ?? "active",
    enrollmentStatus,
    enrollmentUpdatedAt: asString(row.enrollment_updated_at),
    hasSocialWorkspace: asBoolean(row.has_social_workspace),
    instagramConnectionCount: asNumber(row.instagram_connection_count),
    healthyInstagramConnectionCount: asNumber(
      row.healthy_instagram_connection_count,
    ),
    credentialPresentCount: asNumber(row.credential_present_count),
    publishImageCapabilityCount: asNumber(row.publish_image_capability_count),
    activePublicationCount: asNumber(row.active_publication_count),
    queuedPublicationCount: asNumber(row.queued_publication_count),
    hasOwnerOrAdmin: asBoolean(row.has_owner_or_admin),
    lastSocialActivityAt: null,
    diagnostic: buildSocialClosedBetaCustomerReadModel({
      enrollmentStatus,
      socialPublishingEnabled: globalOn ? "true" : undefined,
    }),
    statusBeforePause,
    enrollmentReason: asString(row.enrollment_reason),
    enrollmentCreatedAt: asString(row.enrollment_created_at),
    approvedAt: asString(row.approved_at),
    publishingAllowedAt: asString(row.publishing_allowed_at),
    pausedAt: asString(row.paused_at),
    revokedAt: asString(row.revoked_at),
    reauthorizationRequiredCount: asNumber(row.reauthorization_required_count),
    succeededPublicationCount: asNumber(row.succeeded_publication_count),
    events,
    availableActions: availableActionsFor(enrollmentStatus, statusBeforePause),
  };
}

export type OperatorMutationResult =
  | {
      ok: true;
      previousStatus: string | null;
      nextStatus: string;
      enrollmentId: string;
    }
  | {
      ok: false;
      code:
        | "invalid_request"
        | "not_found"
        | "conflict"
        | "invalid_transition"
        | "closed_beta_not_enrolled"
        | "forbidden"
        | "internal_error";
    };

const ACTION_RPC: Record<SocialClosedBetaOperatorAction, string> = {
  enroll_approved: "operator_enroll_social_closed_beta_organization",
  allow_publishing: "operator_allow_social_closed_beta_publishing",
  pause: "operator_pause_social_closed_beta_enrollment",
  resume: "operator_resume_social_closed_beta_enrollment",
  revoke: "operator_revoke_social_closed_beta_enrollment",
};

export async function mutateOperatorClosedBetaEnrollment(
  service: SupabaseClient<Database>,
  input: {
    organizationId: string;
    action: SocialClosedBetaOperatorAction;
    reason?: string | null;
    actorUserId: string;
  },
): Promise<OperatorMutationResult> {
  const rpcName = ACTION_RPC[input.action];
  const client = service as unknown as RpcClient;
  const reason = input.reason?.trim() ?? "";
  if (reason.length > 500) {
    return { ok: false, code: "invalid_request" };
  }

  try {
    const { data, error } = await client.rpc(rpcName, {
      p_organization_id: input.organizationId,
      p_reason: reason.length > 0 ? reason : null,
      p_actor_user_id: input.actorUserId,
    });
    if (error) {
      return { ok: false, code: "internal_error" };
    }
    const row = asRows(data)[0];
    const code = asString(row?.result_code);
    if (code === "success") {
      return {
        ok: true,
        previousStatus: asString(row?.previous_status),
        nextStatus: asString(row?.next_status) ?? "",
        enrollmentId: asString(row?.enrollment_id) ?? "",
      };
    }
    if (
      code === "invalid_input" ||
      code === "not_found" ||
      code === "conflict" ||
      code === "invalid_transition" ||
      code === "closed_beta_not_enrolled" ||
      code === "forbidden"
    ) {
      return {
        ok: false,
        code: code === "invalid_input" ? "invalid_request" : code,
      };
    }
    return { ok: false, code: "internal_error" };
  } catch {
    return { ok: false, code: "internal_error" };
  }
}
