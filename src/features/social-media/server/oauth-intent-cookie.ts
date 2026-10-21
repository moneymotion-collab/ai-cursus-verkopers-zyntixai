/**
 * HttpOnly cookie binding OAuth intent id to the browser redirect round-trip.
 * Raw OAuth state remains in the provider redirect only; never stored here.
 */

import "server-only";

export const SOCIAL_OAUTH_INTENT_COOKIE_NAME = "zyntix_social_oauth_intent";

/** Align with intent TTL (DB allows up to 30m; app uses 15m). */
export const SOCIAL_OAUTH_INTENT_COOKIE_MAX_AGE_SECONDS = 15 * 60;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isSocialOAuthIntentCookieValue(
  value: string | undefined | null,
): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

export type SocialOAuthIntentCookieOptions = {
  httpOnly: true;
  sameSite: "lax";
  path: "/";
  maxAge: number;
  secure: boolean;
  expires?: Date;
};

export function buildSocialOAuthIntentCookieOptions(
  maxAge: number,
  secure: boolean,
): SocialOAuthIntentCookieOptions {
  const options: SocialOAuthIntentCookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge,
    secure,
  };
  if (maxAge <= 0) {
    options.expires = new Date(0);
  }
  return options;
}

export function shouldUseSecureSocialOAuthIntentCookie(
  requestUrl: string,
  nodeEnv: string | undefined = process.env.NODE_ENV,
): boolean {
  if (nodeEnv === "production") {
    return true;
  }
  try {
    return new URL(requestUrl).protocol === "https:";
  } catch {
    return false;
  }
}
