/**
 * Map Instagram Login granted OAuth permissions → Universal Social capabilities.
 * Browser cannot grant capabilities; only verified provider permissions do.
 */

import "server-only";

import type { SocialBeta1Capability } from "@/features/social-media/domain/capabilities";
import { INSTAGRAM_BUSINESS_CONTENT_PUBLISH_PERMISSION } from "@/features/social-media/server/instagram-oauth-config";

/** Capabilities the B1.7 Instagram publishing adapter can execute when publish permission is present. */
export const INSTAGRAM_PUBLISHING_ADAPTER_CAPABILITIES = [
  "publish_image",
  "publish_video",
  "publish_carousel",
  "publish_story",
  "publish_short",
] as const satisfies readonly SocialBeta1Capability[];

export function connectionHasInstagramPublishPermission(
  grantedPermissions: readonly string[],
): boolean {
  return grantedPermissions.includes(
    INSTAGRAM_BUSINESS_CONTENT_PUBLISH_PERMISSION,
  );
}

/**
 * Capability evidence model (B1.7):
 * - Token exchange may return granted `permissions`.
 * - Publish capability snapshot is set only when
 *   `instagram_business_content_publish` is present.
 * - Absence → empty snapshot → publication preflight fails closed
 *   (capability_missing / reauthorization_required).
 */
export function deriveInstagramCapabilitiesFromGrantedPermissions(
  grantedPermissions: readonly string[],
): SocialBeta1Capability[] {
  if (!connectionHasInstagramPublishPermission(grantedPermissions)) {
    return [];
  }
  return [...INSTAGRAM_PUBLISHING_ADAPTER_CAPABILITIES];
}
