import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import {
  completeOwnerProvisioning,
  isEmailVerified,
} from "@/features/auth/server/complete-owner-provisioning";
import { resolveAuthenticatedLanding } from "@/features/auth/server/resolve-authenticated-landing";

export type PostAuthDestination =
  | { kind: "product"; path: string }
  | { kind: "verify_email"; path: "/register/check-email" }
  | { kind: "complete_registration"; path: "/register/complete" }
  | { kind: "register"; path: "/register" };

/**
 * Resolve where an authenticated user should go after login/callback/home.
 * Zero-membership users never land on product routes as a happy path.
 */
export async function resolvePostAuthDestination(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<PostAuthDestination> {
  const memberships = await listActiveOrganizationMemberships(supabase);

  if (memberships.ok && memberships.memberships.length > 0) {
    return {
      kind: "product",
      path: await resolveAuthenticatedLanding(supabase),
    };
  }

  if (!isEmailVerified(user)) {
    return { kind: "verify_email", path: "/register/check-email" };
  }

  // Verified but unprovisioned: always resume via /register/complete.
  return { kind: "complete_registration", path: "/register/complete" };
}

export async function resolveAuthenticatedEntryPath(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<string> {
  const destination = await resolvePostAuthDestination(supabase, user);
  return destination.path;
}

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

  const provisioned = await completeOwnerProvisioning(supabase, user);
  if (!provisioned.ok) {
    return { ok: false, path: "/register/complete" };
  }

  return {
    ok: true,
    path: `/onboarding?org=${encodeURIComponent(provisioned.organizationId)}`,
  };
}
