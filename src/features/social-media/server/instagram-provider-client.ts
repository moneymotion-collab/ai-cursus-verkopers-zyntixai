/**
 * Narrow Instagram Login HTTP adapter (SMM-B1.1-C).
 * Owns token exchange, long-lived token upgrade, and minimal identity read.
 * No publishing, webhooks, or broad Meta SDK abstraction.
 */

import "server-only";

import { normalizeInstagramProfessionalAccountType } from "@/features/social-media/domain/account-type";
import type { InstagramProfessionalAccountType } from "@/features/social-media/domain/account-type";
import {
  INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  type InstagramOAuthConfig,
} from "@/features/social-media/server/instagram-oauth-config";

export type InstagramProviderHttpFailureReason =
  | "timeout"
  | "network_error"
  | "non_2xx"
  | "invalid_json"
  | "invalid_payload"
  | "empty_token"
  | "unsupported_account"
  | "missing_id"
  | "missing_user_id"
  | "missing_username";

export type InstagramShortLivedToken = {
  accessToken: string;
  userId: string;
  permissions: string[];
};

export type InstagramLongLivedToken = {
  accessToken: string;
  expiresInSeconds: number | null;
};

export type InstagramProfessionalIdentity = {
  /** Instagram professional account ID (`user_id` field / IG_ID). */
  externalAccountId: string;
  /** App-scoped user id (`id` field); comparable to token-exchange user_id. */
  appScopedUserId: string;
  username: string;
  accountType: InstagramProfessionalAccountType;
};

export type InstagramProviderResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: InstagramProviderHttpFailureReason };

export type InstagramProviderFetch = (
  input: string,
  init?: RequestInit,
) => Promise<Response>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function unwrapDataObject(value: unknown): Record<string, unknown> | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  if (Array.isArray(record.data) && record.data.length > 0) {
    return asRecord(record.data[0]);
  }
  const nestedData = asRecord(record.data);
  if (nestedData) {
    return nestedData;
  }
  return record;
}

function readNonEmptyId(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return null;
}

function parsePermissions(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
  }
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

async function readJsonSafely(
  response: Response,
): Promise<InstagramProviderResult<unknown>> {
  const contentType = response.headers.get("content-type") ?? "";
  if (
    contentType.length > 0 &&
    !contentType.toLowerCase().includes("application/json") &&
    !contentType.toLowerCase().includes("text/javascript")
  ) {
    // Some Instagram responses omit/alter content-type; still try JSON parse.
  }
  try {
    return { ok: true, value: await response.json() };
  } catch {
    return { ok: false, reason: "invalid_json" };
  }
}

async function fetchWithTimeout(
  fetchImpl: InstagramProviderFetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<InstagramProviderResult<Response>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      ...init,
      signal: controller.signal,
      redirect: "error",
    });
    return { ok: true, value: response };
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"))
    ) {
      return { ok: false, reason: "timeout" };
    }
    return { ok: false, reason: "network_error" };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Strip trailing `#_` Meta sometimes appends to the code redirect.
 */
export function normalizeInstagramAuthorizationCode(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return null;
  }
  const withoutFragmentSuffix = trimmed.endsWith("#_")
    ? trimmed.slice(0, -2)
    : trimmed;
  if (withoutFragmentSuffix.length === 0) {
    return null;
  }
  return withoutFragmentSuffix;
}

export async function exchangeInstagramAuthorizationCode(
  config: InstagramOAuthConfig,
  authorizationCode: string,
  options?: {
    fetchImpl?: InstagramProviderFetch;
    timeoutMs?: number;
  },
): Promise<InstagramProviderResult<InstagramShortLivedToken>> {
  const code = normalizeInstagramAuthorizationCode(authorizationCode);
  if (!code) {
    return { ok: false, reason: "invalid_payload" };
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
  });

  const fetched = await fetchWithTimeout(
    options?.fetchImpl ?? fetch,
    config.tokenEndpoint,
    {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        accept: "application/json",
      },
      body: body.toString(),
    },
    options?.timeoutMs ?? INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  );
  if (!fetched.ok) {
    return fetched;
  }
  if (!fetched.value.ok) {
    return { ok: false, reason: "non_2xx" };
  }
  const json = await readJsonSafely(fetched.value);
  if (!json.ok) {
    return json;
  }
  const record = unwrapDataObject(json.value);
  if (!record) {
    return { ok: false, reason: "invalid_payload" };
  }
  const accessToken =
    typeof record.access_token === "string" ? record.access_token.trim() : "";
  const userIdRaw = record.user_id;
  const userId =
    typeof userIdRaw === "string"
      ? userIdRaw.trim()
      : typeof userIdRaw === "number"
        ? String(userIdRaw)
        : "";
  if (accessToken.length === 0) {
    return { ok: false, reason: "empty_token" };
  }
  if (userId.length === 0) {
    return { ok: false, reason: "invalid_payload" };
  }
  return {
    ok: true,
    value: {
      accessToken,
      userId,
      permissions: parsePermissions(record.permissions),
    },
  };
}

