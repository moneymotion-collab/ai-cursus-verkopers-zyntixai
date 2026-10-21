/**
 * Deterministic Instagram Login authorization URL builder.
 * Browser cannot inject scopes, redirect URI, client id, or endpoints.
 */

import "server-only";

import type { InstagramOAuthConfig } from "@/features/social-media/server/instagram-oauth-config";
import type { RawSocialOAuthStateSecret } from "@/features/social-media/server/credential-secrets";

export type BuildInstagramAuthorizationUrlInput = {
  config: InstagramOAuthConfig;
  rawState: RawSocialOAuthStateSecret | string;
  /**
   * Force Instagram professional credentials even if the user has a Facebook session.
   */
  forceReauth?: boolean;
};

export function buildInstagramAuthorizationUrl(
  input: BuildInstagramAuthorizationUrlInput,
): string {
  const state =
    typeof input.rawState === "string" ? input.rawState : input.rawState.value;
  if (state.length === 0) {
    throw new Error("social_oauth_state_missing");
  }

  const url = new URL(input.config.authorizeEndpoint);
  url.searchParams.set("client_id", input.config.clientId);
  url.searchParams.set("redirect_uri", input.config.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", input.config.scopes.join(","));
  url.searchParams.set("state", state);
  if (input.forceReauth) {
    url.searchParams.set("force_reauth", "true");
  }
  return url.toString();
}

export function assertInstagramAuthorizationUrlContract(
  authorizationUrl: string,
  config: InstagramOAuthConfig,
): boolean {
  try {
    const url = new URL(authorizationUrl);
    if (url.origin + url.pathname !== config.authorizeEndpoint) {
      return false;
    }
    if (url.searchParams.get("client_id") !== config.clientId) {
      return false;
    }
    if (url.searchParams.get("redirect_uri") !== config.redirectUri) {
      return false;
    }
    if (url.searchParams.get("response_type") !== "code") {
      return false;
    }
    if (url.searchParams.get("scope") !== config.scopes.join(",")) {
      return false;
    }
    const state = url.searchParams.get("state");
    if (!state || state.length === 0) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
