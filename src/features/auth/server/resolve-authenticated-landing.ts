import type { SupabaseClient } from "@supabase/supabase-js";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import type { Database } from "@/types/database";
import {
  DEFAULT_RETURN_PATH,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";
import { resolveOnboardingLifecycleDestination } from "@/features/onboarding/domain/onboarding-lifecycle";
import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import { buildOperatingModelOnboardingPath } from "@/features/onboarding/domain/operating-model";
import { resolveOrganizationOnboardingLifecycle } from "@/features/onboarding/server/resolve-onboarding-lifecycle";
import { shouldResumeInvitationAdmissionBeforeOwnerCompletion } from "@/features/invitations/server/invitations-feature";
import {
  hasTrustedInvitationAuthContext,
  type InvitationCookieBag,
  resolveInvitationAuthState,
} from "@/features/invitations/server/resolve-invitation-auth-state";

async function resolveOrganizationLanding(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  membershipRole: string,
): Promise<string> {
  const lifecycle = await resolveOrganizationOnboardingLifecycle(
    supabase,
    organizationId,
  );
  if (!lifecycle.ok) {
    return membershipRole === "owner"
      ? buildOnboardingPath(organizationId)
      : buildProductDestination(organizationId);
  }

  const destination = resolveOnboardingLifecycleDestination(
    lifecycle.state,
    lifecycle.membershipRole,
  );
  if (destination.availableRoute === "operating_model") {
    return buildOperatingModelOnboardingPath(organizationId);
  }
  if (destination.availableRoute === "onboarding") {
    return buildOnboardingPath(organizationId);
  }
  return buildProductDestination(organizationId);
}

/**
 * Membership-aware default landing after authentication.
 * Incomplete first-run onboarding routes to /onboarding before CRM.
 */
export async function resolveAuthenticatedLanding(
  supabase: SupabaseClient<Database>,
): Promise<string> {
  const membershipsResult = await listActiveOrganizationMemberships(supabase);

  if (!membershipsResult.ok || membershipsResult.memberships.length === 0) {
    if (shouldResumeInvitationAdmissionBeforeOwnerCompletion()) {
      return "/invite/accept";
    }
    return "/register/complete";
  }

  if (membershipsResult.memberships.length === 1) {
    const membership = membershipsResult.memberships[0]!;
    return resolveOrganizationLanding(
      supabase,
      membership.organizationId,
      membership.role,
    );
  }

  return "/home";
}

/**
 * Post-login destination: allowlisted return path, with `/` resolved via org landing.
 * Product return paths for incomplete orgs are rewritten to onboarding.
 *
 * Zero-membership users never auto-provision. Trusted Invitation context and
 * PATH B (invitations ON, public registration OFF) resume `/invite/accept`
 * instead of generic workspace creation.
 */
export async function resolvePostLoginDestination(
  supabase: SupabaseClient<Database>,
  rawNext: unknown,
  options?: {
    invitationCookies?: InvitationCookieBag;
    authenticatedUserId?: string | null;
  },
): Promise<string> {
  const safeNext = resolveSafeReturnPath(rawNext, DEFAULT_RETURN_PATH);

  const inviteState = resolveInvitationAuthState({
    cookies: options?.invitationCookies ?? {},
    authenticatedUserId: options?.authenticatedUserId ?? null,
  });

  if (hasTrustedInvitationAuthContext(inviteState)) {
    return "/invite/accept";
  }

  const membershipsResult = await listActiveOrganizationMemberships(supabase);
  if (!membershipsResult.ok || membershipsResult.memberships.length === 0) {
    if (shouldResumeInvitationAdmissionBeforeOwnerCompletion()) {
      return "/invite/accept";
    }
    return "/register/complete";
  }

  if (safeNext === "/" || safeNext === DEFAULT_RETURN_PATH) {
    return resolveAuthenticatedLanding(supabase);
  }

  // Do not honor /invite/accept from client next without trusted Invitation context.
  const pathname = safeNext.split("?")[0] ?? safeNext;
  if (pathname === "/invite/accept") {
    return resolveAuthenticatedLanding(supabase);
  }

  let orgFromNext: string | undefined;
  try {
    const parsed = new URL(safeNext, "http://zyntix.local");
    orgFromNext = parsed.searchParams.get("org") ?? undefined;
  } catch {
    orgFromNext = undefined;
  }

  if (membershipsResult.memberships.length === 1) {
    const membership = membershipsResult.memberships[0]!;
    const lifecycleDestination = await resolveOrganizationLanding(
      supabase,
      membership.organizationId,
      membership.role,
    );
    if (
      pathname === "/onboarding" ||
      pathname === "/onboarding/operating-model" ||
      lifecycleDestination.includes("/onboarding")
    ) {
      return lifecycleDestination;
    }
  } else if (orgFromNext) {
    const match = membershipsResult.memberships.find(
      (membership) => membership.organizationId === orgFromNext,
    );
    if (match) {
      const lifecycleDestination = await resolveOrganizationLanding(
        supabase,
        match.organizationId,
        match.role,
      );
      if (
        pathname === "/onboarding" ||
        pathname === "/onboarding/operating-model" ||
        lifecycleDestination.includes("/onboarding")
      ) {
        return lifecycleDestination;
      }
    }
  }

  return safeNext;
}
