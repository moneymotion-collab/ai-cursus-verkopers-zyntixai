import type { SocialConnectionHealthOverlay } from "./health";
import {
  isCapabilityEligibleSocialConnectionStatus,
  isSocialConnectionReauthorizationRequired,
  isTerminalSocialConnectionStatus,
  type SocialConnectionStatus,
} from "./status";

/**
 * Pure, deterministic usability policy. Does not call providers.
 *
 * Examples:
 * - connected + healthy → potentially usable
 * - connected + degraded → capability-dependent (not privileged-call ready by default)
 * - connected + provider_unavailable → not usable for provider calls (not disconnected)
 * - reauthorization_required → not usable for privileged provider calls
 * - revoked / disconnected → unusable
 */
export type SocialConnectionUsability = {
  mayCallProvider: boolean;
  mayUseCapabilities: boolean;
  isCapabilityDependent: boolean;
  requiresReauthorization: boolean;
  isTerminalUntilReconnect: boolean;
};

export function resolveSocialConnectionUsability(
  status: SocialConnectionStatus,
  health: SocialConnectionHealthOverlay,
): SocialConnectionUsability {
  const isTerminalUntilReconnect = isTerminalSocialConnectionStatus(status);
  const requiresReauthorization =
    isSocialConnectionReauthorizationRequired(status);

  if (isTerminalUntilReconnect || requiresReauthorization) {
    return {
      mayCallProvider: false,
      mayUseCapabilities: false,
      isCapabilityDependent: false,
      requiresReauthorization,
      isTerminalUntilReconnect,
    };
  }

  if (!isCapabilityEligibleSocialConnectionStatus(status)) {
    return {
      mayCallProvider: false,
      mayUseCapabilities: false,
      isCapabilityDependent: false,
      requiresReauthorization: false,
      isTerminalUntilReconnect: false,
    };
  }

  if (health === "provider_unavailable") {
    return {
      mayCallProvider: false,
      mayUseCapabilities: false,
      isCapabilityDependent: false,
      requiresReauthorization: false,
      isTerminalUntilReconnect: false,
    };
  }

  if (health === "degraded") {
    return {
      mayCallProvider: false,
      mayUseCapabilities: true,
      isCapabilityDependent: true,
      requiresReauthorization: false,
      isTerminalUntilReconnect: false,
    };
  }

  return {
    mayCallProvider: true,
    mayUseCapabilities: true,
    isCapabilityDependent: false,
    requiresReauthorization: false,
    isTerminalUntilReconnect: false,
  };
}

export function isSocialConnectionUsableForPrivilegedProviderCalls(
  status: SocialConnectionStatus,
  health: SocialConnectionHealthOverlay,
): boolean {
  return resolveSocialConnectionUsability(status, health).mayCallProvider;
}
