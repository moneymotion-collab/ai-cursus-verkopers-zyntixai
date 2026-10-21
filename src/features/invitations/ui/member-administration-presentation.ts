import type {
  MemberAdminMember,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";

function formatDateLabel(
  value: string | null | undefined,
  timeZone: string,
): string {
  if (!value) {
    return "—";
  }

  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function titleCaseRole(role: string): string {
  if (!role) {
    return "Unknown";
  }
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export type MemberAdminMemberPresentation = {
  membershipId: string;
  displayName: string;
  roleLabel: string;
  statusLabel: string;
  joinedAtLabel: string;
};

export type PendingInvitationPresentation = {
  invitationId: string;
  emailLabel: string;
  roleLabel: string;
  statusLabel: string;
  createdAtLabel: string;
  expiresAtLabel: string;
  inviterLabel: string;
};

export function toMemberAdminMemberPresentation(
  member: MemberAdminMember,
  timeZone: string,
): MemberAdminMemberPresentation {
  return {
    membershipId: member.membershipId,
    displayName: member.displayName,
    roleLabel: titleCaseRole(member.role),
    statusLabel: "Active",
    joinedAtLabel: formatDateLabel(member.joinedAt, timeZone),
  };
}

export function toPendingInvitationPresentation(
  invitation: PendingInvitationListItem,
  timeZone: string,
): PendingInvitationPresentation {
  return {
    invitationId: invitation.invitationId,
    emailLabel: invitation.emailNormalized,
    roleLabel: titleCaseRole(invitation.role),
    statusLabel: "Pending",
    createdAtLabel: formatDateLabel(invitation.createdAt, timeZone),
    expiresAtLabel: formatDateLabel(invitation.expiresAt, timeZone),
    inviterLabel: invitation.inviterDisplayName,
  };
}
