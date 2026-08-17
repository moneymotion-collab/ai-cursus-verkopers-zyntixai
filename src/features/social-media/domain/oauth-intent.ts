import type { SocialLoginProduct } from "./login-product";
import type { ImplementedSocialProvider } from "./provider";
import type {
  SocialMemberId,
  SocialOAuthIntentId,
  SocialOrganizationId,
  SocialWorkspaceId,
} from "./types";

/**
 * Closed return-path identifiers for OAuth continuation.
 * Not a raw URL. Maps through existing safe-return-path architecture.
 */
export const SOCIAL_OAUTH_RETURN_PATH_IDS = ["social_workspace"] as const;

export type SocialOAuthReturnPathId =
  (typeof SOCIAL_OAUTH_RETURN_PATH_IDS)[number];

export function isSocialOAuthReturnPathId(
  value: string,
): value is SocialOAuthReturnPathId {
  return (SOCIAL_OAUTH_RETURN_PATH_IDS as readonly string[]).includes(value);
}

/**
 * Maps a closed return-path ID to an allowlisted internal path.
 * Never returns an open redirect.
 */
export function mapSocialOAuthReturnPathId(
  id: SocialOAuthReturnPathId,
): "/social/r1-instagram-connect" {
  void id;
  return "/social/r1-instagram-connect";
}

export const SOCIAL_OAUTH_INTENT_STATUSES = [
  "pending",
  "consumed",
  "expired",
  "abandoned",
] as const;

export type SocialOAuthIntentStatus =
  (typeof SOCIAL_OAUTH_INTENT_STATUSES)[number];

/**
 * Server-validated OAuth intent. The browser cannot use this as authority.
 * Organization/actor come from trusted session context when the intent is created.
 */
export type SocialOAuthIntent = {
  id: SocialOAuthIntentId;
  provider: ImplementedSocialProvider;
  loginProduct: SocialLoginProduct;
  organizationId: SocialOrganizationId;
  workspaceId: SocialWorkspaceId;
  initiatingActorId: SocialMemberId;
  returnPathId: SocialOAuthReturnPathId;
  status: SocialOAuthIntentStatus;
  createdAt: string;
  expiresAt: string;
  consumedAt: string | null;
};

export function isSocialOAuthIntentExpired(
  intent: SocialOAuthIntent,
  nowIso: string,
): boolean {
  if (intent.status === "expired") {
    return true;
  }
  const expiresAt = Date.parse(intent.expiresAt);
  const now = Date.parse(nowIso);
  if (Number.isNaN(expiresAt) || Number.isNaN(now)) {
    return true;
  }
  return expiresAt <= now;
}

export function isSocialOAuthIntentConsumable(
  intent: SocialOAuthIntent,
  nowIso: string,
): boolean {
  return intent.status === "pending" && !isSocialOAuthIntentExpired(intent, nowIso);
}
