/**
 * Durable Social Account Connection lifecycle (SMM-B1.0).
 * Temporary provider outage is a health overlay, not a lifecycle state.
 * There is no generic `error` status.
 */

export const SOCIAL_CONNECTION_STATUSES = [
  "initiated",
  "authorization_pending",
  "connected",
  "reauthorization_required",
  "permission_missing",
  "revoked",
  "disconnected",
] as const;

export type SocialConnectionStatus =
  (typeof SOCIAL_CONNECTION_STATUSES)[number];

/** Non-terminal operational rows. */
export const ACTIVE_SOCIAL_CONNECTION_STATUSES = [
  "initiated",
  "authorization_pending",
  "connected",
  "reauthorization_required",
  "permission_missing",
] as const satisfies readonly SocialConnectionStatus[];

/**
 * Terminal until a new connect/reconnect generation.
 * Historical row is retained.
 */
export const TERMINAL_SOCIAL_CONNECTION_STATUSES = [
  "revoked",
  "disconnected",
] as const satisfies readonly SocialConnectionStatus[];

/** Statuses that may use discovered capabilities against the provider. */
export const CAPABILITY_ELIGIBLE_SOCIAL_CONNECTION_STATUSES = [
  "connected",
] as const satisfies readonly SocialConnectionStatus[];

export const REAUTHORIZATION_REQUIRED_SOCIAL_CONNECTION_STATUSES = [
  "reauthorization_required",
] as const satisfies readonly SocialConnectionStatus[];

export function isSocialConnectionStatus(
  value: string,
): value is SocialConnectionStatus {
  return (SOCIAL_CONNECTION_STATUSES as readonly string[]).includes(value);
}

export function isActiveSocialConnectionStatus(
  status: SocialConnectionStatus,
): boolean {
  return (
    ACTIVE_SOCIAL_CONNECTION_STATUSES as readonly SocialConnectionStatus[]
  ).includes(status);
}

export function isTerminalSocialConnectionStatus(
  status: SocialConnectionStatus,
): boolean {
  return (
    TERMINAL_SOCIAL_CONNECTION_STATUSES as readonly SocialConnectionStatus[]
  ).includes(status);
}

export function isCapabilityEligibleSocialConnectionStatus(
  status: SocialConnectionStatus,
): boolean {
  return (
    CAPABILITY_ELIGIBLE_SOCIAL_CONNECTION_STATUSES as readonly SocialConnectionStatus[]
  ).includes(status);
}

export function isSocialConnectionReauthorizationRequired(
  status: SocialConnectionStatus,
): boolean {
  return (
    REAUTHORIZATION_REQUIRED_SOCIAL_CONNECTION_STATUSES as readonly SocialConnectionStatus[]
  ).includes(status);
}
