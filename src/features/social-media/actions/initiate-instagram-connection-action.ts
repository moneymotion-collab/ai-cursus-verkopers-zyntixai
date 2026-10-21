"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSiteOrigin } from "@/lib/env/site-origin";
import {
  initiateInstagramConnection,
  type InitiateInstagramConnectionInput,
} from "@/features/social-media/server/initiate-instagram-connection";
import type { SocialConnectResult } from "@/features/social-media/domain/results";
import {
  buildSocialOAuthIntentCookieOptions,
  shouldUseSecureSocialOAuthIntentCookie,
  SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS,
  SOCIAL_OAUTH_INTENT_COOKIE_NAME,
} from "@/features/social-media/server/oauth-intent-cookie";

/**
 * Owner/Admin Instagram connect initiation.
 * Organization id is re-verified via active membership — never trusted alone.
 * Returns authorization URL only; never returns secrets, state, or tokens.
 */
export async function initiateInstagramConnectionAction(
  input: InitiateInstagramConnectionInput,
): Promise<SocialConnectResult> {
  const supabase = await createSupabaseServerClient();
  const result = await initiateInstagramConnection(supabase, input);

  if (!result.ok) {
    return result;
  }

  const cookieStore = await cookies();
  const secure = shouldUseSecureSocialOAuthIntentCookie(resolveSiteOrigin());
  cookieStore.set(
    SOCIAL_OAUTH_INTENT_COOKIE_NAME,
    result.intentId,
    buildSocialOAuthIntentCookieOptions(
      SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS,
      secure,
    ),
  );

  return {
    ok: true,
    code: "authorization_redirect",
    authorizationUrl: result.authorizationUrl,
  };
}
