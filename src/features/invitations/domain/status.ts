import type { OrganizationInvitationStatus } from "@/features/invitations/domain/types";

export const ORGANIZATION_INVITATION_STATUSES = [
  "pending",
  "accepted",
  "revoked",
  "expired",
] as const satisfies readonly OrganizationInvitationStatus[];

export const TERMINAL_ORGANIZATION_INVITATION_STATUSES = [
  "accepted",
  "revoked",
  "expired",
] as const satisfies readonly OrganizationInvitationStatus[];

export const NON_TERMINAL_ORGANIZATION_INVITATION_STATUSES = [
  "pending",
] as const satisfies readonly OrganizationInvitationStatus[];

export function isOrganizationInvitationStatus(
  value: string,
): value is OrganizationInvitationStatus {
  return (ORGANIZATION_INVITATION_STATUSES as readonly string[]).includes(value);
}

export function isTerminalOrganizationInvitationStatus(
  status: OrganizationInvitationStatus,
): boolean {
  return (
    TERMINAL_ORGANIZATION_INVITATION_STATUSES as readonly OrganizationInvitationStatus[]
  ).includes(status);
}

export function isNonTerminalOrganizationInvitationStatus(
  status: OrganizationInvitationStatus,
): boolean {
  return (
    NON_TERMINAL_ORGANIZATION_INVITATION_STATUSES as readonly OrganizationInvitationStatus[]
  ).includes(status);
}
