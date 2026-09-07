export const ONBOARDING_FLOW_VERSIONS = [1, 2] as const;

export type OnboardingFlowVersion = (typeof ONBOARDING_FLOW_VERSIONS)[number];

/**
 * NULL is a deliberate persisted state: the organization is grandfathered or
 * not enrolled in either governed onboarding flow.
 */
export type PersistedOnboardingFlowVersion = OnboardingFlowVersion | null;

export function isOnboardingFlowVersion(
  value: unknown,
): value is OnboardingFlowVersion {
  return value === 1 || value === 2;
}
