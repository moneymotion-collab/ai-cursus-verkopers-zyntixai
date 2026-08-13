/**
 * Narrow Slice 6 fixtures for Member Administration integrated QA.
 * Synthetic orgs/actors/invitations only — not a database simulator.
 */

import type {
  MemberAdminMember,
  PendingInvitationListItem,
} from "@/features/invitations/domain/member-administration-read-types";

export const ORG_A = "11111111-1111-4111-8111-111111111111";
export const ORG_B = "99999999-9999-4999-8999-999999999999";
export const USER_ID = "44444444-4444-4444-8444-444444444444";
export const MEMBERSHIP_ID = "33333333-3333-4333-8333-333333333333";
export const INVITE_ID = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
export const INVITE_ID_B = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
export const SENTINEL_RAW_TOKEN = "RAW_TOKEN_SENTINEL_MUST_NOT_LEAK";
export const FUTURE_EXPIRES = "2099-01-01T00:00:00.000Z";
export const PAST_EXPIRES = "2020-01-01T00:00:00.000Z";

export function readyOrgContext(
  role: "owner" | "admin" | "staff" | "viewer",
  organizationId: string = ORG_A,
) {
  return {
    ok: true as const,
    context: {
      organizationId,
      membershipId: MEMBERSHIP_ID,
      role,
      userId: USER_ID,
    },
  };
}

export function missingOrgContext() {
  return {
    ok: false as const,
    error: {
      code: "ORG_CONTEXT_MISSING" as const,
      message: "Organization membership is unavailable.",
      retryable: false,
      category: "auth" as const,
    },
  };
}

export function pendingManageRecord(
  role: "admin" | "staff" | "viewer",
  overrides?: Partial<{
    invitationId: string;
    status: string;
    expiresAt: string;
  }>,
) {
  return {
    ok: true as const,
    invitation: {
      invitationId: overrides?.invitationId ?? INVITE_ID,
      role,
      status: overrides?.status ?? "pending",
      expiresAt: overrides?.expiresAt ?? FUTURE_EXPIRES,
    },
  };
}

export function pendingListItem(
  overrides?: Partial<PendingInvitationListItem>,
): PendingInvitationListItem {
  return {
    invitationId: INVITE_ID,
    emailNormalized: "invitee@example.com",
    role: "staff",
    status: "pending",
    createdAt: "2026-08-01T00:00:00.000Z",
    expiresAt: FUTURE_EXPIRES,
    invitedByMemberId: MEMBERSHIP_ID,
    inviterDisplayName: "Alex Owner",
    isCredentialValid: true,
    isEffectivelyExpired: false,
    ...overrides,
  };
}

export function activeMember(
  overrides?: Partial<MemberAdminMember>,
): MemberAdminMember {
  return {
    membershipId: MEMBERSHIP_ID,
    displayName: "Alex Owner",
    role: "owner",
    status: "active",
    joinedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}
