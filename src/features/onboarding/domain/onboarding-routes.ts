export const WORKSPACE_CONFIRMATION_ONBOARDING_PATH =
  "/onboarding/workspace-confirmation" as const;
export const TEAM_ONBOARDING_PATH = "/onboarding/team" as const;
export const CREATING_ONBOARDING_PATH = "/onboarding/creating" as const;

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
