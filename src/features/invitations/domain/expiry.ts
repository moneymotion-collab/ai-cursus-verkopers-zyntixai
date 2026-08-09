import type { OrganizationInvitationStatus } from "@/features/invitations/domain/types";

export type OrganizationInvitationCredentialInput = {
  status: OrganizationInvitationStatus;
  /** Absolute expiry instant (ISO string or Date). */
  expiresAt: string | Date;
  /** Injected evaluation instant (ISO string or Date). */
  now: string | Date;
};

function parseInstant(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

/**
 * Credential valid iff status === pending AND now < expiresAt.
 * Boundary: now === expiresAt → invalid.
 * Injected `now` — no hidden Date construction for the evaluation clock.
 */
export function isOrganizationInvitationCredentialValid(
  input: OrganizationInvitationCredentialInput,
): boolean {
  if (input.status !== "pending") {
    return false;
  }

  const expiresAt = parseInstant(input.expiresAt);
  const now = parseInstant(input.now);
  if (expiresAt == null || now == null) {
    return false;
  }

  return now.getTime() < expiresAt.getTime();
}

/**
 * Effective expiry: pending row whose clock has reached/passed expiresAt,
 * or already persisted as expired.
 */
export function isOrganizationInvitationEffectivelyExpired(
  input: OrganizationInvitationCredentialInput,
): boolean {
  if (input.status === "expired") {
    return true;
  }
  if (input.status !== "pending") {
    return false;
  }

  const expiresAt = parseInstant(input.expiresAt);
  const now = parseInstant(input.now);
  if (expiresAt == null || now == null) {
    return true;
  }

  return now.getTime() >= expiresAt.getTime();
}
