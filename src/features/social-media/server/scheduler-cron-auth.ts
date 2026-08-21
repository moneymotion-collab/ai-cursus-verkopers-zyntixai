/**
 * Machine authorization for the Social publication scheduler cron route.
 * Not member/Owner authorization. Secret never logged.
 */

import "server-only";

import { timingSafeEqual } from "node:crypto";
import {
  SOCIAL_SCHEDULER_CRON_SECRET_ENV,
  type SocialSchedulerAuthResult,
} from "@/features/social-media/domain/scheduler";

function authorizationBearer(header: string | null | undefined): string | null {
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(\S+)\s*$/i.exec(header.trim());
  if (!match) {
    return null;
  }
  return match[1] ?? null;
}

function secretsEqual(presented: string, expected: string): boolean {
  const left = Buffer.from(presented, "utf8");
  const right = Buffer.from(expected, "utf8");
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function readSocialSchedulerCronSecret(
  env: Record<string, string | undefined> = process.env,
): string {
  return env[SOCIAL_SCHEDULER_CRON_SECRET_ENV]?.trim() ?? "";
}

export function authorizeSocialSchedulerCronHeader(input: {
  authorizationHeader: string | null | undefined;
  env?: Record<string, string | undefined>;
}): SocialSchedulerAuthResult {
  const expected = readSocialSchedulerCronSecret(input.env);
  if (!expected) {
    return { ok: false, reason: "missing_secret" };
  }
  const presented = authorizationBearer(input.authorizationHeader);
  if (!presented) {
    return { ok: false, reason: "missing_credentials" };
  }
  if (!secretsEqual(presented, expected)) {
    return { ok: false, reason: "invalid_credentials" };
  }
  return { ok: true };
}
