/**
 * Injectable Social media byte source for provider delivery (SMM-B1.7-R1).
 * Default: Supabase private bucket when SOCIAL_PRIVATE_MEDIA_STORAGE_KEY is
 * configured; else unavailable (fail-closed).
 */

import "server-only";

import {
  createUnavailableSocialMediaByteSource,
  type SocialMediaByteSource,
} from "@/features/social-media/server/instagram-publishing/media-delivery";
import {
  createSupabaseSocialMediaByteSource,
  SOCIAL_PRIVATE_MEDIA_STORAGE_KEY_ENV,
} from "@/features/social-media/server/instagram-publishing/supabase-byte-source";

let override: SocialMediaByteSource | null = null;

export function getSocialMediaByteSource(
  env: Record<string, string | undefined> = process.env,
): SocialMediaByteSource {
  if (override) {
    return override;
  }
  const storageKey = env[SOCIAL_PRIVATE_MEDIA_STORAGE_KEY_ENV];
  const hasStorageKey =
    typeof storageKey === "string" && storageKey.trim().length >= 20;
  const hasUrl =
    (typeof env.NEXT_PUBLIC_SUPABASE_URL === "string" &&
      env.NEXT_PUBLIC_SUPABASE_URL.trim().length > 0) ||
    (typeof env.SUPABASE_URL === "string" && env.SUPABASE_URL.trim().length > 0);
  if (hasStorageKey && hasUrl) {
    return createSupabaseSocialMediaByteSource(env);
  }
  return createUnavailableSocialMediaByteSource();
}

/** Test-only injection. */
export function __setSocialMediaByteSourceForTests(
  source: SocialMediaByteSource,
): void {
  override = source;
}

export function __resetSocialMediaByteSourceForTests(): void {
  override = null;
}
