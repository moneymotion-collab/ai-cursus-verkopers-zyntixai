import {
  buildOnboardingPath,
  buildProductDestination,
} from "@/features/onboarding/domain/onboarding-steps";
import { buildOperatingModelOnboardingPath } from "@/features/onboarding/domain/operating-model";
import type { OnboardingStageRoute } from "@/features/onboarding/domain/onboarding-lifecycle";

export const WORKSPACE_CONFIRMATION_ONBOARDING_PATH =
  "/onboarding/workspace-confirmation" as const;
export const TEAM_ONBOARDING_PATH = "/onboarding/team" as const;
export const CREATING_ONBOARDING_PATH = "/onboarding/creating" as const;
export const READY_ONBOARDING_PATH = "/onboarding/ready" as const;

function withOrganization(path: string, organizationId?: string): string {
  return organizationId
    ? `${path}?org=${encodeURIComponent(organizationId)}`
    : path;
}

export function buildWorkspaceConfirmationOnboardingPath(
  organizationId: string,
): string {
  return withOrganization(
    WORKSPACE_CONFIRMATION_ONBOARDING_PATH,
    organizationId,
  );
}

export function buildTeamOnboardingPath(organizationId?: string): string {
  return withOrganization(TEAM_ONBOARDING_PATH, organizationId);
}

export function buildCreatingOnboardingPath(organizationId?: string): string {
  return withOrganization(CREATING_ONBOARDING_PATH, organizationId);
}

export function buildReadyOnboardingPath(organizationId?: string): string {
  return withOrganization(READY_ONBOARDING_PATH, organizationId);
}

export function buildOnboardingStagePath(
  stage: OnboardingStageRoute,
  organizationId: string,
): string {
  switch (stage) {
    case "home":
      return buildProductDestination(organizationId);
    case "operating_model":
      return buildOperatingModelOnboardingPath(organizationId);
    case "workspace":
      return buildWorkspaceConfirmationOnboardingPath(organizationId);
    case "creating":
      return buildCreatingOnboardingPath(organizationId);
    case "onboarding":
      return buildOnboardingPath(organizationId);
  }
}
