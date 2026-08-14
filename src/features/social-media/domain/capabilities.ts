import type { ImplementedSocialProvider } from "./provider";
import type { SocialExternalAccountId } from "./types";

/**
 * Beta 1 conceptual capabilities (SMM-B1.0).
 * Comments, DMs, paid ads, and provider-side delete/edit are deferred.
 */

export const SOCIAL_BETA1_CAPABILITIES = [
  "publish_image",
  "publish_video",
  "publish_carousel",
  "publish_story",
  "publish_short",
  "schedule_via_provider",
  "fetch_metrics",
  "account_insights",
] as const;

export type SocialBeta1Capability = (typeof SOCIAL_BETA1_CAPABILITIES)[number];

export const DEFERRED_SOCIAL_CAPABILITIES = [
  "comments",
  "delete_publication",
  "edit_publication",
  "direct_messages",
  "paid_ads",
] as const;

export type DeferredSocialCapability =
  (typeof DEFERRED_SOCIAL_CAPABILITIES)[number];

export function isSocialBeta1Capability(
  value: string,
): value is SocialBeta1Capability {
  return (SOCIAL_BETA1_CAPABILITIES as readonly string[]).includes(value);
}

export function isDeferredSocialCapability(
  value: string,
): value is DeferredSocialCapability {
  return (DEFERRED_SOCIAL_CAPABILITIES as readonly string[]).includes(value);
}

/**
 * Discovery snapshot. Ordinary callers must not mutate this as authorization.
 * Browser cannot grant `publish_story=true`. Discovery is B1.1-D.
 */
export type SocialCapabilitySnapshot = {
  provider: ImplementedSocialProvider;
  externalAccountId: SocialExternalAccountId;
  capabilities: readonly SocialBeta1Capability[];
  observedAt: string;
  source?: string;
  sourceVersion?: string;
};

export function createEmptySocialCapabilitySnapshot(input: {
  provider: ImplementedSocialProvider;
  externalAccountId: SocialExternalAccountId;
  observedAt: string;
}): SocialCapabilitySnapshot {
  return {
    provider: input.provider,
    externalAccountId: input.externalAccountId,
    capabilities: [],
    observedAt: input.observedAt,
  };
}

export function snapshotIncludesCapability(
  snapshot: SocialCapabilitySnapshot,
  capability: SocialBeta1Capability,
): boolean {
  return snapshot.capabilities.includes(capability);
}
