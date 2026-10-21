import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { getPublicSupabaseEnv } from "@/lib/env/public";
import { handleInstagramOAuthCallback } from "@/features/social-media/server/handle-instagram-oauth-callback";
import {
  buildSocialOAuthIntentCookieOptions,
  isSocialOAuthIntentCookieValue,
  shouldUseSecureSocialOAuthIntentCookie,
  SOCIAL_OAUTH_INTENT_COOKIE_NAME,
} from "@/features/social-media/server/oauth-intent-cookie";
import { buildDefaultSocialOAuthFailurePath } from "@/features/social-media/server/oauth-callback-redirect";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

export const dynamic = "force-dynamic";

/**
 * Instagram Login OAuth callback.
 * Server-only: validates state, consumes intent, exchanges code, encrypts credential.
 * Never logs code/state/tokens. Token-free allowlisted redirect only.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const cookiesToSet: CookieToSet[] = [];

  const { url, publishableKey } = getPublicSupabaseEnv();
  const supabase = createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(incoming) {
        cookiesToSet.splice(0, cookiesToSet.length, ...incoming);
      },
    },
  });

  function finalize(targetPath: string, clearIntentCookie: boolean) {
    const response = NextResponse.redirect(new URL(targetPath, origin), 303);
    response.headers.set("Cache-Control", "no-store");
    cookiesToSet.forEach(({ name, value, options }) => {
      response.cookies.set(name, value, options);
    });
    if (clearIntentCookie) {
      const secure = shouldUseSecureSocialOAuthIntentCookie(request.url);
      response.cookies.set(
        SOCIAL_OAUTH_INTENT_COOKIE_NAME,
        "",
        buildSocialOAuthIntentCookieOptions(0, secure),
      );
    }
    return response;
  }

  try {
    const rawIntentCookie = request.cookies.get(
      SOCIAL_OAUTH_INTENT_COOKIE_NAME,
    )?.value;
    const intentIdFromCookie = isSocialOAuthIntentCookieValue(rawIntentCookie)
      ? rawIntentCookie.trim()
      : null;

    const result = await handleInstagramOAuthCallback(
      supabase,
      {
        query: {
          code: searchParams.get("code"),
          state: searchParams.get("state"),
          error: searchParams.get("error"),
          error_reason: searchParams.get("error_reason"),
          error_description: searchParams.get("error_description"),
        },
        intentIdFromCookie,
      },
    );

    return finalize(result.redirectPath, result.clearIntentCookie);
  } catch {
    return finalize(
      buildDefaultSocialOAuthFailurePath("connection_failed"),
      true,
    );
  }
}
