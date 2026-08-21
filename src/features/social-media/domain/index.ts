export type {
  SocialOrganizationId,
  SocialWorkspaceId,
  SocialBrandId,
  SocialConnectionId,
  SocialMemberId,
  SocialUserId,
  SocialCredentialReferenceId,
  SocialOAuthIntentId,
  SocialExternalAccountId,
  SocialConnectionPermissionSet,
  SocialWorkspacePermissionSet,
  SocialContentPermissionSet,
  SocialConnectionOrgStatus,
} from "@/features/social-media/domain/types";
export {
  EMPTY_SOCIAL_CONNECTION_PERMISSIONS,
  EMPTY_SOCIAL_WORKSPACE_PERMISSIONS,
  EMPTY_SOCIAL_CONTENT_PERMISSIONS,
} from "@/features/social-media/domain/types";

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
  RECONNECTABLE_SOCIAL_CONNECTION_STATUSES,
  REAUTHORIZATION_FINALIZABLE_SOCIAL_CONNECTION_STATUSES,
  isSocialConnectionStatus,
  isActiveSocialConnectionStatus,
  isTerminalSocialConnectionStatus,
  isCapabilityEligibleSocialConnectionStatus,
  isSocialConnectionReauthorizationRequired,
  isReconnectableSocialConnectionStatus,
  isReauthorizationFinalizableSocialConnectionStatus,
  findReconnectableInstagramConnection,
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
  canManageSocialWorkspaces,
  canViewSocialWorkspaces,
  resolveSocialWorkspacePermissions,
  canManageSocialContent,
  canApproveSocialContent,
  canViewSocialContent,
  resolveSocialContentPermissions,
  canScheduleSocialPublication,
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

export {
  SOCIAL_BRAND_TRUTH_SOURCE_KINDS,
  SOCIAL_BRAND_RULE_KINDS,
  SOCIAL_GOAL_KINDS,
  SOCIAL_CAMPAIGN_STATUSES,
  SOCIAL_OFFERS_B13_DECISION,
  isSocialBrandTruthSourceKind,
  isCanonicalBrandTruthSourceKind,
} from "@/features/social-media/domain/brand-brain";
export type {
  SocialBrandTruthSourceKind,
  SocialBrandRuleKind,
  SocialGoalKind,
  SocialCampaignStatus,
  SocialBrandVoiceConfig,
  SocialBrandProfile,
  SocialAudience,
  SocialContentPillar,
  SocialGoal,
  SocialPlatformStrategy,
  SocialCampaign,
} from "@/features/social-media/domain/brand-brain";

export {
  toSocialWorkspaceClientReadModel,
  isSocialWorkspaceArchived,
  isSocialWorkspaceEligibleForConnection,
  SOCIAL_WORKSPACE_CLIENT_FORBIDDEN_KEYS,
} from "@/features/social-media/domain/workspace";
export type {
  SocialBrand,
  SocialWorkspace,
  SocialWorkspaceClientReadModel,
  SocialWorkspaceClientForbiddenKey,
} from "@/features/social-media/domain/workspace";

export {
  SOCIAL_WORKSPACE_EVENT_TYPES,
  SOCIAL_WORKSPACE_EVENT_ACTOR_SOURCES,
  isSocialWorkspaceEventType,
} from "@/features/social-media/domain/workspace-events";
export type {
  SocialWorkspaceEventType,
  SocialWorkspaceEventActorSource,
} from "@/features/social-media/domain/workspace-events";

export {
  SOCIAL_CONTENT_ORIGIN_KINDS,
  SOCIAL_CONTENT_LIFECYCLE_STATUSES,
  SOCIAL_CONTENT_FORMATS,
  SOCIAL_MEDIA_CATEGORIES,
  SOCIAL_MEDIA_PROCESSING_STATES,
  SOCIAL_MEDIA_ASSET_ROLES,
  SOCIAL_MEDIA_DERIVATION_KINDS,
  SOCIAL_VARIANT_PROVIDER_CONFIG_KEYS,
  SOCIAL_MEDIA_STORAGE_DECISION,
  SOCIAL_CONTENT_FORBIDDEN_LIFECYCLE_STATES,
  isSocialContentOriginKind,
  isSocialContentLifecycleStatus,
  isSocialContentFormat,
  isSocialMediaCategory,
  isSocialMediaProcessingState,
  isSocialMediaAssetRole,
  isSocialVariantProviderConfig,
  assertVariantProviderIsPlanned,
} from "@/features/social-media/domain/content";
export type {
  SocialContentOriginKind,
  SocialContentLifecycleStatus,
  SocialContentFormat,
  SocialMediaCategory,
  SocialMediaProcessingState,
  SocialMediaAssetRole,
  SocialMediaDerivationKind,
  SocialVariantProviderConfigKey,
  SocialVariantProviderConfig,
  SocialContentItem,
  SocialContentVariant,
  SocialMediaAsset,
  SocialMediaAttachment,
} from "@/features/social-media/domain/content";

