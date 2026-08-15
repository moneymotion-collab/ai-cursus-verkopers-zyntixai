export type {
  SocialOrganizationId,
  SocialWorkspaceId,
  SocialConnectionId,
  SocialMemberId,
  SocialUserId,
  SocialCredentialReferenceId,
  SocialOAuthIntentId,
  SocialExternalAccountId,
  SocialConnectionPermissionSet,
  SocialConnectionOrgStatus,
} from "@/features/social-media/domain/types";
export { EMPTY_SOCIAL_CONNECTION_PERMISSIONS } from "@/features/social-media/domain/types";

export {
  isSocialUuid,
  isSocialExternalAccountId,
  isApplicationUuidNotProviderAccountId,
  SOCIAL_EXTERNAL_ACCOUNT_ID_MAX_LENGTH,
} from "@/features/social-media/domain/ids";

export {
  KNOWN_SOCIAL_PROVIDER_FAMILIES,
  IMPLEMENTED_SOCIAL_PROVIDERS,
  isKnownSocialProviderFamily,
  isImplementedSocialProvider,
  isConnectionEnabledSocialProvider,
} from "@/features/social-media/domain/provider";
export type {
  KnownSocialProviderFamily,
  ImplementedSocialProvider,
  SocialProvider,
} from "@/features/social-media/domain/provider";

export {
  IMPLEMENTED_SOCIAL_LOGIN_PRODUCTS,
  INSTAGRAM_LOGIN_PRODUCT,
  isImplementedSocialLoginProduct,
  isFacebookLoginProduct,
} from "@/features/social-media/domain/login-product";
export type {
  ImplementedSocialLoginProduct,
  SocialLoginProduct,
} from "@/features/social-media/domain/login-product";

export {
  INSTAGRAM_PROFESSIONAL_ACCOUNT_TYPES,
  isInstagramProfessionalAccountType,
  normalizeInstagramProfessionalAccountType,
  isSupportedInstagramProfessionalAccount,
} from "@/features/social-media/domain/account-type";
export type {
  InstagramProfessionalAccountType,
  RawInstagramAccountType,
} from "@/features/social-media/domain/account-type";

export {
  SOCIAL_CONNECTION_STATUSES,
  ACTIVE_SOCIAL_CONNECTION_STATUSES,
  TERMINAL_SOCIAL_CONNECTION_STATUSES,
  CAPABILITY_ELIGIBLE_SOCIAL_CONNECTION_STATUSES,
  REAUTHORIZATION_REQUIRED_SOCIAL_CONNECTION_STATUSES,
  isSocialConnectionStatus,
  isActiveSocialConnectionStatus,
  isTerminalSocialConnectionStatus,
  isCapabilityEligibleSocialConnectionStatus,
  isSocialConnectionReauthorizationRequired,
} from "@/features/social-media/domain/status";
export type { SocialConnectionStatus } from "@/features/social-media/domain/status";

export {
  SOCIAL_CONNECTION_HEALTH_OVERLAYS,
  isSocialConnectionHealthOverlay,
} from "@/features/social-media/domain/health";
export type { SocialConnectionHealthOverlay } from "@/features/social-media/domain/health";

export {
  resolveSocialConnectionUsability,
  isSocialConnectionUsableForPrivilegedProviderCalls,
} from "@/features/social-media/domain/usability";
export type { SocialConnectionUsability } from "@/features/social-media/domain/usability";

export {
  SOCIAL_BETA1_CAPABILITIES,
  DEFERRED_SOCIAL_CAPABILITIES,
  isSocialBeta1Capability,
  isDeferredSocialCapability,
  createEmptySocialCapabilitySnapshot,
  snapshotIncludesCapability,
} from "@/features/social-media/domain/capabilities";
export type {
  SocialBeta1Capability,
  DeferredSocialCapability,
  SocialCapabilitySnapshot,
} from "@/features/social-media/domain/capabilities";

export {
  isOrganizationUsableForSocialConnectionMutation,
  canManageSocialConnections,
  canViewSocialConnections,
  resolveSocialConnectionPermissions,
} from "@/features/social-media/domain/permissions";

export {
  SOCIAL_CONNECTION_EVENT_TYPES,
  SOCIAL_CONNECTION_EVENT_ACTOR_SOURCES,
  isSocialConnectionEventType,
  actorSourceForSocialConnectionEvent,
} from "@/features/social-media/domain/events";
export type {
  SocialConnectionEventType,
  SocialConnectionEventActorSource,
  SocialConnectionAuditEvent,
} from "@/features/social-media/domain/events";

