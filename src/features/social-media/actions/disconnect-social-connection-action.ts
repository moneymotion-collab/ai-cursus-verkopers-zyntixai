"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { disconnectSocialConnection } from "@/features/social-media/server/disconnect-social-connection";
import type { SocialDisconnectResult } from "@/features/social-media/domain/results";
import { SOCIAL_ROUTE } from "@/features/social-media/domain/social-navigation";

/**
 * Owner/Admin Instagram disconnect. Never returns secrets, tokens, or ciphertext.
 * Does not call Meta. Does not enable publishing.
 */
export async function disconnectSocialConnectionAction(input: {
  organizationId: string;
  connectionId: string;
}): Promise<SocialDisconnectResult> {
  const supabase = await createSupabaseServerClient();
  const result = await disconnectSocialConnection(supabase, input);
  if (result.ok) {
    revalidatePath(SOCIAL_ROUTE);
  }
  return result;
}
