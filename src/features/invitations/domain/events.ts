import type { OrganizationInvitationEventType } from "@/features/invitations/domain/types";

export const ORGANIZATION_INVITATION_EVENT_TYPES = [
  "invitation_created",
  "invitation_resent",
  "invitation_revoked",
  "invitation_accepted",
] as const satisfies readonly OrganizationInvitationEventType[];

export function isOrganizationInvitationEventType(
  value: string,
): value is OrganizationInvitationEventType {
  return (ORGANIZATION_INVITATION_EVENT_TYPES as readonly string[]).includes(
    value,
  );
}
