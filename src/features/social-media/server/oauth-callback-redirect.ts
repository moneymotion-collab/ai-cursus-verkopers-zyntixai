/**
 * Token-free post-callback continuation redirects.
 * Never echo OAuth code/state/tokens. Controlled outcome codes only.
 * Optional opaque failure stage is allowlisted and credential-free.
 */

import "server-only";

import { resolveSocialOAuthSafeReturnPath } from "@/features/social-media/server/oauth-return-path";
import type { SocialOAuthReturnPathId } from "@/features/social-media/domain/oauth-intent";
import {
  isSocialOAuthFailureStage,
  SOCIAL_OAUTH_FAILURE_STAGE_QUERY,
  type SocialOAuthFailureStage,
} from "@/features/social-media/domain/oauth-failure-stage";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";

export const SOCIAL_OAUTH_OUTCOME_QUERY = "social_oauth" as const;

export {
  SOCIAL_OAUTH_FAILURE_STAGE_QUERY,
  SOCIAL_OAUTH_FAILURE_STAGES,
  isSocialOAuthFailureStage,
  type SocialOAuthFailureStage,
} from "@/features/social-media/domain/oauth-failure-stage";

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
  failureStage?: SocialOAuthFailureStage | null,
): string {
  const base = resolveSocialOAuthSafeReturnPath(returnPathId);
  const params = new URLSearchParams();
  params.set(SOCIAL_OAUTH_OUTCOME_QUERY, outcome);
  if (failureStage && isSocialOAuthFailureStage(failureStage)) {
    params.set(SOCIAL_OAUTH_FAILURE_STAGE_QUERY, failureStage);
  }
  const withQuery = `${base}${base.includes("?") ? "&" : "?"}${params.toString()}`;
  return resolveSafeReturnPath(withQuery, base);
}

export function buildDefaultSocialOAuthFailurePath(
  outcome: SocialOAuthOutcomeCode,
  failureStage?: SocialOAuthFailureStage | null,
): string {
  return buildSocialOAuthContinuationPath(
    "social_workspace",
    outcome,
    failureStage,
  );
}