export {
  SOCIAL_REVIEW_REQUEST_STATUSES,
  SOCIAL_APPROVAL_CONTEXTS,
  SOCIAL_APPROVAL_DECISIONS,
  SOCIAL_SCHEDULE_SLOT_STATUSES,
  SOCIAL_CLIENT_APPROVAL_B15_DECISION,
  SOCIAL_SELF_APPROVAL_B15_POLICY,
  SOCIAL_WORKFLOW_FORBIDDEN_PUBLICATION_STATES,
  isSocialReviewRequestStatus,
  isSocialApprovalContext,
  isSocialApprovalDecisionKind,
  isSocialScheduleSlotStatus,
  isReviewOverdue,
  computeWorkflowReady,
} from "@/features/social-media/domain/workflow";
export type {
  SocialReviewRequestStatus,
  SocialApprovalContext,
  SocialApprovalDecisionKind,
  SocialScheduleSlotStatus,
  SocialVariantVersionWorkflowReadiness,
  SocialContentItemVersion,
  SocialContentVariantVersion,
  SocialReviewRequest,
  SocialApprovalDecision,
  SocialContentScheduleSlot,
} from "@/features/social-media/domain/workflow";

export {
  SOCIAL_PUBLISHING_ENABLED_ENV,
  SOCIAL_PUBLICATION_STATUSES,
  SOCIAL_PUBLICATION_EXECUTION_MODES,
  SOCIAL_PUBLICATION_ATTEMPT_OUTCOMES,
  SOCIAL_PUBLICATION_FAILURE_CLASSES,
  SOCIAL_PROVIDER_READINESS_STATES,
  SOCIAL_INSTAGRAM_PUBLISHING_ADAPTER_STATUS,
  SOCIAL_PUBLICATION_CLIENT_FORBIDDEN_KEYS,
  parseSocialPublishingEnabled,
  isSocialPublishingExecutionEnabled,
  isSocialPublicationStatus,
  requiredCapabilityForContentFormat,
  createEmptySocialPublishingAdapterRegistry,
  resolvePublishingAdapterOrUnavailable,
  isRetryableFailureClass,
  computePublicationBackoffSeconds,
} from "@/features/social-media/domain/publishing";
export type {
  SocialPublicationStatus,
  SocialPublicationExecutionMode,
  SocialPublicationAttemptOutcome,
  SocialPublicationFailureClass,
  SocialProviderReadinessState,
  SocialPublicationMediaReference,
  SocialPublicationExecutionInput,
  SocialPublishingAdapterResult,
  SocialPublishingAdapter,
  SocialPublishingAdapterRegistry,
  SocialPublicationClientReadModel,
} from "@/features/social-media/domain/publishing";

export {
  SOCIAL_PUBLICATION_TERMINAL_STATUSES,
  SOCIAL_PUBLICATION_PROVIDER_WRITE_BLOCKED_STATUSES,
  SOCIAL_PUBLICATION_ABANDONABLE_STATUSES,
  SOCIAL_PUBLICATION_SAFE_RETRY_STATUSES,
  SOCIAL_PUBLICATION_PREPARE_IDEMPOTENT_REUSE_STATUSES,
  UNKNOWN_EXTERNAL_RESOLUTIONS,
  isTerminalPublicationStatus,
  isProviderWriteBlockedStatus,
  isAbandonablePublicationStatus,
  isPrepareIdempotentReuseStatus,
  isSafeToRetryProviderWrite,
  classifyFailureRetryPolicy,
  deriveConnectionOperationalHealth,
  isHealthyConnectedAccount,
  resolvePublicationOperatorAction,
  attemptTimelineStage,
  isUnknownExternalResolution,
} from "@/features/social-media/domain/lifecycle";
export type {
  UnknownExternalResolution,
  SocialConnectionOperationalHealth,
  PublicationActionAvailability,
} from "@/features/social-media/domain/lifecycle";

export {
  SOCIAL_CLOSED_BETA_ENROLLMENT_STATUSES,
  SOCIAL_CLOSED_BETA_ENROLLMENT_EVENT_TYPES,
  SOCIAL_CLOSED_BETA_OPERATOR_ACTIONS,
  isSocialClosedBetaEnrollmentStatus,
  isSocialClosedBetaEffectiveStatus,
  canPrepareWithClosedBetaEnrollment,
  canExecuteWithClosedBetaEnrollment,
  closedBetaPrepareDenialCode,
  closedBetaPublishDenialCode,
  userSafeClosedBetaDenialMessage,
  isLegalClosedBetaTransition,
  nextClosedBetaStatusAfterAction,
  evaluateSocialProviderWriteAuthorization,
} from "@/features/social-media/domain/closed-beta-enrollment";
export type {
  SocialClosedBetaEnrollmentStatus,
  SocialClosedBetaEffectiveStatus,
  SocialClosedBetaEnrollmentEventType,
  SocialClosedBetaOperatorAction,
  SocialClosedBetaEntitlementDenialCode,
} from "@/features/social-media/domain/closed-beta-enrollment";

