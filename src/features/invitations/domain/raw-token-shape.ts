/**
 * Invitation raw-token shape guard (shared, browser-safe).
 * Does not import Node crypto or server-only modules.
 */

export const INVITATION_RAW_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export function isInvitationRawTokenShape(value: unknown): value is string {
  return typeof value === "string" && INVITATION_RAW_TOKEN_PATTERN.test(value);
}
