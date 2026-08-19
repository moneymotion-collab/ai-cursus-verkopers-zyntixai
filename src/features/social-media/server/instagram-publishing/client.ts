/**
 * Narrow Instagram Content Publishing HTTP client (Instagram Login / graph.instagram.com).
 * Injectable fetch for offline tests. No token logging.
 */

import "server-only";

import {
  INSTAGRAM_GRAPH_API_VERSION,
  INSTAGRAM_GRAPH_BASE_URL,
  INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
} from "@/features/social-media/server/instagram-oauth-config";
import type { InstagramProviderFetch } from "@/features/social-media/server/instagram-provider-client";
import {
  assertOfficialInstagramGraphHost,
  buildInstagramCreateContainerBody,
  buildInstagramPublishBody,
  type InstagramCreateContainerRequest,
  type InstagramPublishContainerRequest,
} from "@/features/social-media/server/instagram-publishing/requests";

export type InstagramPublishingHttpFailureReason =
  | "timeout"
  | "network_error"
  | "non_2xx"
  | "invalid_json"
  | "invalid_payload"
  | "forbidden_host";

export type InstagramPublishingHttpResult<T> =
  | {
      ok: true;
      value: T;
      /** True once the HTTP request was dispatched (bytes may have reached Meta). */
      requestDispatched: true;
    }
  | {
      ok: false;
      reason: InstagramPublishingHttpFailureReason;
      requestDispatched: boolean;
      /** True when an HTTP response object was received (including non-2xx). */
      responseReceived?: boolean;
      httpStatus?: number;
      providerErrorCode?: number | null;
      providerErrorSubcode?: number | null;
      providerErrorType?: string | null;
      /** Raw provider message — sanitize before persist/log. */
      providerErrorMessage?: string | null;
    };

export type InstagramContainerId = { id: string };
export type InstagramPublishedMediaId = { id: string };
export type InstagramContainerStatusCode =
  | "EXPIRED"
  | "ERROR"
  | "FINISHED"
  | "IN_PROGRESS"
  | "PUBLISHED";

export type InstagramContainerStatus = {
  statusCode: InstagramContainerStatusCode;
};

export type InstagramPublishingLimit = {
  quotaUsage: number | null;
  config: { quotaTotal?: number | null } | null;
};

async function readJsonSafely(
  response: Response,
): Promise<
  | { ok: true; value: unknown }
  | { ok: false; reason: "invalid_json" }
