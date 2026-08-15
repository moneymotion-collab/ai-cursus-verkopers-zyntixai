/**
 * Universal capability availability and adapter seam contracts (SMM-B1.1-D).
 *
 * Design-only typed contracts. No fake provider implementations.
 * Existing Beta 1 capability IDs in capabilities.ts remain authoritative
 * for the Instagram Provider-1 snapshot CHECK allowlist.
 */

import type { SocialBeta1Capability } from "./capabilities";
import type { ImplementedSocialProvider } from "./provider";
import type { PlannedSocialProvider } from "./planned-providers";

/**
 * Why a capability is or is not usable for a connection/account.
 * Prefer this over `if (provider === "instagram")` in core logic.
 */
export const SOCIAL_CAPABILITY_AVAILABILITY_STATES = [
  "supported",
  "unsupported",
  "unavailable",
  "requires_permission",
  "requires_reauthorization",
  "temporarily_unavailable",
] as const;

export type SocialCapabilityAvailabilityState =
  (typeof SOCIAL_CAPABILITY_AVAILABILITY_STATES)[number];

export function isSocialCapabilityAvailabilityState(
  value: string,
): value is SocialCapabilityAvailabilityState {
  return (SOCIAL_CAPABILITY_AVAILABILITY_STATES as readonly string[]).includes(
    value,
  );
}

/**
 * Future capability catalog beyond the locked Beta 1 Instagram snapshot.
 * These IDs are architectural targets. They are NOT granted by DB CHECKs today
 * and must not be treated as implemented authorization.
 */
export const SOCIAL_UNIVERSAL_CAPABILITY_CATALOG = [
  // Existing Beta 1 IDs (preserved)
  "publish_image",
  "publish_video",
  "publish_carousel",
  "publish_story",
  "publish_short",
  "schedule_via_provider",
  "fetch_metrics",
  "account_insights",
  // Deferred / future (architecture only)
  "publish_text",
  "comments",
  "delete_publication",
  "edit_publication",
  "direct_messages",
  "paid_ads",
  "community_comments_read",
  "community_comments_reply",
  "community_messages_read",
  "community_messages_send",
] as const;

export type SocialUniversalCapabilityId =
  (typeof SOCIAL_UNIVERSAL_CAPABILITY_CATALOG)[number];

export type SocialCapabilityResolution = {
  capability: SocialUniversalCapabilityId | SocialBeta1Capability;
  availability: SocialCapabilityAvailabilityState;
  provider: PlannedSocialProvider | ImplementedSocialProvider;
  observedAt?: string;
  reasonCode?: string;
};

/**
 * Capability-segmented provider adapter seams.
 * Providers implement only the segments they support.
 * Unsupported segments must fail explicitly — never silent no-op.
 */
export type SocialConnectionProviderAdapter = {
  readonly provider: PlannedSocialProvider;
  readonly segment: "connection";
};

export type SocialPublishingProviderAdapter = {
  readonly provider: PlannedSocialProvider;
  readonly segment: "publishing";
};

export type SocialAnalyticsProviderAdapter = {
  readonly provider: PlannedSocialProvider;
  readonly segment: "analytics";
};

export type SocialCommunityProviderAdapter = {
  readonly provider: PlannedSocialProvider;
  readonly segment: "community";
};

export type SocialMessagingProviderAdapter = {
  readonly provider: PlannedSocialProvider;
  readonly segment: "messaging";
};

export type SocialProviderAdapterSegment =
  | SocialConnectionProviderAdapter
  | SocialPublishingProviderAdapter
  | SocialAnalyticsProviderAdapter
  | SocialCommunityProviderAdapter
  | SocialMessagingProviderAdapter;

/**
 * Autopilot / AI action authorization classes (governance contract).
 * AI recommendations never imply mutation rights.
 */
export const SOCIAL_ACTION_AUTHORIZATION_CLASSES = [
  "observe_only",
  "recommend",
  "draft",
  "approval_required",
  "explicit_autopilot_allowed",
  "never_autonomous",
] as const;

export type SocialActionAuthorizationClass =
  (typeof SOCIAL_ACTION_AUTHORIZATION_CLASSES)[number];

/**
 * Data provenance categories for Social OS truth hierarchy.
 */
export const SOCIAL_DATA_PROVENANCE_KINDS = [
  "provider_observed",
  "user_entered",
  "system_derived",
  "ai_inferred",
  "manually_verified",
] as const;

export type SocialDataProvenanceKind =
  (typeof SOCIAL_DATA_PROVENANCE_KINDS)[number];

/**
 * Beta 1 vs later classification for roadmap objects.
 */
export const SOCIAL_SCOPE_CLASSIFICATIONS = [
  "beta_1_required",
  "beta_1_optional",
  "post_beta_1",
  "future_provider_dependent",
] as const;

export type SocialScopeClassification =
  (typeof SOCIAL_SCOPE_CLASSIFICATIONS)[number];
