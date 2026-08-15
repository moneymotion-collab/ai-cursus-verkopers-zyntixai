/**
 * Instagram SocialPublishingAdapter (SMM-B1.7).
 * Real Graph publishing HTTP behind injectable fetch — tests never hit Meta.
 */

import "server-only";

import {
  requiredCapabilityForContentFormat,
  type SocialProviderReadinessState,
  type SocialPublicationExecutionInput,
  type SocialPublishingAdapter,
  type SocialPublishingAdapterResult,
} from "@/features/social-media/domain/publishing";
import type { InstagramProviderFetch } from "@/features/social-media/server/instagram-provider-client";
import {
  createInstagramMediaContainer,
  fetchInstagramContentPublishingLimit,
  publishInstagramMediaContainer,
  waitForInstagramContainerFinished,
  type InstagramPublishingHttpResult,
} from "@/features/social-media/server/instagram-publishing/client";
import {
  mapInstagramHttpFailure,
  toAdapterFailureResult,
} from "@/features/social-media/server/instagram-publishing/errors";
import {
  INSTAGRAM_CAROUSEL_MAX_ITEMS,
  INSTAGRAM_CAROUSEL_MIN_ITEMS,
  instagramFormatSupportsCaption,
  isInstagramPublishableFormat,
  mapContentFormatToInstagramContainerType,
} from "@/features/social-media/server/instagram-publishing/formats";
import { mintSocialMediaProviderDeliveryUrl } from "@/features/social-media/server/instagram-publishing/media-delivery";
import type { InstagramCreateContainerRequest } from "@/features/social-media/server/instagram-publishing/requests";

export type InstagramPublishingAdapterDeps = {
  accessToken: string;
  fetchImpl?: InstagramProviderFetch;
  env?: Record<string, string | undefined>;
  connectionCapabilities: readonly string[];
  connectionStatus: string;
  connectionHealth: string;
  reauthorizationRequired: boolean;
  sleep?: (ms: number) => Promise<void>;
  pollIntervalMs?: number;
  pollMaxAttempts?: number;
  skipQuotaPreflight?: boolean;
};

function failureFromReason(
  reason: Parameters<typeof mapInstagramHttpFailure>[0]["reason"],
  extra?: {
    afterIrreversibleMutation?: boolean;
    httpStatus?: number;
  },
): SocialPublishingAdapterResult {
  return toAdapterFailureResult(
    mapInstagramHttpFailure({
      reason,
      afterIrreversibleMutation: extra?.afterIrreversibleMutation,
      httpStatus: extra?.httpStatus,
    }),
  );
}

function mapCreateFailure(
  created: Extract<InstagramPublishingHttpResult<unknown>, { ok: false }>,
): SocialPublishingAdapterResult {
  return failureFromReason(
    created.reason === "timeout" || created.reason === "network_error"
      ? created.reason
      : created.reason === "non_2xx"
        ? "non_2xx"
        : "invalid_payload",
    { httpStatus: created.httpStatus },
  );
}

function sortedMedia(input: SocialPublicationExecutionInput) {
  return [...input.mediaSnapshot].sort((a, b) => a.sortOrder - b.sortOrder);
}

async function mintUrl(
  input: SocialPublicationExecutionInput,
  media: SocialPublicationExecutionInput["mediaSnapshot"][number],
  env?: Record<string, string | undefined>,
): Promise<
  | { ok: true; url: string }
  | { ok: false; result: SocialPublishingAdapterResult }
> {
  const minted = mintSocialMediaProviderDeliveryUrl({
    organizationId: input.organizationId,
    assetId: media.assetId,
    storageObjectKey: media.storageObjectKey,
    env,
  });
  if (!minted.ok) {
    return { ok: false, result: failureFromReason("media_invalid") };
  }
  return { ok: true, url: minted.url };
}

