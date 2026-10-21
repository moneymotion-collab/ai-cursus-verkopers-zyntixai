import "server-only";

import type { InvitationDeliveryOperation } from "@/features/invitations/server/delivery/types";

/**
 * Authoritative credential-generation marker for invitation email delivery.
 * Uses invitation id + operation + authoritative expires_at from the mutation RPC.
 * Never derived from raw token or recipient email.
 */
export function buildInvitationDeliveryGenerationKey(input: {
  invitationId: string;
  operation: InvitationDeliveryOperation;
  expiresAt: string | null;
}): string {
  const expires = input.expiresAt?.trim() || "none";
  return `${input.operation}:${input.invitationId}:${expires}`;
}

/**
 * Provider-visible idempotency key for one logical delivery generation.
 * Opaque internal IDs only — no token, email, or secrets.
 */
export function buildInvitationDeliveryIdempotencyKey(input: {
  invitationId: string;
  operation: InvitationDeliveryOperation;
  expiresAt: string | null;
}): string {
  const generation = buildInvitationDeliveryGenerationKey(input);
  return `invite-delivery/${generation}`;
}
