/**
 * SMM-B1.11-F — Instagram Story IMAGE domain constraints.
 * Sourced from Meta IG User Media Story Image Specifications (updated 2026-08-12).
 * Provider parameter media_type=STORIES belongs in the Instagram adapter only.
 */

export const INSTAGRAM_STORY_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export const INSTAGRAM_STORY_IMAGE_MIME_TYPE = "image/jpeg" as const;

/** Official Story IMAGE spec recommends 9:16 to avoid cropping; it is not a hard reject. */
export const INSTAGRAM_STORY_IMAGE_RECOMMENDED_ASPECT = "9:16" as const;

export type InstagramStoryImageConstraintFailure =
  | "unsupported_mime"
  | "invalid_size"
  | "invalid_dimensions"
  | "unsupported_story_video";

export type InstagramStoryImageConstraintResult =
  | { ok: true }
  | { ok: false; reason: InstagramStoryImageConstraintFailure };

export function isInstagramStoryImageMimeType(value: string): boolean {
  return value.trim().toLowerCase() === INSTAGRAM_STORY_IMAGE_MIME_TYPE;
}

export function isValidInstagramStoryImageDimensions(
  widthPx: number,
  heightPx: number,
): boolean {
  return (
    Number.isInteger(widthPx) &&
    Number.isInteger(heightPx) &&
    widthPx > 0 &&
    heightPx > 0
  );
}

export function evaluateInstagramStoryImageConstraints(input: {
  mimeType: string;
  byteSize: number;
  widthPx: number;
  heightPx: number;
  mediaCategory?: string;
}): InstagramStoryImageConstraintResult {
  if (
    input.mediaCategory === "video" ||
    input.mimeType.trim().toLowerCase().startsWith("video/")
  ) {
    return { ok: false, reason: "unsupported_story_video" };
  }
  if (!isInstagramStoryImageMimeType(input.mimeType)) {
    return { ok: false, reason: "unsupported_mime" };
  }
  if (
    !Number.isInteger(input.byteSize) ||
    input.byteSize < 1 ||
    input.byteSize > INSTAGRAM_STORY_IMAGE_MAX_BYTES
  ) {
    return { ok: false, reason: "invalid_size" };
  }
  if (!isValidInstagramStoryImageDimensions(input.widthPx, input.heightPx)) {
    return { ok: false, reason: "invalid_dimensions" };
  }
  return { ok: true };
}
