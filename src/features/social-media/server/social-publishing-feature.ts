/**
 * Server-only Social Publishing execution gate.
 * Fail-closed: only exact "true" (trim + lower) enables execution.
 * Missing/malformed values are OFF. No NEXT_PUBLIC_ variants.
 */

import "server-only";

import { parseSocialPublishingEnabled } from "@/features/social-media/domain/publishing";

export { parseSocialPublishingEnabled };

export function isSocialPublishingFeatureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return parseSocialPublishingEnabled(env.SOCIAL_PUBLISHING_ENABLED);
}
