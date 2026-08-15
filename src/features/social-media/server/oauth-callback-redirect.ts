/**
 * Token-free post-callback continuation redirects.
 * Never echo OAuth code/state/tokens. Controlled outcome codes only.
 */

import "server-only";

import { resolveSocialOAuthSafeReturnPath } from "@/features/social-media/server/oauth-return-path";
import type { SocialOAuthReturnPathId } from "@/features/social-media/domain/oauth-intent";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";

export const SOCIAL_OAUTH_OUTCOME_QUERY = "social_oauth" as const;

export const SOCIAL_OAUTH_OUTCOME_CODES = [
  "connected",
  "authorization_denied",
  "authorization_expired",
  "authorization_invalid",
  "authorization_replayed",
  "wrong_actor",
  "unsupported_account",
  "duplicate_connection",
  "rate_limited",
  "configuration_error",
  "provider_unavailable",
  "feature_disabled",
  "connection_failed",
] as const;

export type SocialOAuthOutcomeCode = (typeof SOCIAL_OAUTH_OUTCOME_CODES)[number];

export function isSocialOAuthOutcomeCode(
  value: string,
): value is SocialOAuthOutcomeCode {
  return (SOCIAL_OAUTH_OUTCOME_CODES as readonly string[]).includes(value);
}

export function buildSocialOAuthContinuationPath(
  returnPathId: SocialOAuthReturnPathId,
  outcome: SocialOAuthOutcomeCode,
): string {
  const base = resolveSocialOAuthSafeReturnPath(returnPathId);
  const withQuery = `${base}${base.includes("?") ? "&" : "?"}${SOCIAL_OAUTH_OUTCOME_QUERY}=${outcome}`;
  return resolveSafeReturnPath(withQuery, base);
}

export function buildDefaultSocialOAuthFailurePath(
  outcome: SocialOAuthOutcomeCode,
): string {
  return buildSocialOAuthContinuationPath("social_workspace", outcome);
}
