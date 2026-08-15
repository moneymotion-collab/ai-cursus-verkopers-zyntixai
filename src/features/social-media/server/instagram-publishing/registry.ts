/**
 * Production publishing adapter registry (SMM-B1.7).
 * Instagram is registered; execution still requires publishing gate + worker claim.
 * Access token / connection context are injected per execution — registry only holds factory.
 */

import "server-only";

import type { PlannedSocialProvider } from "@/features/social-media/domain/planned-providers";
import type {
  SocialPublishingAdapter,
  SocialPublishingAdapterRegistry,
} from "@/features/social-media/domain/publishing";
import {
  createInstagramPublishingAdapter,
  type InstagramPublishingAdapterDeps,
} from "@/features/social-media/server/instagram-publishing/adapter";

export type InstagramPublishingAdapterFactory = (
  deps: InstagramPublishingAdapterDeps,
) => SocialPublishingAdapter;

export function createSocialPublishingAdapterRegistry(options?: {
  instagramFactory?: InstagramPublishingAdapterFactory;
}): SocialPublishingAdapterRegistry & {
  createInstagram(deps: InstagramPublishingAdapterDeps): SocialPublishingAdapter;
} {
  const instagramFactory =
    options?.instagramFactory ?? createInstagramPublishingAdapter;

  return {
    get(provider: PlannedSocialProvider): SocialPublishingAdapter | null {
      // Stateless adapter instance is not created here without credentials.
      // Callers use createInstagram(deps) for real execution.
      if (provider === "instagram") {
        return null;
      }
      return null;
    },
    createInstagram(deps: InstagramPublishingAdapterDeps) {
      return instagramFactory(deps);
    },
  };
}

/**
 * Resolve whether Instagram publishing adapter implementation is available.
 * Distinct from empty B1.6 registry — B1.7 code path exists.
 */
export function isInstagramPublishingAdapterImplemented(): boolean {
  return true;
}
