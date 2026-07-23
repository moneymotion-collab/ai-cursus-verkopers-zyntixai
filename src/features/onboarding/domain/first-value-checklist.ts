export const FIRST_VALUE_CHECKLIST_TOTAL_REQUIRED = 3 as const;

export type FirstValueChecklistRole = "owner" | "admin" | "staff" | "viewer";

export type FirstValueChecklistDerivationInput = {
  organizationId: string;
  role: string;
  onboardingCompletedAt: string | null;
  firstRunChecklistDismissedAt: string | null;
  hasNonArchivedLead: boolean;
  hasNonArchivedTask: boolean;
};

export type FirstValueChecklistViewModel = {
  visible: boolean;
  organizationId: string;
  completedCount: number;
  totalRequired: typeof FIRST_VALUE_CHECKLIST_TOTAL_REQUIRED;
  companySetupComplete: boolean;
  firstLeadComplete: boolean;
  firstTaskComplete: boolean;
  companySetupHref: string;
  firstLeadHref: string;
  firstTaskHref: string;
  customerSoftLinkHref: string;
};

export function canManageFirstValueChecklist(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function buildFirstValueChecklistHrefs(organizationId: string): {
  companySetupHref: string;
  firstLeadHref: string;
  firstTaskHref: string;
  customerSoftLinkHref: string;
} {
  const orgQuery = `?org=${encodeURIComponent(organizationId)}`;
  return {
    companySetupHref: `/onboarding${orgQuery}`,
    firstLeadHref: `/leads/new${orgQuery}`,
    firstTaskHref: `/tasks/new${orgQuery}`,
    customerSoftLinkHref: `/customers${orgQuery}`,
  };
}

/**
 * Pure B1.4 checklist derivation. Counts must already be org-scoped and
 * independent of the current leads list filters.
 */
export function deriveFirstValueChecklist(
  input: FirstValueChecklistDerivationInput,
): FirstValueChecklistViewModel {
  const hrefs = buildFirstValueChecklistHrefs(input.organizationId);
  const companySetupComplete = Boolean(input.onboardingCompletedAt);
  const firstLeadComplete = input.hasNonArchivedLead;
  const firstTaskComplete = input.hasNonArchivedTask;
  const completedCount =
    Number(companySetupComplete) +
    Number(firstLeadComplete) +
    Number(firstTaskComplete);

  const visible =
    canManageFirstValueChecklist(input.role) &&
    companySetupComplete &&
    input.firstRunChecklistDismissedAt == null &&
    completedCount < FIRST_VALUE_CHECKLIST_TOTAL_REQUIRED;

  return {
    visible,
    organizationId: input.organizationId,
    completedCount,
    totalRequired: FIRST_VALUE_CHECKLIST_TOTAL_REQUIRED,
    companySetupComplete,
    firstLeadComplete,
    firstTaskComplete,
    ...hrefs,
  };
}
