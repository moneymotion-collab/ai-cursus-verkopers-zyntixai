/**
 * Master Content + Platform Variants + Media foundation (SMM-B1.4).
 * Provider-neutral creative domain. Not publication, approval, or versioning.
 */

import type { PlannedSocialProvider } from "./planned-providers";
import { isPlannedSocialProvider } from "./planned-providers";

export const SOCIAL_CONTENT_ORIGIN_KINDS = [
  "human_created",
  "ai_assisted",
  "ai_generated",
  "imported",
  "repurposed",
] as const;

export type SocialContentOriginKind =
  (typeof SOCIAL_CONTENT_ORIGIN_KINDS)[number];

export function isSocialContentOriginKind(
  value: string,
): value is SocialContentOriginKind {
  return (SOCIAL_CONTENT_ORIGIN_KINDS as readonly string[]).includes(value);
}

/** Minimal content lifecycle. Publication/approval states are out of scope. */
export const SOCIAL_CONTENT_LIFECYCLE_STATUSES = ["draft", "ready"] as const;

export type SocialContentLifecycleStatus =
  (typeof SOCIAL_CONTENT_LIFECYCLE_STATUSES)[number];

export function isSocialContentLifecycleStatus(
  value: string,
): value is SocialContentLifecycleStatus {
  return (SOCIAL_CONTENT_LIFECYCLE_STATUSES as readonly string[]).includes(
    value,
  );
}

export const SOCIAL_CONTENT_FORMATS = [
  "text",
  "image",
  "carousel",
  "video",
  "short_video",
  "story",
  "long_video",
  "pin",
  "thread",
] as const;

export type SocialContentFormat = (typeof SOCIAL_CONTENT_FORMATS)[number];

export function isSocialContentFormat(
  value: string,
): value is SocialContentFormat {
  return (SOCIAL_CONTENT_FORMATS as readonly string[]).includes(value);
}

export const SOCIAL_MEDIA_CATEGORIES = [
  "image",
  "video",
  "audio",
  "thumbnail",
] as const;

export type SocialMediaCategory = (typeof SOCIAL_MEDIA_CATEGORIES)[number];

export function isSocialMediaCategory(
  value: string,
): value is SocialMediaCategory {
  return (SOCIAL_MEDIA_CATEGORIES as readonly string[]).includes(value);
}

export const SOCIAL_MEDIA_PROCESSING_STATES = [
  "pending",
  "ready",
  "failed",
] as const;

export type SocialMediaProcessingState =
  (typeof SOCIAL_MEDIA_PROCESSING_STATES)[number];

export function isSocialMediaProcessingState(
  value: string,
): value is SocialMediaProcessingState {
  return (SOCIAL_MEDIA_PROCESSING_STATES as readonly string[]).includes(value);
}

export const SOCIAL_MEDIA_ASSET_ROLES = [
  "primary",
  "carousel_item",
  "thumbnail",
  "cover",
  "supporting",
] as const;

export type SocialMediaAssetRole = (typeof SOCIAL_MEDIA_ASSET_ROLES)[number];

export function isSocialMediaAssetRole(
  value: string,
): value is SocialMediaAssetRole {
  return (SOCIAL_MEDIA_ASSET_ROLES as readonly string[]).includes(value);
}

export const SOCIAL_MEDIA_DERIVATION_KINDS = [
  "crop",
  "transcode",
  "thumbnail",
  "compress",
  "other",
] as const;

export type SocialMediaDerivationKind =
  (typeof SOCIAL_MEDIA_DERIVATION_KINDS)[number];

/** Bounded provider-planning knobs only — not raw provider API payloads. */
export const SOCIAL_VARIANT_PROVIDER_CONFIG_KEYS = [
  "aspect_ratio_hint",
  "hook_note",
  "language_hint",
  "thumbnail_text_hint",
] as const;

export type SocialVariantProviderConfigKey =
  (typeof SOCIAL_VARIANT_PROVIDER_CONFIG_KEYS)[number];

export type SocialVariantProviderConfig = Partial<
  Record<SocialVariantProviderConfigKey, string>
>;

export function isSocialVariantProviderConfig(
  value: unknown,
): value is SocialVariantProviderConfig {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const allowed = new Set<string>(SOCIAL_VARIANT_PROVIDER_CONFIG_KEYS);
  for (const [key, entry] of Object.entries(value)) {
    if (!allowed.has(key)) return false;
    if (entry !== undefined && typeof entry !== "string") return false;
  }
  return true;
}

/**
 * Storage decision (B1.4): no shared Zyntix file/media domain found.
 * Social owns metadata + storage_object_key references. No bucket created.
 */
export const SOCIAL_MEDIA_STORAGE_DECISION =
  "social_owns_metadata_storage_object_key_no_bucket_b14" as const;

export type SocialContentItem = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  internalTitle: string;
  conceptSummary: string | null;
  primaryMessage: string | null;
  campaignId: string | null;
  primaryPillarId: string | null;
  originKind: SocialContentOriginKind;
  sourceContentId: string | null;
  status: SocialContentLifecycleStatus;
  archivedAt: string | null;
};

export type SocialContentVariant = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  contentId: string;
  plannedProvider: PlannedSocialProvider;
  contentFormat: SocialContentFormat;
  title: string | null;
  caption: string | null;
  description: string | null;
  ctaText: string | null;
  hashtags: string | null;
  altText: string | null;
  providerConfig: SocialVariantProviderConfig;
  status: SocialContentLifecycleStatus;
  archivedAt: string | null;
};

export type SocialMediaAsset = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  storageObjectKey: string;
  mimeType: string;
  mediaCategory: SocialMediaCategory;
  byteSize: number;
  widthPx: number | null;
  heightPx: number | null;
  durationMs: number | null;
  checksumSha256: string | null;
  processingState: SocialMediaProcessingState;
  parentAssetId: string | null;
  derivationKind: SocialMediaDerivationKind | null;
  altText: string | null;
  originKind: SocialContentOriginKind;
  archivedAt: string | null;
};

export type SocialMediaAttachment = {
  assetId: string;
  sortOrder: number;
  assetRole: SocialMediaAssetRole;
};

export function assertVariantProviderIsPlanned(
  provider: string,
): provider is PlannedSocialProvider {
  return isPlannedSocialProvider(provider);
}

/** Publication / approval / schedule states must not appear on content domain. */
export const SOCIAL_CONTENT_FORBIDDEN_LIFECYCLE_STATES = [
  "scheduled",
  "published",
  "failed",
  "approved",
  "rejected",
] as const;
