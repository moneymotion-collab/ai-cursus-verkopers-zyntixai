/**
 * Injectable Social media byte source for provider delivery (SMM-B1.7).
 * Production default is unavailable until private object storage is wired.
 */

import "server-only";

import {
  createUnavailableSocialMediaByteSource,
  type SocialMediaByteSource,
} from "@/features/social-media/server/instagram-publishing/media-delivery";

let byteSource: SocialMediaByteSource =
  createUnavailableSocialMediaByteSource();

export function getSocialMediaByteSource(): SocialMediaByteSource {
  return byteSource;
}

/** Test-only injection. */
export function __setSocialMediaByteSourceForTests(
  source: SocialMediaByteSource,
): void {
  byteSource = source;
}

export function __resetSocialMediaByteSourceForTests(): void {
  byteSource = createUnavailableSocialMediaByteSource();
}
