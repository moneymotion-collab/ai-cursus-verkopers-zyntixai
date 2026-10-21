import type { SocialOAuthReturnPathId } from "./oauth-intent";
import type { ImplementedSocialProvider } from "./provider";
import type { SocialConnectionId, SocialWorkspaceId } from "./types";

/**
 * Browser-controlled connect input. Minimal.
 * Organization, actor, credentials, scopes-as-authority, callback URL,
 * and external account identity are NOT accepted from the browser.
 */
export type SocialConnectRequest = {
  workspaceId: SocialWorkspaceId;
  provider: ImplementedSocialProvider;
};

export type SocialDisconnectRequest = {
  connectionId: SocialConnectionId;
};

export type SocialReauthorizeRequest = {
  connectionId: SocialConnectionId;
};

export type SocialConnectFailureCode =
  | "feature_disabled"
  | "unauthorized"
  | "forbidden"
  | "workspace_not_found"
  | "provider_unsupported"
  | "invalid_request"
  | "already_connected"
  | "rate_limited"
  | "closed_beta_not_enrolled"
  | "closed_beta_paused"
  | "closed_beta_revoked"
  | "internal_error";

export type SocialConnectResult =
  | {
      ok: true;
      code: "authorization_redirect";
      authorizationUrl: string;
    }
  | {
      ok: false;
      code: SocialConnectFailureCode;
    };

export type SocialCallbackSuccess = {
  ok: true;
  code: "connection_established";
  connectionId: SocialConnectionId;
  returnPathId: SocialOAuthReturnPathId;
};

export type SocialCallbackFailureCode =
  | "oauth_denied"
  | "invalid_state"
  | "expired_state"
  | "replayed_state"
  | "wrong_actor"
  | "provider_mismatch"
  | "provider_exchange_failed"
  | "unsupported_account"
  | "permission_missing"
  | "duplicate_connection"
  | "feature_disabled"
  | "internal_error";

export type SocialCallbackResult =
  | SocialCallbackSuccess
  | {
      ok: false;
      code: SocialCallbackFailureCode;
    };

/**
 * Reauthorization must preserve identity expectations.
 * It must not silently attach a different provider account unless an explicit
 * controlled reconnect flow permits it (later slice).
 */
export type SocialReauthorizeResult =
  | {
      ok: true;
      code: "authorization_redirect";
      authorizationUrl: string;
    }
  | {
      ok: false;
      code:
        | SocialConnectFailureCode
        | "connection_not_found"
        | "identity_mismatch";
    };

export type SocialDisconnectResult =
  | { ok: true; code: "disconnected" }
  | { ok: true; code: "already_disconnected" }
  | {
      ok: true;
      code: "disconnected_with_provider_revoke_warning";
    }
  | {
      ok: false;
      code:
        | "unauthorized"
        | "forbidden"
        | "not_found"
        | "conflict"
        | "rate_limited"
        | "feature_disabled"
        | "internal_error";
    };
