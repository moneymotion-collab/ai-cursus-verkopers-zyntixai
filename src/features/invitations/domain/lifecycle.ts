import {
  isOrganizationInvitationCredentialValid,
  isOrganizationInvitationEffectivelyExpired,
  type OrganizationInvitationCredentialInput,
} from "@/features/invitations/domain/expiry";
import { isTerminalOrganizationInvitationStatus } from "@/features/invitations/domain/status";
import type { OrganizationInvitationStatus } from "@/features/invitations/domain/types";

export type OrganizationInvitationLifecycleInput =
  OrganizationInvitationCredentialInput;

/**
 * Acceptable: pending + unexpired credential.
 */
export function isOrganizationInvitationAcceptable(
  input: OrganizationInvitationLifecycleInput,
): boolean {
  return isOrganizationInvitationCredentialValid(input);
}

/**
 * Resendable: pending + unexpired credential.
 * Effective-expired / terminal rows are not resendable (create new invite instead).
 */
export function isOrganizationInvitationResendable(
  input: OrganizationInvitationLifecycleInput,
): boolean {
  return isOrganizationInvitationCredentialValid(input);
}

/**
 * Revocable: any still-pending invitation, including effective-expired pending
 * rows not yet materialized as expired (contract §19).
 * Terminal statuses are not revocable via normal lifecycle.
 */
export function isOrganizationInvitationRevocable(
  input: Pick<OrganizationInvitationLifecycleInput, "status">,
): boolean {
  return input.status === "pending";
}

export function isOrganizationInvitationLifecycleTerminal(
  status: OrganizationInvitationStatus,
): boolean {
  return isTerminalOrganizationInvitationStatus(status);
}

export function isOrganizationInvitationLifecycleEffectivelyExpired(
  input: OrganizationInvitationLifecycleInput,
): boolean {
  return isOrganizationInvitationEffectivelyExpired(input);
}
