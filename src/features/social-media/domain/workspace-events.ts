/**
 * Social Workspace audit event contracts (SMM-B1.2).
 */

export const SOCIAL_WORKSPACE_EVENT_TYPES = [
  "social_workspace_created",
  "social_workspace_updated",
  "social_workspace_archived",
] as const;

export type SocialWorkspaceEventType =
  (typeof SOCIAL_WORKSPACE_EVENT_TYPES)[number];

export const SOCIAL_WORKSPACE_EVENT_ACTOR_SOURCES = ["member", "system"] as const;

export type SocialWorkspaceEventActorSource =
  (typeof SOCIAL_WORKSPACE_EVENT_ACTOR_SOURCES)[number];

export function isSocialWorkspaceEventType(
  value: string,
): value is SocialWorkspaceEventType {
  return (SOCIAL_WORKSPACE_EVENT_TYPES as readonly string[]).includes(value);
}
