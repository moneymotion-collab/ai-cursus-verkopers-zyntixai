/**
 * Instagram SocialPublishingAdapter (SMM-B1.7 + R1-E-R1 diagnostics).
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
  INSTAGRAM_CONTAINER_POLL_INTERVAL_MS,
  INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS,
  type InstagramPublishingHttpResult,
} from "@/features/social-media/server/instagram-publishing/client";
import {
  buildInstagramProviderDiagnostics,
  type InstagramProviderStep,
} from "@/features/social-media/server/instagram-publishing/diagnostics";
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
    providerStep?: InstagramProviderStep;
    requestDispatched?: boolean;
    responseReceived?: boolean;
    providerErrorCode?: number | null;
    providerErrorSubcode?: number | null;
    providerErrorType?: string | null;
    providerMessage?: unknown;
    externalContainerIdPresent?: boolean;
    externalPublicationIdPresent?: boolean;
    ambiguousTransport?: boolean;
  },
): SocialPublishingAdapterResult {
  const failure = mapInstagramHttpFailure({
    reason,
    afterIrreversibleMutation: extra?.afterIrreversibleMutation,
    httpStatus: extra?.httpStatus,
    providerErrorCode: extra?.providerErrorCode,
    providerErrorSubcode: extra?.providerErrorSubcode,
  });
  const diagnostics =
    extra?.providerStep != null
      ? buildInstagramProviderDiagnostics({
          providerStep: extra.providerStep,
          httpStatus: extra.httpStatus ?? null,
          providerErrorCode: extra.providerErrorCode ?? null,
          providerErrorSubcode: extra.providerErrorSubcode ?? null,
          providerErrorType: extra.providerErrorType ?? null,
          providerMessage: extra.providerMessage,
          requestDispatched: Boolean(extra.requestDispatched),
          responseReceived: Boolean(extra.responseReceived),
          externalContainerIdPresent: extra.externalContainerIdPresent,
          externalPublicationIdPresent: extra.externalPublicationIdPresent,
          ambiguousTransport: extra.ambiguousTransport,
        })
      : null;
  return toAdapterFailureResult(failure, diagnostics);
}

function mapHttpFailure(
  created: Extract<InstagramPublishingHttpResult<unknown>, { ok: false }>,
  providerStep: InstagramProviderStep,
  extras?: {
    afterIrreversibleMutation?: boolean;
    externalContainerIdPresent?: boolean;
    ambiguousTransport?: boolean;
  },
): SocialPublishingAdapterResult {
  const reason =
    created.reason === "timeout" || created.reason === "network_error"
      ? created.reason
      : created.reason === "non_2xx"
        ? "non_2xx"
        : created.reason === "invalid_json"
          ? "invalid_json"
          : "invalid_payload";
  return failureFromReason(reason, {
    afterIrreversibleMutation: extras?.afterIrreversibleMutation,
    httpStatus: created.httpStatus,
    providerStep,
    requestDispatched: created.requestDispatched,
    responseReceived:
      created.responseReceived === true ||
      created.reason === "non_2xx" ||
      created.reason === "invalid_json" ||
      created.reason === "invalid_payload",
    providerErrorCode: created.providerErrorCode,
    providerErrorSubcode: created.providerErrorSubcode,
    providerErrorType: created.providerErrorType,
    providerMessage: created.providerErrorMessage,
    externalContainerIdPresent: extras?.externalContainerIdPresent,
    ambiguousTransport: extras?.ambiguousTransport,
  });
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
    intervalMs: deps.pollIntervalMs ?? INSTAGRAM_CONTAINER_POLL_INTERVAL_MS,
    maxAttempts: deps.pollMaxAttempts ?? INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS,
  });
  if (ready.ok) {
    return null;
  }
  if (ready.reason === "container_expired") {
    return failureFromReason("container_expired", {
      providerStep: "container_status",
      requestDispatched: ready.requestDispatched,
      responseReceived: ready.responseReceived ?? true,
      externalContainerIdPresent: true,
      providerMessage: ready.finalStatusCode
        ? `Container status ${ready.finalStatusCode}`
        : undefined,
    });
  }
  if (ready.reason === "container_error") {
    return failureFromReason("container_error", {
      providerStep: "container_status",
      requestDispatched: ready.requestDispatched,
      responseReceived: ready.responseReceived ?? true,
      externalContainerIdPresent: true,
      providerMessage: ready.finalStatusCode
        ? `Container status ${ready.finalStatusCode}`
        : undefined,
    });
  }
  if (ready.reason === "poll_timeout") {
    return failureFromReason("poll_timeout", {
      providerStep: "container_status",
      requestDispatched: ready.requestDispatched,
      responseReceived: ready.responseReceived ?? true,
      externalContainerIdPresent: true,
      providerMessage: ready.finalStatusCode
        ? `Container status ${ready.finalStatusCode} after ${ready.pollCount} polls`
        : `Container not FINISHED after ${ready.pollCount} polls`,
    });
  }
  return mapHttpFailure(
    {
      ok: false,
      reason:
        ready.reason === "timeout" || ready.reason === "network_error"
          ? ready.reason
          : ready.reason === "non_2xx"
            ? "non_2xx"
            : ready.reason === "invalid_json"
              ? "invalid_json"
              : "invalid_payload",
      requestDispatched: ready.requestDispatched,
      responseReceived: ready.responseReceived,
      httpStatus: ready.httpStatus,
      providerErrorCode: ready.providerErrorCode,
      providerErrorSubcode: ready.providerErrorSubcode,
      providerErrorType: ready.providerErrorType,
      providerErrorMessage: ready.providerErrorMessage,
    },
    "container_status",
    { externalContainerIdPresent: true },
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
      if (input.contentFormat === "story") {
        if (media.length !== 1 || media[0]?.mediaCategory !== "image") {
          return "unsupported_capability";
        }
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
            return mapHttpFailure(child, "create_container");
          }
          // Image and video carousel children must reach FINISHED before parent/publish.
          const childWaitErr = await waitReady(deps, child.value.id);
          if (childWaitErr) {
            return childWaitErr;
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
          return mapHttpFailure(parent, "create_container", {
            externalContainerIdPresent: childIds.length > 0,
          });
        }
        containerId = parent.value.id;
        const parentWaitErr = await waitReady(deps, containerId);
        if (parentWaitErr) {
          return parentWaitErr;
        }
      } else {
        const primary = media[0];
        if (!primary) {
          return failureFromReason("media_invalid");
        }
        if (format === "story" && primary.mediaCategory !== "image") {
          return failureFromReason("unsupported_format");
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
        } else if (format === "story") {
          if (primary.mediaCategory !== "image") {
            return failureFromReason("unsupported_format");
          }
          request = {
            kind: "image",
            imageUrl: url.url,
            mediaType: "STORIES",
          };
        } else if (format === "short_video") {
          request = {
            kind: "video",
            mediaType: "REELS",
            videoUrl: url.url,
            caption,
          };
        } else {
          // video
          request = {
            kind: "video",
            mediaType: "VIDEO",
            videoUrl: url.url,
            caption,
          };
        }

        const created = await createInstagramMediaContainer({
          igUserId: input.externalAccountId,
          accessToken: deps.accessToken,
          fetchImpl: deps.fetchImpl,
          request,
        });
        if (!created.ok) {
          return mapHttpFailure(created, "create_container");
        }
        containerId = created.value.id;
        // R1-E-R2-P4: IMAGE (and all other formats) must confirm FINISHED before media_publish.
        const waitErr = await waitReady(deps, containerId);
        if (waitErr) {
          return waitErr;
        }
      }

      // BEFORE_PROVIDER_MUTATION — final media_publish (only after FINISHED)
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
            {
              afterIrreversibleMutation: true,
              providerStep: "media_publish",
              requestDispatched: true,
              responseReceived: published.reason === "invalid_json",
              httpStatus: published.httpStatus,
              providerErrorCode: published.providerErrorCode,
              providerErrorSubcode: published.providerErrorSubcode,
              providerErrorType: published.providerErrorType,
              providerMessage: published.providerErrorMessage,
              externalContainerIdPresent: true,
              ambiguousTransport: true,
            },
          );
        }
        return mapHttpFailure(published, "media_publish", {
          externalContainerIdPresent: true,
        });
      }

      return {
        outcome: "succeeded",
        externalPublicationId: published.value.id,
      };
    },
  };
}
