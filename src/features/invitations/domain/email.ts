/**
 * Contract email normalization for organization invitations:
 * trim + lowercase only.
 * Does not validate email shape — Zod owns validity.
 */
export function normalizeOrganizationInvitationEmail(raw: string): string {
  return raw.trim().toLowerCase();
}
