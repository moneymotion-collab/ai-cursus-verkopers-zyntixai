/**
 * Instagram format mapping for Content Publishing (Instagram Login).
 * Verified Meta media_type values: REELS | STORIES | CAROUSEL | VIDEO (videos).
 */

import "server-only";

import type { SocialContentFormat } from "@/features/social-media/domain/content";

export type InstagramPublishableFormat =
  | "image"
  | "carousel"
  | "video"
  | "short_video"
  | "story";

export type InstagramContainerMediaType =
  | "IMAGE"
  | "VIDEO"
  | "REELS"
  | "STORIES"
  | "CAROUSEL";

export function isInstagramPublishableFormat(
  format: string,
): format is InstagramPublishableFormat {
  return (
    format === "image" ||
    format === "carousel" ||
    format === "video" ||
    format === "short_video" ||
    format === "story"
  );
}

/** text / pin / thread / long_video deferred or unsupported for this adapter path. */
export function mapContentFormatToInstagramContainerType(
  format: SocialContentFormat | string,
): InstagramContainerMediaType | null {
  switch (format) {
    case "image":
      return "IMAGE";
    case "carousel":
      return "CAROUSEL";
    case "video":
      return "VIDEO";
    case "short_video":
      return "REELS";
    case "story":
      return "STORIES";
    default:
      return null;
  }
}

/** Caption is not sent for Stories per Meta format semantics. */
export function instagramFormatSupportsCaption(
  format: InstagramPublishableFormat | string,
): boolean {
  return format !== "story";
}

export const INSTAGRAM_CAROUSEL_MIN_ITEMS = 2;
export const INSTAGRAM_CAROUSEL_MAX_ITEMS = 10;
