import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSocialClosedBetaEnrollmentStatus } from "@/features/social-media/server/social-closed-beta-enrollment";
import { resolveSocialNavVisible } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import { SOCIAL_NAV_VISIBLE } from "@/features/social-media/domain/social-navigation";

/**
 * Presentation-only Social primary-nav visibility for one organization.
 * Fail-closed. Does not grant Social route or mutation authority.
 */
export async function loadSocialPrimaryNavVisibility(
  organizationId: string,
): Promise<boolean> {
  if (!SOCIAL_NAV_VISIBLE) {
    return false;
  }

  const id = organizationId.trim();
  if (!id) {
    return false;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const loaded = await loadSocialClosedBetaEnrollmentStatus(supabase, id);
    if (!loaded.ok) {
      return false;
    }
    return resolveSocialNavVisible({ enrollmentStatus: loaded.status });
  } catch {
    return false;
  }
}