> {
  try {
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function extractProviderError(value: unknown): {
  code: number | null;
  subcode: number | null;
  type: string | null;
  message: string | null;
} {
  const record = asRecord(value);
  const error = asRecord(record?.error);
  const code = typeof error?.code === "number" ? error.code : null;
  const subcode =
    typeof error?.error_subcode === "number" ? error.error_subcode : null;
  const type = typeof error?.type === "string" ? error.type : null;
  const message = typeof error?.message === "string" ? error.message : null;
  return { code, subcode, type, message };
}

async function fetchWithTimeout(
  fetchImpl: InstagramProviderFetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<
  | { ok: true; value: Response; requestDispatched: true }
  | {
      ok: false;
      reason: "timeout" | "network_error";
      requestDispatched: boolean;
    }
> {
  if (!assertOfficialInstagramGraphHost(url)) {
    return { ok: false, reason: "network_error", requestDispatched: false };
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let dispatched = false;
  try {
    dispatched = true;
    const response = await fetchImpl(url, {
      ...init,
      signal: controller.signal,
      redirect: "error",
    });
    return { ok: true, value: response, requestDispatched: true };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      return { ok: false, reason: "timeout", requestDispatched: dispatched };
    }
    return { ok: false, reason: "network_error", requestDispatched: dispatched };
  } finally {
    clearTimeout(timer);
  }
}

function graphUrl(path: string): string {
  const base = `${INSTAGRAM_GRAPH_BASE_URL}/${INSTAGRAM_GRAPH_API_VERSION}`;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function authHeaders(accessToken: string): HeadersInit {
  return {
    accept: "application/json",
    "content-type": "application/json",
    authorization: `Bearer ${accessToken}`,
  };
}

export async function createInstagramMediaContainer(input: {
  igUserId: string;
  accessToken: string;
  request: InstagramCreateContainerRequest;
  fetchImpl?: InstagramProviderFetch;
  timeoutMs?: number;
}): Promise<InstagramPublishingHttpResult<InstagramContainerId>> {
  const url = graphUrl(`/${encodeURIComponent(input.igUserId)}/media`);
  if (!assertOfficialInstagramGraphHost(url)) {
    return { ok: false, reason: "forbidden_host", requestDispatched: false };
  }
  const fetched = await fetchWithTimeout(
    input.fetchImpl ?? fetch,
    url,
    {
      method: "POST",
      headers: authHeaders(input.accessToken),
      body: JSON.stringify(buildInstagramCreateContainerBody(input.request)),
    },
    input.timeoutMs ?? INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  );
  if (!fetched.ok) {
    return fetched;
  }
  if (!fetched.value.ok) {
    const json = await readJsonSafely(fetched.value);
    const err = json.ok
      ? extractProviderError(json.value)
      : { code: null, subcode: null, type: null, message: null };
    return {
      ok: false,
      reason: "non_2xx",
      requestDispatched: true,
      responseReceived: true,
      httpStatus: fetched.value.status,
      providerErrorCode: err.code,
      providerErrorSubcode: err.subcode,
      providerErrorType: err.type,
      providerErrorMessage: err.message,
    };
  }
  const json = await readJsonSafely(fetched.value);
  if (!json.ok) {
    return {
      ok: false,
      reason: "invalid_json",
      requestDispatched: true,
      responseReceived: true,
    };
  }
  const record = asRecord(json.value);
  const id = typeof record?.id === "string" ? record.id.trim() : "";
  if (!id) {
    return {
      ok: false,
      reason: "invalid_payload",
      requestDispatched: true,
      responseReceived: true,
    };
  }
  return { ok: true, value: { id }, requestDispatched: true };
}

export async function getInstagramContainerStatus(input: {
  containerId: string;
  accessToken: string;
  fetchImpl?: InstagramProviderFetch;
  timeoutMs?: number;
}): Promise<InstagramPublishingHttpResult<InstagramContainerStatus>> {
  const url = graphUrl(
    `/${encodeURIComponent(input.containerId)}?fields=status_code`,
  );
  const fetched = await fetchWithTimeout(
    input.fetchImpl ?? fetch,
    url,
    { method: "GET", headers: authHeaders(input.accessToken) },
    input.timeoutMs ?? INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  );
  if (!fetched.ok) {
    return fetched;
  }
  if (!fetched.value.ok) {
    const json = await readJsonSafely(fetched.value);
    const err = json.ok
      ? extractProviderError(json.value)
      : { code: null, subcode: null, type: null, message: null };
    return {
      ok: false,
      reason: "non_2xx",
      requestDispatched: true,
      responseReceived: true,
      httpStatus: fetched.value.status,
      providerErrorCode: err.code,
      providerErrorSubcode: err.subcode,
      providerErrorType: err.type,
      providerErrorMessage: err.message,
    };
  }
  const json = await readJsonSafely(fetched.value);
  if (!json.ok) {
    return {
      ok: false,
      reason: "invalid_json",
      requestDispatched: true,
      responseReceived: true,
    };
  }
  const record = asRecord(json.value);
  const statusCode = record?.status_code;
  if (
    statusCode !== "EXPIRED" &&
    statusCode !== "ERROR" &&
    statusCode !== "FINISHED" &&
    statusCode !== "IN_PROGRESS" &&
    statusCode !== "PUBLISHED"
  ) {
    return {
      ok: false,
      reason: "invalid_payload",
      requestDispatched: true,
      responseReceived: true,
    };
  }
  return {
    ok: true,
    value: { statusCode },
    requestDispatched: true,
  };
}

export async function publishInstagramMediaContainer(input: {
  igUserId: string;
  accessToken: string;
  request: InstagramPublishContainerRequest;
  fetchImpl?: InstagramProviderFetch;
  timeoutMs?: number;
}): Promise<InstagramPublishingHttpResult<InstagramPublishedMediaId>> {
  const url = graphUrl(`/${encodeURIComponent(input.igUserId)}/media_publish`);
  const fetched = await fetchWithTimeout(
    input.fetchImpl ?? fetch,
    url,
    {
      method: "POST",
      headers: authHeaders(input.accessToken),
      body: JSON.stringify(buildInstagramPublishBody(input.request)),
    },
    input.timeoutMs ?? INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  );
  if (!fetched.ok) {
    return fetched;
  }
  if (!fetched.value.ok) {
    const json = await readJsonSafely(fetched.value);
    const err = json.ok
      ? extractProviderError(json.value)
      : { code: null, subcode: null, type: null, message: null };
    return {
      ok: false,
      reason: "non_2xx",
      requestDispatched: true,
      responseReceived: true,
      httpStatus: fetched.value.status,
      providerErrorCode: err.code,
      providerErrorSubcode: err.subcode,
      providerErrorType: err.type,
      providerErrorMessage: err.message,
    };
  }
  const json = await readJsonSafely(fetched.value);
  if (!json.ok) {
    return {
      ok: false,
      reason: "invalid_json",
      requestDispatched: true,
      responseReceived: true,
    };
  }
  const record = asRecord(json.value);
  const id = typeof record?.id === "string" ? record.id.trim() : "";
  if (!id) {
    return {
      ok: false,
      reason: "invalid_payload",
      requestDispatched: true,
      responseReceived: true,
    };
  }
  return { ok: true, value: { id }, requestDispatched: true };
}

export async function fetchInstagramContentPublishingLimit(input: {
  igUserId: string;
  accessToken: string;
  fetchImpl?: InstagramProviderFetch;
  timeoutMs?: number;
}): Promise<InstagramPublishingHttpResult<InstagramPublishingLimit>> {
  const url = graphUrl(
    `/${encodeURIComponent(input.igUserId)}/content_publishing_limit?fields=quota_usage,config`,
  );
  const fetched = await fetchWithTimeout(
    input.fetchImpl ?? fetch,
    url,
    { method: "GET", headers: authHeaders(input.accessToken) },
    input.timeoutMs ?? INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  );
  if (!fetched.ok) {
    return fetched;
  }
  if (!fetched.value.ok) {
    return {
      ok: false,
      reason: "non_2xx",
      requestDispatched: true,
      httpStatus: fetched.value.status,
    };
  }
  const json = await readJsonSafely(fetched.value);
  if (!json.ok) {
    return { ok: false, reason: "invalid_json", requestDispatched: true };
  }
  const root = asRecord(json.value);
  const data = Array.isArray(root?.data) ? root.data[0] : root;
  const row = asRecord(data);
  if (!row) {
    return { ok: false, reason: "invalid_payload", requestDispatched: true };
  }
  const quotaUsage =
    typeof row.quota_usage === "number" ? row.quota_usage : null;
  const config = asRecord(row.config);
  const quotaTotal =
    typeof config?.quota_total === "number" ? config.quota_total : null;
  return {
    ok: true,
    value: {
      quotaUsage,
      config: config ? { quotaTotal } : null,
    },
    requestDispatched: true,
  };
}

/**
 * Meta Content Publishing guidance: poll container status ~once/minute for up to ~5 minutes.
 * Bound is hard-capped: no infinite loop, no media_publish without FINISHED/PUBLISHED.
 */
export const INSTAGRAM_CONTAINER_POLL_INTERVAL_MS = 60_000;
export const INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS = 5;
/** Soft bound for evidence/tests: interval × (maxAttempts − 1) when sleeping between polls. */
export const INSTAGRAM_CONTAINER_POLL_MAX_DURATION_MS =
  INSTAGRAM_CONTAINER_POLL_INTERVAL_MS *
  (INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS - 1);

export type InstagramContainerReadySuccess = {
  ok: true;
  statusCode: "FINISHED" | "PUBLISHED";
  pollCount: number;
  elapsedMs: number;
  finishedConfirmed: true;
};

export type InstagramContainerReadyFailure = {
  ok: false;
  reason:
    | "poll_timeout"
    | "container_expired"
    | "container_error"
    | InstagramPublishingHttpFailureReason;
  requestDispatched: boolean;
  responseReceived?: boolean;
  httpStatus?: number;
  providerErrorCode?: number | null;
  providerErrorSubcode?: number | null;
  providerErrorType?: string | null;
  providerErrorMessage?: string | null;
  pollCount: number;
  elapsedMs: number;
  finalStatusCode?: InstagramContainerStatus["statusCode"] | null;
  finishedConfirmed: false;
};

/**
 * Authoritative gate between create_container and media_publish.
 * Only FINISHED/PUBLISHED may proceed; IN_PROGRESS polls; ERROR/EXPIRED/unknown fail closed.
 */
export async function waitForInstagramContainerFinished(input: {
  containerId: string;
  accessToken: string;
  fetchImpl?: InstagramProviderFetch;
  sleep?: (ms: number) => Promise<void>;
  intervalMs?: number;
  maxAttempts?: number;
  nowMs?: () => number;
}): Promise<InstagramContainerReadySuccess | InstagramContainerReadyFailure> {
  const sleep =
    input.sleep ??
    ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  const interval = input.intervalMs ?? INSTAGRAM_CONTAINER_POLL_INTERVAL_MS;
  const maxAttempts = input.maxAttempts ?? INSTAGRAM_CONTAINER_POLL_MAX_ATTEMPTS;
  const nowMs = input.nowMs ?? (() => Date.now());
  const startedAt = nowMs();
  let pollCount = 0;
  let finalStatusCode: InstagramContainerStatus["statusCode"] | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const status = await getInstagramContainerStatus({
      containerId: input.containerId,
      accessToken: input.accessToken,
      fetchImpl: input.fetchImpl,
    });
    pollCount += 1;
    if (!status.ok) {
      return {
        ...status,
        pollCount,
        elapsedMs: Math.max(0, nowMs() - startedAt),
        finalStatusCode,
        finishedConfirmed: false,
      };
    }
    finalStatusCode = status.value.statusCode;
    if (
      status.value.statusCode === "FINISHED" ||
      status.value.statusCode === "PUBLISHED"
    ) {
      return {
        ok: true,
        statusCode: status.value.statusCode,
        pollCount,
        elapsedMs: Math.max(0, nowMs() - startedAt),
        finishedConfirmed: true,
      };
    }
    if (status.value.statusCode === "EXPIRED") {
      return {
        ok: false,
        reason: "container_expired",
        requestDispatched: true,
        responseReceived: true,
        pollCount,
        elapsedMs: Math.max(0, nowMs() - startedAt),
        finalStatusCode,
        finishedConfirmed: false,
      };
    }
    if (status.value.statusCode === "ERROR") {
      return {
        ok: false,
        reason: "container_error",
        requestDispatched: true,
        responseReceived: true,
        pollCount,
        elapsedMs: Math.max(0, nowMs() - startedAt),
        finalStatusCode,
        finishedConfirmed: false,
      };
    }
    // IN_PROGRESS — continue within bound
    if (attempt + 1 < maxAttempts) {
      await sleep(interval);
    }
  }
  return {
    ok: false,
    reason: "poll_timeout",
    requestDispatched: true,
    responseReceived: true,
    pollCount,
    elapsedMs: Math.max(0, nowMs() - startedAt),
    finalStatusCode,
    finishedConfirmed: false,
  };
}
