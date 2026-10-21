import { describe, expect, it } from "vitest";
import {
  INSTAGRAM_STORY_IMAGE_MAX_BYTES,
  INSTAGRAM_STORY_IMAGE_MIME_TYPE,
  INSTAGRAM_STORY_IMAGE_RECOMMENDED_ASPECT,
  evaluateInstagramStoryImageConstraints,
  isValidInstagramStoryImageDimensions,
} from "@/features/social-media/domain/story-image";

describe("SMM-B1.11-F Story IMAGE domain constraints", () => {
  it("records official JPEG + 8 MB limits without inventing 1080x1920 as required", () => {
    expect(INSTAGRAM_STORY_IMAGE_MIME_TYPE).toBe("image/jpeg");
    expect(INSTAGRAM_STORY_IMAGE_MAX_BYTES).toBe(8 * 1024 * 1024);
    expect(INSTAGRAM_STORY_IMAGE_RECOMMENDED_ASPECT).toBe("9:16");
    expect(isValidInstagramStoryImageDimensions(1080, 1920)).toBe(true);
    expect(isValidInstagramStoryImageDimensions(1080, 1350)).toBe(true);
    expect(isValidInstagramStoryImageDimensions(0, 1920)).toBe(false);
  });

  it("accepts a valid Story JPEG and rejects MIME, size, and Story VIDEO", () => {
    expect(
      evaluateInstagramStoryImageConstraints({
        mimeType: "image/jpeg",
        byteSize: 120_000,
        widthPx: 1080,
        heightPx: 1920,
      }),
    ).toEqual({ ok: true });
    expect(
      evaluateInstagramStoryImageConstraints({
        mimeType: "image/png",
        byteSize: 120_000,
        widthPx: 1080,
        heightPx: 1920,
      }),
    ).toEqual({ ok: false, reason: "unsupported_mime" });
    expect(
      evaluateInstagramStoryImageConstraints({
        mimeType: "image/jpeg",
        byteSize: INSTAGRAM_STORY_IMAGE_MAX_BYTES + 1,
        widthPx: 1080,
        heightPx: 1920,
      }),
    ).toEqual({ ok: false, reason: "invalid_size" });
    expect(
      evaluateInstagramStoryImageConstraints({
        mimeType: "video/mp4",
        byteSize: 120_000,
        widthPx: 1080,
        heightPx: 1920,
        mediaCategory: "video",
      }),
    ).toEqual({ ok: false, reason: "unsupported_story_video" });
  });
});
