/**
 * Server-only Instagram Login (Business Login) OAuth configuration.
 * Fail closed when required secrets are missing or malformed.
 * Never expose client secret via NEXT_PUBLIC_*, logs, or client responses.
 */

import "server-only";

import { resolveSiteOrigin } from "@/lib/env/site-origin";
import {
  SOCIAL_INSTAGRAM_CLIENT_ID_ENV,
  SOCIAL_INSTAGRAM_CLIENT_SECRET_ENV,
  SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI_ENV,
} from "@/features/social-media/domain/feature-gate";

export {
  SOCIAL_INSTAGRAM_CLIENT_ID_ENV,
  SOCIAL_INSTAGRAM_CLIENT_SECRET_ENV,
  SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI_ENV,
};

export const INSTAGRAM_OAUTH_CALLBACK_PATH =
  "/api/social/instagram/callback" as const;

/**
 * Least-privilege Instagram Login scopes for connect + content publishing (SMM-B1.7).
 * Official Meta: instagram_business_basic + instagram_business_content_publish.
 * No messages/comments/insights.
 */
export const INSTAGRAM_LOGIN_CONNECT_SCOPES = [
  "instagram_business_basic",
  "instagram_business_content_publish",
] as const;

/** Alias used by publishing/permission evidence helpers. */
export const INSTAGRAM_LOGIN_PUBLISHING_SCOPES = INSTAGRAM_LOGIN_CONNECT_SCOPES;

export const INSTAGRAM_BUSINESS_CONTENT_PUBLISH_PERMISSION =
  "instagram_business_content_publish" as const;

export const INSTAGRAM_OAUTH_AUTHORIZE_ENDPOINT =
  "https://www.instagram.com/oauth/authorize" as const;

export const INSTAGRAM_OAUTH_TOKEN_ENDPOINT =
  "https://api.instagram.com/oauth/access_token" as const;

export const INSTAGRAM_GRAPH_BASE_URL =
  "https://graph.instagram.com" as const;

/**
 * Pin Graph API version (Instagram API with Instagram Login).
 * Verified against Meta Content Publishing docs (examples use v26.0; updated 2026-06-30).
 */
export const INSTAGRAM_GRAPH_API_VERSION = "v26.0" as const;

export const INSTAGRAM_PROVIDER_HTTP_TIMEOUT_MS = 15_000;

export type InstagramOAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: readonly string[];
  authorizeEndpoint: typeof INSTAGRAM_OAUTH_AUTHORIZE_ENDPOINT;
  tokenEndpoint: typeof INSTAGRAM_OAUTH_TOKEN_ENDPOINT;
  graphBaseUrl: typeof INSTAGRAM_GRAPH_BASE_URL;
  graphApiVersion: typeof INSTAGRAM_GRAPH_API_VERSION;
};

export type InstagramOAuthConfigFailureReason =
  | "missing_client_id"
  | "missing_client_secret"
  | "invalid_redirect_uri"
  | "invalid_origin";

export type InstagramOAuthConfigResult =
  | { ok: true; config: InstagramOAuthConfig }
  | { ok: false; reason: InstagramOAuthConfigFailureReason };

function isNonEmptyTrimmed(value: string | undefined | null): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isTrustedHttpOrigin(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    if (parsed.pathname !== "/" && parsed.pathname !== "") {
      return false;
    }
    if (parsed.search !== "" || parsed.hash !== "") {
      return false;
    }
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

function isTrustedRedirectUri(uri: string): boolean {
  try {
    const parsed = new URL(uri);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    if (parsed.pathname !== INSTAGRAM_OAUTH_CALLBACK_PATH) {
      return false;
    }
    if (parsed.search !== "" || parsed.hash !== "") {
      return false;
    }
    return Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function buildInstagramOAuthRedirectUri(
  env: Record<string, string | undefined> = process.env,
): string | null {
  const explicit = env[SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI_ENV]?.trim();
  if (explicit) {
    return isTrustedRedirectUri(explicit) ? explicit : null;
  }
  const origin = resolveSiteOrigin(env);
  if (!isTrustedHttpOrigin(origin)) {
    return null;
  }
  const url = new URL(INSTAGRAM_OAUTH_CALLBACK_PATH, `${origin}/`);
  if (!isTrustedRedirectUri(url.toString())) {
    return null;
  }
  return url.toString();
}

export function readInstagramOAuthConfig(
  env: Record<string, string | undefined> = process.env,
): InstagramOAuthConfigResult {
  if (!isNonEmptyTrimmed(env[SOCIAL_INSTAGRAM_CLIENT_ID_ENV])) {
    return { ok: false, reason: "missing_client_id" };
  }
  if (!isNonEmptyTrimmed(env[SOCIAL_INSTAGRAM_CLIENT_SECRET_ENV])) {
    return { ok: false, reason: "missing_client_secret" };
  }
  const redirectUri = buildInstagramOAuthRedirectUri(env);
  if (!redirectUri) {
    return { ok: false, reason: "invalid_redirect_uri" };
  }
  return {
    ok: true,
    config: {
      clientId: env[SOCIAL_INSTAGRAM_CLIENT_ID_ENV]!.trim(),
      clientSecret: env[SOCIAL_INSTAGRAM_CLIENT_SECRET_ENV]!.trim(),
      redirectUri,
      scopes: INSTAGRAM_LOGIN_CONNECT_SCOPES,
      authorizeEndpoint: INSTAGRAM_OAUTH_AUTHORIZE_ENDPOINT,
      tokenEndpoint: INSTAGRAM_OAUTH_TOKEN_ENDPOINT,
      graphBaseUrl: INSTAGRAM_GRAPH_BASE_URL,
      graphApiVersion: INSTAGRAM_GRAPH_API_VERSION,
    },
  };
}