export async function exchangeInstagramLongLivedToken(
  config: InstagramOAuthConfig,
  shortLivedAccessToken: string,
  options?: {
    fetchImpl?: InstagramProviderFetch;
    timeoutMs?: number;
  },
): Promise<InstagramProviderResult<InstagramLongLivedToken>> {
  if (shortLivedAccessToken.trim().length === 0) {
    return { ok: false, reason: "empty_token" };
  }
  const url = new URL(`${config.graphBaseUrl}/access_token`);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", config.clientSecret);
  url.searchParams.set("access_token", shortLivedAccessToken);

  const fetched = await fetchWithTimeout(
    options?.fetchImpl ?? fetch,
    url.toString(),
    {
      method: "GET",
      headers: { accept: "application/json" },
    },
    options?.timeoutMs ?? INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  );
  if (!fetched.ok) {
    return fetched;
  }
  if (!fetched.value.ok) {
    return { ok: false, reason: "non_2xx" };
  }
  const json = await readJsonSafely(fetched.value);
  if (!json.ok) {
    return json;
  }
  const record = unwrapDataObject(json.value);
  if (!record) {
    return { ok: false, reason: "invalid_payload" };
  }
  const accessToken =
    typeof record.access_token === "string" ? record.access_token.trim() : "";
  if (accessToken.length === 0) {
    return { ok: false, reason: "empty_token" };
  }
  const expiresIn =
    typeof record.expires_in === "number" && Number.isFinite(record.expires_in)
      ? record.expires_in
      : typeof record.expires_in === "string" &&
          Number.isFinite(Number(record.expires_in))
        ? Number(record.expires_in)
        : null;
  return {
    ok: true,
    value: {
      accessToken,
      expiresInSeconds: expiresIn,
    },
  };
}

export async function fetchInstagramProfessionalIdentity(
  config: InstagramOAuthConfig,
  accessToken: string,
  options?: {
    fetchImpl?: InstagramProviderFetch;
    timeoutMs?: number;
  },
): Promise<InstagramProviderResult<InstagramProfessionalIdentity>> {
  if (accessToken.trim().length === 0) {
    return { ok: false, reason: "empty_token" };
  }
  const url = new URL(
    `${config.graphBaseUrl}/${config.graphApiVersion}/me`,
  );
  // Meta Instagram Login /me fields (v26.0):
  // - id = app-scoped ID
  // - user_id = Instagram professional IG_ID (persist as external account id)
  // Token-exchange user_id is separately documented as Instagram-scoped and is
  // not contractually required to equal /me.id.
  url.searchParams.set("fields", "id,user_id,username,account_type");
  url.searchParams.set("access_token", accessToken);

  const fetched = await fetchWithTimeout(
    options?.fetchImpl ?? fetch,
    url.toString(),
    {
      method: "GET",
      headers: { accept: "application/json" },
    },
    options?.timeoutMs ?? INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS,
  );
  if (!fetched.ok) {
    return fetched;
  }
  if (!fetched.value.ok) {
    return { ok: false, reason: "non_2xx" };
  }
  const json = await readJsonSafely(fetched.value);
  if (!json.ok) {
    return json;
  }
  const record = unwrapDataObject(json.value);
  if (!record) {
    return { ok: false, reason: "invalid_payload" };
  }

  // Fail closed on each required Instagram Login /me field separately so
  // Production can surface an opaque stage without logging provider bodies.
  const appScopedUserId = readNonEmptyId(record.id);
  if (!appScopedUserId) {
    return { ok: false, reason: "missing_id" };
  }

  const externalAccountId = readNonEmptyId(record.user_id);
  if (!externalAccountId) {
    return { ok: false, reason: "missing_user_id" };
  }

  const username =
    typeof record.username === "string" && record.username.trim().length > 0
      ? record.username.trim()
      : null;
  if (!username) {
    return { ok: false, reason: "missing_username" };
  }

  if (!("account_type" in record)) {
    return { ok: false, reason: "unsupported_account" };
  }
  const accountType = normalizeInstagramProfessionalAccountType(
    typeof record.account_type === "string" ? record.account_type : null,
  );
  if (!accountType) {
    return { ok: false, reason: "unsupported_account" };
  }

  return {
    ok: true,
    value: {
      externalAccountId,
      appScopedUserId,
      username,
      accountType,
    },
  };
}