async function waitReady(
  deps: InstagramPublishingAdapterDeps,
  containerId: string,
): Promise<SocialPublishingAdapterResult | null> {
  const ready = await waitForInstagramContainerFinished({
    containerId,
    accessToken: deps.accessToken,
    fetchImpl: deps.fetchImpl,
    sleep: deps.sleep,
    intervalMs: deps.pollIntervalMs ?? 0,
    maxAttempts: deps.pollMaxAttempts ?? 5,
  });
  if (ready.ok) {
    return null;
  }
  if (ready.reason === "container_expired") {
    return failureFromReason("container_expired");
  }
  if (ready.reason === "container_error") {
    return failureFromReason("container_error");
  }
  if (ready.reason === "poll_timeout") {
    return failureFromReason("poll_timeout");
  }
  return failureFromReason(
    ready.reason === "timeout" || ready.reason === "network_error"
      ? ready.reason
      : "invalid_payload",
  );
}

export function createInstagramPublishingAdapter(
  deps: InstagramPublishingAdapterDeps,
): SocialPublishingAdapter {
  return {
    provider: "instagram",
    segment: "publishing",

    async preflight(
      input: SocialPublicationExecutionInput,
    ): Promise<SocialProviderReadinessState> {
      if (input.provider !== "instagram") {
        return "unsupported_provider";
      }
      if (!deps.accessToken || deps.accessToken.trim().length === 0) {
        return "credential_unavailable";
      }
      if (deps.reauthorizationRequired) {
        return "reauthorization_required";
      }
      if (
        deps.connectionStatus !== "connected" ||
        deps.connectionHealth === "provider_unavailable"
      ) {
        return "connection_ineligible";
      }
      if (!isInstagramPublishableFormat(input.contentFormat)) {
        return "unsupported_capability";
      }
      const required = requiredCapabilityForContentFormat(input.contentFormat);
      if (!required || !deps.connectionCapabilities.includes(required)) {
        return "unsupported_capability";
      }
      if (!input.externalAccountId?.trim()) {
        return "connection_ineligible";
      }
      const media = sortedMedia(input);
      if (input.contentFormat === "carousel") {
        if (
          media.length < INSTAGRAM_CAROUSEL_MIN_ITEMS ||
          media.length > INSTAGRAM_CAROUSEL_MAX_ITEMS
        ) {
          return "unsupported_capability";
        }
      } else if (media.length < 1) {
        return "unsupported_capability";
      }

      if (!deps.skipQuotaPreflight) {
        const quota = await fetchInstagramContentPublishingLimit({
          igUserId: input.externalAccountId,
          accessToken: deps.accessToken,
          fetchImpl: deps.fetchImpl,
        });
        if (quota.ok) {
          const total = quota.value.config?.quotaTotal ?? 100;
          const usage = quota.value.quotaUsage;
          if (usage != null && usage >= total) {
            return "feature_disabled";
          }
        }
      }

      return "ready";
    },

    async publish(
      input: SocialPublicationExecutionInput,
    ): Promise<SocialPublishingAdapterResult> {
      const readiness = await this.preflight(input);
      if (readiness !== "ready") {
        if (readiness === "reauthorization_required") {
          return failureFromReason("permission_missing");
        }
        if (readiness === "credential_unavailable") {
          return failureFromReason("empty_token");
        }
        if (
          readiness === "unsupported_capability" ||
          readiness === "unsupported_provider"
        ) {
          return failureFromReason("unsupported_format");
        }
        if (readiness === "feature_disabled") {
          return toAdapterFailureResult(
            mapInstagramHttpFailure({ reason: "quota_exhausted" }),
          );
        }
        return failureFromReason("permission_missing");
      }

      const format = input.contentFormat;
      const mapped = mapContentFormatToInstagramContainerType(format);
      if (!mapped || !isInstagramPublishableFormat(format)) {
        return failureFromReason("unsupported_format");
      }

      const media = sortedMedia(input);
      const caption =
        instagramFormatSupportsCaption(format) && input.caption
          ? input.caption
          : undefined;

      let containerId: string;
      let needsProcessingWait = false;

      if (format === "carousel") {
        const childIds: string[] = [];
        for (const item of media) {
          const url = await mintUrl(input, item, deps.env);
          if (!url.ok) {
            return url.result;
          }
          const isVideo = item.mediaCategory === "video";
          const childReq: InstagramCreateContainerRequest = isVideo
            ? {
                kind: "video",
                mediaType: "VIDEO",
                videoUrl: url.url,
                isCarouselItem: true,
              }
            : {
                kind: "image",
                imageUrl: url.url,
                isCarouselItem: true,
              };
          const child = await createInstagramMediaContainer({
            igUserId: input.externalAccountId,
            accessToken: deps.accessToken,
            fetchImpl: deps.fetchImpl,
            request: childReq,
          });
          if (!child.ok) {
            return mapCreateFailure(child);
          }
          if (isVideo) {
            const waitErr = await waitReady(deps, child.value.id);
            if (waitErr) {
              return waitErr;
            }
          }
          childIds.push(child.value.id);
        }
        const parent = await createInstagramMediaContainer({
          igUserId: input.externalAccountId,
          accessToken: deps.accessToken,
          fetchImpl: deps.fetchImpl,
          request: {
            kind: "carousel",
            children: childIds,
            caption,
          },
        });
        if (!parent.ok) {
          return mapCreateFailure(parent);
        }
        containerId = parent.value.id;
      } else {
        const primary = media[0];
        if (!primary) {
          return failureFromReason("media_invalid");
        }
        const url = await mintUrl(input, primary, deps.env);
        if (!url.ok) {
          return url.result;
        }

        let request: InstagramCreateContainerRequest;
        if (format === "image") {
          if (primary.mediaCategory !== "image") {
            return failureFromReason("media_invalid");
          }
          request = {
            kind: "image",
            imageUrl: url.url,
            caption,
            altText: input.altText ?? undefined,
          };
        } else if (format === "story" && primary.mediaCategory === "image") {
          request = {
            kind: "image",
            imageUrl: url.url,
            mediaType: "STORIES",
          };
        } else if (format === "story") {
          request = {
            kind: "video",
            mediaType: "STORIES",
            videoUrl: url.url,
          };
          needsProcessingWait = true;
        } else if (format === "short_video") {
          request = {
            kind: "video",
            mediaType: "REELS",
            videoUrl: url.url,
            caption,
          };
          needsProcessingWait = true;
        } else {
          // video
          request = {
            kind: "video",
            mediaType: "VIDEO",
            videoUrl: url.url,
            caption,
          };
          needsProcessingWait = true;
        }

        const created = await createInstagramMediaContainer({
          igUserId: input.externalAccountId,
          accessToken: deps.accessToken,
          fetchImpl: deps.fetchImpl,
          request,
        });
        if (!created.ok) {
          return mapCreateFailure(created);
        }
        containerId = created.value.id;
        if (needsProcessingWait) {
          const waitErr = await waitReady(deps, containerId);
          if (waitErr) {
            return waitErr;
          }
        }
      }

      // BEFORE_PROVIDER_MUTATION — final media_publish
      const published = await publishInstagramMediaContainer({
        igUserId: input.externalAccountId,
        accessToken: deps.accessToken,
        fetchImpl: deps.fetchImpl,
        request: { creationId: containerId },
      });
      // AFTER_PROVIDER_MUTATION_MAY_HAVE_OCCURRED if requestDispatched

      if (!published.ok) {
        if (
          published.requestDispatched &&
          (published.reason === "timeout" ||
            published.reason === "network_error" ||
            published.reason === "invalid_json")
        ) {
          return failureFromReason(
            published.reason === "invalid_json"
              ? "network_error"
              : published.reason,
            { afterIrreversibleMutation: true },
          );
        }
        return mapCreateFailure(published);
      }

      return {
        outcome: "succeeded",
        externalPublicationId: published.value.id,
      };
    },
  };
}