export {
  SOCIAL_CONTROLLED_PUBLISH_WINDOW_STATUSES,
  PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW,
  CONTROLLED_WINDOW_EXHAUSTED,
  PREPARE_BLOCKED_BY_CONTROLLED_WINDOW_COPY,
  isSocialControlledPublishWindowStatus,
  evaluateControlledPublishWindowBinding,
  isPrepareBlockedByActiveControlledWindow,
  userSafeControlledWindowDenialMessage,
} from "@/features/social-media/domain/controlled-publish-window";
export type {
  SocialControlledPublishWindowStatus,
  ActiveControlledPublishWindow,
} from "@/features/social-media/domain/controlled-publish-window";

export {
  SOCIAL_CLOSED_BETA_OPERATOR_UI_ENABLED_ENV,
  SOCIAL_CLOSED_BETA_OPERATOR_EMAIL_ALLOWLIST_ENV,
  parseSocialClosedBetaOperatorUiEnabled,
  parseSocialClosedBetaOperatorEmailAllowlist,
  isSocialClosedBetaOperatorEmailAllowlisted,
  resolveSocialClosedBetaPlatformOperatorAccess,
} from "@/features/social-media/domain/platform-operator-identity";

export {
  SOCIAL_CLOSED_BETA_OPERATOR_ROUTE,
  SOCIAL_CLOSED_BETA_OPERATOR_NAV_LABEL,
  isSocialClosedBetaOperatorPathname,
  buildSocialClosedBetaOperatorListHref,
  buildSocialClosedBetaOperatorDetailHref,
} from "@/features/social-media/domain/platform-operator-navigation";

export {
  buildSocialClosedBetaCustomerReadModel,
  canConnectWithClosedBetaEnrollment,
  isSocialNavVisibleForClosedBetaEnrollment,
  resolveSocialClosedBetaCustomerActionMatrix,
  resolveSocialNavVisible,
} from "@/features/social-media/domain/social-closed-beta-customer-read-model";
export type {
  SocialClosedBetaCustomerReadModel,
  SocialClosedBetaCustomerActionMatrix,
} from "@/features/social-media/domain/social-closed-beta-customer-read-model";

export {
  SOCIAL_SCHEDULE_MISS_GRACE_SECONDS,
  SOCIAL_PUBLICATION_SCHEDULE_ELIGIBLE_STATUSES,
  SOCIAL_PUBLICATION_SCHEDULE_BLOCKED_STATUSES,
  parseUnambiguousExecutionInstant,
  isFutureExecutionInstant,
  resolveSocialPublicationScheduleEligibility,
} from "@/features/social-media/domain/scheduling";

export {
  SOCIAL_SCHEDULING_ENABLED_ENV,
  SOCIAL_SCHEDULER_CRON_PATH,
  SOCIAL_SCHEDULER_CRON_SCHEDULE,
  SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET,
  SOCIAL_SCHEDULER_MAX_DURATION_SECONDS,
  SOCIAL_SCHEDULER_CLAIM_LEASE_SECONDS,
  SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT,
  SOCIAL_SCHEDULER_DISCOVERY_LIMIT,
  SOCIAL_SCHEDULER_CRON_SECRET_ENV,
  parseSocialSchedulingEnabled,
  resolveSocialSchedulerMode,
  socialSchedulerAllowsClaim,
  socialSchedulerAllowsProviderWrite,
  isDueScheduledClock,
  isMissedBeyondSchedulerGrace,
  authorizeSocialSchedulerCronRequest,
  createEmptySocialSchedulerSummary,
  classifySchedulerStartCode,
} from "@/features/social-media/domain/scheduler";
export type {
  SocialSchedulerMode,
  SocialSchedulerSafeSummary,
  SocialSchedulerDueRow,
  SocialSchedulerSkipReason,
} from "@/features/social-media/domain/scheduler";

export {
  SOCIAL_CALENDAR_AUTOMATIC_EXECUTION_ENABLED,
  resolveSocialCalendarStatusKind,
  socialCalendarStatusLabel,
  publicationIsScheduledCalendarItem,
  projectPublicationToCalendarItem,
  resolveCalendarMutationFlags,
  userSafeSocialScheduleActionMessage,
} from "@/features/social-media/domain/calendar";
export type {
  SocialCalendarItemView,
  SocialCalendarEligiblePublication,
  SocialCalendarStatusKind,
} from "@/features/social-media/domain/calendar";

export {
  isValidIanaTimeZone,
  resolveSocialCalendarTimezone,
  convertLocalWallTimeToUtcIso,
  getZonedWeekUtcBounds,
} from "@/features/social-media/domain/calendar-timezone";
