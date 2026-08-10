import type { SupabaseClient } from "@supabase/supabase-js";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import type { Database } from "@/types/database";
import {
  DEFAULT_RETURN_PATH,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";
import { isOnboardingComplete } from "@/features/onboarding/domain/onboarding-types";
import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import {
  hasTrustedInvitationAuthContext,
  type InvitationCookieBag,
  resolveInvitationAuthState,
} from "@/features/invitations/server/resolve-invitation-auth-state";

async function isOrganizationOnboardingComplete(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("organizations")
    .select("onboarding_completed_at")
    .eq("id", organizationId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return isOnboardingComplete(data.onboarding_completed_at);
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
    return "/register/complete";
  }

  if (membershipsResult.memberships.length === 1) {
    const membership = membershipsResult.memberships[0]!;
    const organizationId = membership.organizationId;
    const complete = await isOrganizationOnboardingComplete(
      supabase,
      organizationId,
    );
    if (!complete && membership.role === "owner") {
      return buildOnboardingPath(organizationId);
    }
    return buildProductDestination(organizationId);
  }

  return "/leads";
}

/**
 * Post-login destination: allowlisted return path, with `/` resolved via org landing.
 * Product return paths for incomplete orgs are rewritten to onboarding.
 *
 * Zero-membership users never auto-provision. Trusted Invitation context may
 * honor safe `/invite/accept`; otherwise route to `/register/complete`.
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

  if (pathname === "/onboarding") {
    return safeNext;
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
    const organizationId = membership.organizationId;
    const complete = await isOrganizationOnboardingComplete(
      supabase,
      organizationId,
    );
    if (!complete && membership.role === "owner") {
      return buildOnboardingPath(organizationId);
    }
  } else if (orgFromNext) {
    const match = membershipsResult.memberships.find(
      (membership) => membership.organizationId === orgFromNext,
    );
    if (match && match.role === "owner") {
      const complete = await isOrganizationOnboardingComplete(
        supabase,
        match.organizationId,
      );
      if (!complete) {
        return buildOnboardingPath(match.organizationId);
      }
    }
  }

  return safeNext;
}
