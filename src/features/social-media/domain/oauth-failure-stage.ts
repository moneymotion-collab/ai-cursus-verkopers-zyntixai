/**
 * Opaque post-consume Instagram OAuth failure stages (SMM-B1.7-R1).
 * Safe for URL query only. Never include tokens, codes, secrets, or provider bodies.
 */

export const SOCIAL_OAUTH_FAILURE_STAGE_QUERY = "social_oauth_stage" as const;

export const SOCIAL_OAUTH_FAILURE_STAGES = [
  "authorization_code_exchange",
  "long_lived_token_exchange",
  "professional_identity_fetch",
  "credential_encrypt_or_upsert",
  "connection_finalize",
] as const;

export type SocialOAuthFailureStage =
  (typeof SOCIAL_OAUTH_FAILURE_STAGES)[number];

export function isSocialOAuthFailureStage(
  value: string,
): value is SocialOAuthFailureStage {
  return (SOCIAL_OAUTH_FAILURE_STAGES as readonly string[]).includes(value);
}
