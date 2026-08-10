import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import {
  completeOwnerProvisioning,
  isEmailVerified,
} from "@/features/auth/server/complete-owner-provisioning";
import { resolveAuthenticatedLanding } from "@/features/auth/server/resolve-authenticated-landing";
import { isPublicRegistrationEnabled } from "@/features/auth/server/public-registration";
import {
  hasTrustedInvitationAuthContext,
  type InvitationAuthState,
  type InvitationCookieBag,
  resolveInvitationAuthState,
} from "@/features/invitations/server/resolve-invitation-auth-state";

export type PostAuthDestination =
  | { kind: "product"; path: string }
  | { kind: "verify_email"; path: "/register/check-email" }
  | { kind: "complete_registration"; path: "/register/complete" }
  | { kind: "invite_accept"; path: "/invite/accept" }
  | { kind: "register"; path: "/register" };

export const INVITE_ACCEPT_PATH = "/invite/accept" as const;
export const REGISTER_COMPLETE_PATH = "/register/complete" as const;

/**
 * Resolve where an authenticated user should go after login/callback/home.
 * NEVER provisions an owner Organization (OD-APP-B3 / B4).
 */
export async function resolvePostAuthDestination(
  supabase: SupabaseClient<Database>,
  user: User,
  options?: {
    invitationCookies?: InvitationCookieBag;
    invitationState?: InvitationAuthState;
  },
): Promise<PostAuthDestination> {
  if (!isEmailVerified(user)) {
    return { kind: "verify_email", path: "/register/check-email" };
  }

  const inviteState =
    options?.invitationState ??
    resolveInvitationAuthState({
      cookies: options?.invitationCookies ?? {},
      authenticatedUserId: user.id,
    });

  if (hasTrustedInvitationAuthContext(inviteState)) {
    return { kind: "invite_accept", path: INVITE_ACCEPT_PATH };
  }

  const memberships = await listActiveOrganizationMemberships(supabase);
  if (memberships.ok && memberships.memberships.length > 0) {
    return {
      kind: "product",
      path: await resolveAuthenticatedLanding(supabase),
    };
  }

  // Zero memberships: explicit owner completion UI only when public registration on.
  // Flag-off: still land on /register/complete which renders unavailable (no mutation).
  return { kind: "complete_registration", path: REGISTER_COMPLETE_PATH };
}

export async function resolveAuthenticatedEntryPath(
  supabase: SupabaseClient<Database>,
  user: User,
  options?: {
    invitationCookies?: InvitationCookieBag;
  },
): Promise<string> {
  const destination = await resolvePostAuthDestination(supabase, user, options);
  return destination.path;
}

/**
 * Explicit owner-provisioning helper for completeRegistrationAction ONLY.
 * Automatic callers must use resolvePostAuthDestination instead.
 *
 * OD-APP-B6: refuses when PUBLIC_REGISTRATION_ENABLED is not true.
 */
export async function tryProvisionAndLand(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<{ ok: true; path: string } | { ok: false; path: string }> {
  if (!isEmailVerified(user)) {
    return { ok: false, path: "/register/check-email" };
  }

  const memberships = await listActiveOrganizationMemberships(supabase);
  if (memberships.ok && memberships.memberships.length > 0) {
    return {
      ok: true,
      path: await resolveAuthenticatedLanding(supabase),
    };
  }

  if (!isPublicRegistrationEnabled()) {
    return { ok: false, path: REGISTER_COMPLETE_PATH };
  }

  const provisioned = await completeOwnerProvisioning(supabase, user);
  if (!provisioned.ok) {
    return { ok: false, path: REGISTER_COMPLETE_PATH };
  }

  return {
    ok: true,
    path: `/onboarding?org=${encodeURIComponent(provisioned.organizationId)}`,
  };
}
