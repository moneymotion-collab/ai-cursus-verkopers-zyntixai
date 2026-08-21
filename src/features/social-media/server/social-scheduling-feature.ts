/**
 * Server-only Social Scheduling execution gate (SMM-B1.11-C).
 * Fail-closed: only exact "true" (trim + lower) enables automatic execution.
 * Independent from SOCIAL_PUBLISHING_ENABLED. No NEXT_PUBLIC_ variants.
 */

import "server-only";

import { parseSocialSchedulingEnabled } from "@/features/social-media/domain/scheduler";

export { parseSocialSchedulingEnabled };

export function isSocialSchedulingFeatureEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return parseSocialSchedulingEnabled(env.SOCIAL_SCHEDULING_ENABLED);
}
