/**
 * Connection health overlay — distinct from durable lifecycle.
 * `provider_unavailable` must not be modeled as disconnect.
 */

export const SOCIAL_CONNECTION_HEALTH_OVERLAYS = [
  "healthy",
  "degraded",
  "provider_unavailable",
] as const;

export type SocialConnectionHealthOverlay =
  (typeof SOCIAL_CONNECTION_HEALTH_OVERLAYS)[number];

export function isSocialConnectionHealthOverlay(
  value: string,
): value is SocialConnectionHealthOverlay {
  return (SOCIAL_CONNECTION_HEALTH_OVERLAYS as readonly string[]).includes(
    value,
  );
}
