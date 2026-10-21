"use server";

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSiteOrigin } from "@/lib/env/site-origin";
import {
  initiateInstagramReauthorization,
  type InitiateInstagramReauthorizationInput,
} from "@/features/social-media/server/initiate-instagram-reauthorization";
import type { SocialReauthorizeResult } from "@/features/social-media/domain/results";
import {
  buildSocialOAuthIntentCookieOptions,
  shouldUseSecureSocialOAuthIntentCookie,
  SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS,
  SOCIAL_OAUTH_INTENT_COOKIE_NAME,
} from "@/features/social-media/server/oauth-intent-cookie";

/**
 * Owner/Admin Instagram reauthorization initiation.
 * Returns authorization URL only; never returns secrets or tokens.
 */
export async function initiateInstagramReauthorizationAction(
  input: InitiateInstagramReauthorizationInput,
): Promise<SocialReauthorizeResult> {
  const supabase = await createSupabaseServerClient();
  const result = await initiateInstagramReauthorization(supabase, input);

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
