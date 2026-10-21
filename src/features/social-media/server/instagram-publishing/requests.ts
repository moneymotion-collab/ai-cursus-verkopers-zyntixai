/**
 * Typed Instagram Content Publishing request builders (Instagram Login).
 * Server-owned hosts only — no browser-supplied Graph base/version.
 */

import "server-only";

import type { InstagramContainerMediaType } from "@/features/social-media/server/instagram-publishing/formats";

export type InstagramCreateImageContainerRequest = {
  kind: "image";
  imageUrl: string;
  caption?: string;
  altText?: string;
  isCarouselItem?: boolean;
  /** Set to STORIES for image Stories (Meta: media_type=STORIES). */
  mediaType?: "STORIES";
};

export type InstagramCreateVideoContainerRequest = {
  kind: "video";
  mediaType: Extract<
    InstagramContainerMediaType,
    "VIDEO" | "REELS" | "STORIES"
  >;
  videoUrl: string;
  caption?: string;
  isCarouselItem?: boolean;
};

export type InstagramCreateCarouselContainerRequest = {
  kind: "carousel";
  children: readonly string[];
  caption?: string;
};

export type InstagramCreateContainerRequest =
  | InstagramCreateImageContainerRequest
  | InstagramCreateVideoContainerRequest
  | InstagramCreateCarouselContainerRequest;

export type InstagramPublishContainerRequest = {
  creationId: string;
};

export function buildInstagramCreateContainerBody(
  request: InstagramCreateContainerRequest,
): Record<string, string> {
  if (request.kind === "image") {
    const body: Record<string, string> = {
      image_url: request.imageUrl,
    };
    if (request.mediaType === "STORIES") {
      body.media_type = "STORIES";
    }
    if (request.caption && request.mediaType !== "STORIES") {
      body.caption = request.caption;
    }
    if (request.altText && request.mediaType !== "STORIES") {
      body.alt_text = request.altText;
    }
    if (request.isCarouselItem) {
      body.is_carousel_item = "true";
    }
    return body;
  }
  if (request.kind === "video") {
    const body: Record<string, string> = {
      media_type: request.mediaType,
      video_url: request.videoUrl,
    };
    if (request.caption && request.mediaType !== "STORIES") {
      body.caption = request.caption;
    }
    if (request.isCarouselItem) {
      body.is_carousel_item = "true";
    }
    return body;
  }
  const body: Record<string, string> = {
    media_type: "CAROUSEL",
    children: request.children.join(","),
  };
  if (request.caption) {
    body.caption = request.caption;
  }
  return body;
}

export function buildInstagramPublishBody(
  request: InstagramPublishContainerRequest,
): Record<string, string> {
  return { creation_id: request.creationId };
}

export function assertOfficialInstagramGraphHost(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") {
      return false;
    }
    return (
      parsed.hostname === "graph.instagram.com" ||
      parsed.hostname === "graph.facebook.com"
    );
  } catch {
    return false;
  }
}
