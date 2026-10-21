/**
 * Social Connection audit-event names. Persistence is not this slice.
 * Payloads must never include credential material.
 */

export const SOCIAL_CONNECTION_EVENT_TYPES = [
  "social_connection_initiated",
  "social_connection_established",
  "social_connection_reauthorization_required",
  "social_connection_reauthorized",
  "social_connection_permission_missing",
  "social_connection_revoked",
  "social_connection_disconnected",
  "social_connection_health_changed",
] as const;

export type SocialConnectionEventType =
  (typeof SOCIAL_CONNECTION_EVENT_TYPES)[number];

/**
 * Human mutations resolve to authenticated member identity.
 * Automated provider-health checks must use `system`, not an arbitrary human.
 */
export const SOCIAL_CONNECTION_EVENT_ACTOR_SOURCES = [
  "member",
  "system",
] as const;

export type SocialConnectionEventActorSource =
  (typeof SOCIAL_CONNECTION_EVENT_ACTOR_SOURCES)[number];

export type SocialConnectionAuditEvent = {
  type: SocialConnectionEventType;
  actorSource: SocialConnectionEventActorSource;
  actorUserId: string | null;
  organizationId: string;
  workspaceId: string;
  connectionId: string | null;
  occurredAt: string;
};

export function isSocialConnectionEventType(
  value: string,
): value is SocialConnectionEventType {
  return (SOCIAL_CONNECTION_EVENT_TYPES as readonly string[]).includes(value);
}

export function actorSourceForSocialConnectionEvent(
  type: SocialConnectionEventType,
): SocialConnectionEventActorSource {
  if (type === "social_connection_health_changed") {
    return "system";
  }
  return "member";
}
