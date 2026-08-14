import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";
import {
  mapSocialOAuthReturnPathId,
  type SocialOAuthReturnPathId,
} from "@/features/social-media/domain/oauth-intent";

/**
 * Resolve a closed Social OAuth return-path ID through the trusted
 * allowlisted return-path helper. Never an open redirect.
 */
export function resolveSocialOAuthSafeReturnPath(
  id: SocialOAuthReturnPathId,
): string {
  return resolveSafeReturnPath(mapSocialOAuthReturnPathId(id));
}