export {
  SOCIAL_PROVIDER_ERROR_KINDS,
  SOCIAL_PUBLIC_ERROR_FORBIDDEN_KEYS,
  isSocialProviderErrorKind,
  createSafeSocialProviderError,
  socialPublicErrorHasForbiddenKey,
} from "@/features/social-media/domain/errors";
export type {
  SocialProviderErrorKind,
  SafeSocialProviderError,
  SocialPublicErrorForbiddenKey,
} from "@/features/social-media/domain/errors";

export {
  isAccountInAuthorizedInventory,
  selectAuthorizedAccount,
} from "@/features/social-media/domain/identity";
export type {
  SocialProviderAccountIdentity,
  SocialAuthorizedAccountInventory,
} from "@/features/social-media/domain/identity";

export { resolveSocialTokenExpiryWarningState } from "@/features/social-media/domain/credentials";
export type {
  SocialCredentialMetadata,
  SocialTokenExpiryWarningState,
} from "@/features/social-media/domain/credentials";

export {
  SOCIAL_CONNECTION_CLIENT_FORBIDDEN_KEYS,
  toSocialConnectionClientReadModel,
  socialConnectionClientReadModelLooksSafe,
} from "@/features/social-media/domain/connection";
export type {
  SocialAccountConnection,
  SocialConnectionClientReadModel,
  SocialConnectionClientForbiddenKey,
  SocialConnectionClientReadModelHasNoForbiddenKeys,
  SocialAccountConnectionHasNoForbiddenKeys,
} from "@/features/social-media/domain/connection";

export {
  SOCIAL_OAUTH_RETURN_PATH_IDS,
  SOCIAL_OAUTH_INTENT_STATUSES,
  isSocialOAuthReturnPathId,
  mapSocialOAuthReturnPathId,
  isSocialOAuthIntentExpired,
  isSocialOAuthIntentConsumable,
} from "@/features/social-media/domain/oauth-intent";
export type {
  SocialOAuthReturnPathId,
  SocialOAuthIntentStatus,
  SocialOAuthIntent,
} from "@/features/social-media/domain/oauth-intent";

export {
  SOCIAL_OAUTH_STATE_DOMAIN_FORBIDDEN_KEYS,
  SOCIAL_OAUTH_STATE_FINGERPRINT_PATTERN,
  isSocialOAuthStateFingerprint,
} from "@/features/social-media/domain/oauth-state";
export type {
  SocialOAuthStateFingerprint,
  StoredSocialOAuthState,
} from "@/features/social-media/domain/oauth-state";

export type {
  SocialConnectRequest,
  SocialDisconnectRequest,
  SocialReauthorizeRequest,
  SocialConnectFailureCode,
  SocialConnectResult,
  SocialCallbackSuccess,
  SocialCallbackFailureCode,
  SocialCallbackResult,
  SocialReauthorizeResult,
  SocialDisconnectResult,
} from "@/features/social-media/domain/results";

export {
  SOCIAL_CONNECTIONS_ENABLED_ENV,
  SOCIAL_INSTAGRAM_CONNECTIONS_ENABLED_ENV,
  SOCIAL_CREDENTIAL_ENCRYPTION_KEY_ENV,
  SOCIAL_INSTAGRAM_CLIENT_ID_ENV,
  SOCIAL_INSTAGRAM_CLIENT_SECRET_ENV,
  SOCIAL_INSTAGRAM_OAUTH_REDIRECT_URI_ENV,
  parseSocialConnectionsEnabled,
  parseSocialInstagramConnectionsEnabled,
  areSocialInstagramConnectionsEnabled,
} from "@/features/social-media/domain/feature-gate";

export { provesSocialTenantAuthority } from "@/features/social-media/domain/tenant";
export type { SocialTenantAuthorityProof } from "@/features/social-media/domain/tenant";

export {
  PLANNED_SOCIAL_PROVIDERS,
  SOCIAL_PROVIDER_ROLLOUT_WAVES,
  isPlannedSocialProvider,
} from "@/features/social-media/domain/planned-providers";
export type {
  PlannedSocialProvider,
  SocialProviderRolloutWave,
  SocialAuthorizationProduct,
} from "@/features/social-media/domain/planned-providers";

export {
  SOCIAL_CAPABILITY_AVAILABILITY_STATES,
  SOCIAL_UNIVERSAL_CAPABILITY_CATALOG,
  SOCIAL_ACTION_AUTHORIZATION_CLASSES,
  SOCIAL_DATA_PROVENANCE_KINDS,
  SOCIAL_SCOPE_CLASSIFICATIONS,
  isSocialCapabilityAvailabilityState,
} from "@/features/social-media/domain/universal-contracts";
export type {
  SocialCapabilityAvailabilityState,
  SocialUniversalCapabilityId,
  SocialCapabilityResolution,
  SocialProviderAdapterSegment,
  SocialActionAuthorizationClass,
  SocialDataProvenanceKind,
  SocialScopeClassification,
} from "@/features/social-media/domain/universal-contracts";
