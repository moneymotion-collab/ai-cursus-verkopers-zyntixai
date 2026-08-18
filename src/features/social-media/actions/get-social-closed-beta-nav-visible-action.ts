"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSocialNavVisible } from "@/features/social-media/domain/social-closed-beta-customer-read-model";
import { loadSocialClosedBetaEnrollmentStatus } from "@/features/social-media/server/social-closed-beta-enrollment";

/**
 * Presentation-only Social nav visibility for the selected organization.
 * Fail-closed. Does not grant Social mutation authority.
 */
export async function getSocialClosedBetaNavVisibleAction(
  organizationId: string,
): Promise<boolean> {
  const id = organizationId?.trim();
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
