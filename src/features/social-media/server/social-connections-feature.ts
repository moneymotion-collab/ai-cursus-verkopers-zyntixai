/**
 * Server-only Social Connection application availability gates.
 *
 * Rollout control only — not primary connection authorization.
 * Missing/malformed values are OFF. No NEXT_PUBLIC_ variants.
 */

import {
  parseSocialConnectionsEnabled,
  parseSocialInstagramConnectionsEnabled,
} from "@/features/social-media/domain/feature-gate";

export {
  parseSocialConnectionsEnabled,
  parseSocialInstagramConnectionsEnabled,
};

export function isSocialConnectionsFeatureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return parseSocialConnectionsEnabled(env.SOCIAL_CONNECTIONS_ENABLED);
}

export function isSocialInstagramConnectionsFeatureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    parseSocialConnectionsEnabled(env.SOCIAL_CONNECTIONS_ENABLED) &&
    parseSocialInstagramConnectionsEnabled(
      env.SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED,
    )
  );
}
