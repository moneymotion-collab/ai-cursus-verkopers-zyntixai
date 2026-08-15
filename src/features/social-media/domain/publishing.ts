/**
 * Provider-neutral publishing infrastructure contracts (SMM-B1.6).
 * No live provider HTTP. Instagram adapter not implemented.
 */

import type { PlannedSocialProvider } from "./planned-providers";
import type { SocialBeta1Capability } from "./capabilities";
import type { SocialContentFormat } from "./content";

export const SOCIAL_PUBLISHING_ENABLED_ENV = "SOCIAL_PUBLISHING_ENABLED";

export function parseSocialPublishingEnabled(
  value: string | undefined | null,
): boolean {
  return value?.trim().toLowerCase() === "true";
}

/** Execution requires publishing gate ON. Intent creation is separate. */
export function isSocialPublishingExecutionEnabled(input: {
  publishingEnabled: string | undefined | null;
}): boolean {
  return parseSocialPublishingEnabled(input.publishingEnabled);
}

export const SOCIAL_PUBLICATION_STATUSES = [
  "pending",
  "queued",
  "claimed",
  "processing",
  "succeeded",
  "cancelled",
  "failed_retryable",
  "failed_terminal",
  "manual_intervention",
  "unknown_external_outcome",
] as const;

export type SocialPublicationStatus =
  (typeof SOCIAL_PUBLICATION_STATUSES)[number];

export function isSocialPublicationStatus(
  value: string,
): value is SocialPublicationStatus {
  return (SOCIAL_PUBLICATION_STATUSES as readonly string[]).includes(value);
}

export const SOCIAL_PUBLICATION_EXECUTION_MODES = [
  "scheduled",
  "immediate",
] as const;

export type SocialPublicationExecutionMode =
  (typeof SOCIAL_PUBLICATION_EXECUTION_MODES)[number];

export const SOCIAL_PUBLICATION_ATTEMPT_OUTCOMES = [
  "processing",
  "succeeded",
  "failed_retryable",
  "failed_terminal",
  "cancelled",
  "unknown_external_outcome",
] as const;

export type SocialPublicationAttemptOutcome =
  (typeof SOCIAL_PUBLICATION_ATTEMPT_OUTCOMES)[number];

export const SOCIAL_PUBLICATION_FAILURE_CLASSES = [
  "authorization",
  "credential",
  "capability",
  "validation",
  "media",
  "rate_limit",
  "provider_temporary",
  "provider_permanent",
  "network",
  "timeout",
  "conflict",
  "internal",
  "adapter_unavailable",
  "feature_disabled",
  "unknown_external_outcome",
  "workflow_not_ready",
  "connection_ineligible",
] as const;

export type SocialPublicationFailureClass =
  (typeof SOCIAL_PUBLICATION_FAILURE_CLASSES)[number];

export const SOCIAL_PROVIDER_READINESS_STATES = [
  "ready",
  "unsupported_provider",
  "unsupported_capability",
  "connection_ineligible",
  "reauthorization_required",
  "credential_unavailable",
  "feature_disabled",
  "provider_adapter_unavailable",
  "workflow_not_ready",
] as const;

export type SocialProviderReadinessState =
  (typeof SOCIAL_PROVIDER_READINESS_STATES)[number];

export function requiredCapabilityForContentFormat(
  format: SocialContentFormat | string,
): SocialBeta1Capability | null {
  switch (format) {
    case "image":
      return "publish_image";
    case "carousel":
      return "publish_carousel";
    case "video":
    case "long_video":
      return "publish_video";
    case "short_video":
      return "publish_short";
    case "story":
      return "publish_story";
    default:
      return null;
  }
}

export type SocialPublicationMediaReference = {
  assetId: string;
  sortOrder: number;
  assetRole: string;
  storageObjectKey: string;
  mimeType: string;
  mediaCategory: string;
};

export type SocialPublicationExecutionInput = {
  publicationId: string;
  organizationId: string;
  workspaceId: string;
  connectionId: string;
  provider: PlannedSocialProvider;
  variantVersionId: string;
  contentFormat: SocialContentFormat | string;
  mediaSnapshot: readonly SocialPublicationMediaReference[];
  operationId: string;
  /** Provider external account id (e.g. IG professional user id). Server-loaded. */
  externalAccountId: string;
  /** Exact version caption; format-specific adapter may omit from provider payload. */
  caption: string | null;
  /** Exact version alt text when present. */
  altText: string | null;
};

export type SocialPublishingAdapterResult =
  | {
      outcome: "succeeded";
      externalPublicationId: string;
    }
  | {
      outcome: "failed_retryable" | "failed_terminal" | "unknown_external_outcome";
      failureClass: SocialPublicationFailureClass;
      safeErrorCode: string;
    };

/**
 * Segmented publishing adapter (D). No OAuth/analytics/community methods.
 * Production registry must not register a fake success adapter.
 */
export type SocialPublishingAdapter = {
  readonly provider: PlannedSocialProvider;
  readonly segment: "publishing";
  preflight(
    input: SocialPublicationExecutionInput,
  ): Promise<SocialProviderReadinessState>;
  publish(
    input: SocialPublicationExecutionInput,
  ): Promise<SocialPublishingAdapterResult>;
};

export type SocialPublishingAdapterRegistry = {
  get(provider: PlannedSocialProvider): SocialPublishingAdapter | null;
};

export function createEmptySocialPublishingAdapterRegistry(): SocialPublishingAdapterRegistry {
  return {
    get() {
      return null;
    },
  };
}

export function resolvePublishingAdapterOrUnavailable(
  registry: SocialPublishingAdapterRegistry,
  provider: PlannedSocialProvider,
):
  | { ok: true; adapter: SocialPublishingAdapter }
  | { ok: false; readiness: "provider_adapter_unavailable" } {
  const adapter = registry.get(provider);
  if (!adapter) {
    return { ok: false, readiness: "provider_adapter_unavailable" };
  }
  return { ok: true, adapter };
}

/**
 * B1.7: Instagram adapter is implemented and may be registered.
 * Production execution still requires SOCIAL_PUBLISHING_ENABLED=true + worker GUC.
 */
export const SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS =
  "implemented_b17_gated" as const;

export const SOCIAL_PUBLICATION_CLIENT_FORBIDDEN_KEYS = [
  "accessToken",
  "refreshToken",
  "ciphertext",
  "iv",
  "authTag",
  "clientSecret",
  "authorizationCode",
  "encryptionKey",
  "providerPayload",
  "rawProviderResponse",
] as const;

export type SocialPublicationClientReadModel = {
  id: string;
  organizationId: string;
  workspaceId: string;
  variantVersionId: string;
  connectionId: string;
  provider: string;
  status: SocialPublicationStatus;
  executionMode: SocialPublicationExecutionMode;
  intendedExecuteAt: string;
  externalPublicationId: string | null;
};

export function isRetryableFailureClass(
  failureClass: SocialPublicationFailureClass,
): boolean {
  return (
    failureClass === "rate_limit" ||
    failureClass === "provider_temporary" ||
    failureClass === "network" ||
    failureClass === "timeout"
  );
}

export function computePublicationBackoffSeconds(attemptCount: number): number {
  const exp = Math.max(attemptCount - 1, 0);
  return Math.min(3600, 30 * 2 ** exp);
}
