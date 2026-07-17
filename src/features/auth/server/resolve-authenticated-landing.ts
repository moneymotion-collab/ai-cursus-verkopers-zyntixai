import type { SupabaseClient } from "@supabase/supabase-js";
import { listActiveOrganizationMemberships } from "@/features/organizations/server/resolve-organization-context";
import type { Database } from "@/types/database";
import {
  DEFAULT_RETURN_PATH,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";

/**
 * Membership-aware default landing after authentication.
 * Reuses existing organization listing; does not trust browser org IDs.
 * Zero-membership users go to registration recovery — never product routes.
 */
export async function resolveAuthenticatedLanding(
  supabase: SupabaseClient<Database>,
): Promise<string> {
  const membershipsResult = await listActiveOrganizationMemberships(supabase);

  if (!membershipsResult.ok || membershipsResult.memberships.length === 0) {
    return "/register/complete";
  }

  if (membershipsResult.memberships.length === 1) {
    const organizationId = membershipsResult.memberships[0].organizationId;
    return `/leads?org=${encodeURIComponent(organizationId)}`;
  }

  return "/leads";
}

/**
 * Post-login destination: allowlisted return path, with `/` resolved via org landing.
 */
export async function resolvePostLoginDestination(
  supabase: SupabaseClient<Database>,
  rawNext: unknown,
): Promise<string> {
  const safeNext = resolveSafeReturnPath(rawNext, DEFAULT_RETURN_PATH);

  const membershipsResult = await listActiveOrganizationMemberships(supabase);
  if (!membershipsResult.ok || membershipsResult.memberships.length === 0) {
    return "/register/complete";
  }

  if (safeNext === "/" || safeNext === DEFAULT_RETURN_PATH) {
    return resolveAuthenticatedLanding(supabase);
  }

  return safeNext;
}
