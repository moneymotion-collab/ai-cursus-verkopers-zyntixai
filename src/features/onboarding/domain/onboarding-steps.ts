import type { OnboardingContext } from "@/features/onboarding/domain/onboarding-types";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  PRIMARY_AUDIENCES,
  PRIMARY_AUDIENCE_LABELS,
  PRIMARY_GOALS,
  PRIMARY_GOAL_LABELS,
  PRIMARY_OFFERINGS,
  PRIMARY_OFFERING_LABELS,
  TEAM_SIZE_BANDS,
  TEAM_SIZE_BAND_LABELS,
  type BusinessType,
  type PrimaryAudience,
  type PrimaryGoal,
  type PrimaryOffering,
  type TeamSizeBand,
} from "@/features/onboarding/domain/onboarding-options";

export const ONBOARDING_STEP_COUNT = 3 as const;

export type OnboardingStepNumber = 1 | 2 | 3;

export type OnboardingFormValues = {
  displayName: string;
  organizationName: string;
  businessType: BusinessType | "";
  primaryAudience: PrimaryAudience | "";
  primaryOffering: PrimaryOffering | "";
  primaryGoal: PrimaryGoal | "";
  teamSizeBand: TeamSizeBand | "";
};

export type OnboardingStepDefinition = {
  step: OnboardingStepNumber;
  title: string;
  supportingCopy: string;
  progressLabel: string;
};

export const ONBOARDING_STEPS: readonly OnboardingStepDefinition[] = [
  {
    step: 1,
    title: "Tell us about your business",
    supportingCopy:
      "We use this information to tailor ZyntixAI to the way you work.",
    progressLabel: "Step 1 of 3",
  },
  {
    step: 2,
    title: "What do you offer, and who is it for?",
    supportingCopy: "Choose the offer and audience that best match your work.",
    progressLabel: "Step 2 of 3",
  },
  {
    step: 3,
    title: "What should ZyntixAI help you improve first?",
    supportingCopy: "Pick a starting goal. You can refine details later.",
    progressLabel: "Step 3 of 3",
  },
] as const;

export const ONBOARDING_FIELD_MESSAGES = {
  displayName: "Enter your name.",
  organizationName: "Enter your company name.",
  businessType: "Choose the type of business you run.",
  primaryAudience: "Choose your primary audience.",
  primaryOffering: "Choose your main offer.",
  primaryGoal: "Choose what you want ZyntixAI to help with first.",
} as const;

export function parseOnboardingStep(raw: unknown): OnboardingStepNumber {
  const value =
    typeof raw === "string" || typeof raw === "number" ? Number(raw) : NaN;
  if (value === 2) {
    return 2;
  }
  if (value === 3) {
    return 3;
  }
  return 1;
}

export function formValuesFromContext(
  context: OnboardingContext,
): OnboardingFormValues {
  return {
    displayName: context.displayName?.trim() ?? "",
    organizationName: context.organizationName?.trim() ?? "",
    businessType: context.businessType ?? "",
    primaryAudience: context.primaryAudience ?? "",
    primaryOffering: context.primaryOffering ?? "",
    primaryGoal: context.primaryGoal ?? "",
    teamSizeBand: context.teamSizeBand ?? "",
  };
}

/**
 * Resume at the first incomplete step based on saved server values.
 */
export function resolveInitialOnboardingStep(
  values: OnboardingFormValues,
): OnboardingStepNumber {
  if (
    !values.displayName.trim() ||
    !values.organizationName.trim() ||
    !values.businessType
  ) {
    return 1;
  }
  if (!values.primaryAudience || !values.primaryOffering) {
    return 2;
  }
  if (!values.primaryGoal) {
    return 3;
  }
  return 3;
}

export function validateOnboardingStep(
  step: OnboardingStepNumber,
  values: OnboardingFormValues,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};

  if (step === 1) {
    if (!values.displayName.trim()) {
      fieldErrors.displayName = [ONBOARDING_FIELD_MESSAGES.displayName];
    }
    if (!values.organizationName.trim()) {
      fieldErrors.organizationName = [ONBOARDING_FIELD_MESSAGES.organizationName];
    }
    if (!values.businessType || !BUSINESS_TYPES.includes(values.businessType)) {
      fieldErrors.businessType = [ONBOARDING_FIELD_MESSAGES.businessType];
    }
  }

  if (step === 2) {
    if (
      !values.primaryAudience ||
      !PRIMARY_AUDIENCES.includes(values.primaryAudience)
    ) {
      fieldErrors.primaryAudience = [ONBOARDING_FIELD_MESSAGES.primaryAudience];
    }
    if (
      !values.primaryOffering ||
      !PRIMARY_OFFERINGS.includes(values.primaryOffering)
    ) {
      fieldErrors.primaryOffering = [ONBOARDING_FIELD_MESSAGES.primaryOffering];
    }
  }

  if (step === 3) {
    if (!values.primaryGoal || !PRIMARY_GOALS.includes(values.primaryGoal)) {
      fieldErrors.primaryGoal = [ONBOARDING_FIELD_MESSAGES.primaryGoal];
    }
  }

  return fieldErrors;
}

export function firstInvalidField(
  fieldErrors: Record<string, string[]>,
): string | null {
  const order = [
    "displayName",
    "organizationName",
    "businessType",
    "primaryAudience",
    "primaryOffering",
    "primaryGoal",
    "teamSizeBand",
  ];
  for (const key of order) {
    if (fieldErrors[key]?.length) {
      return key;
    }
  }
  return Object.keys(fieldErrors)[0] ?? null;
}

export function buildDraftPayload(
  organizationId: string,
  step: OnboardingStepNumber,
  values: OnboardingFormValues,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { organizationId };

  if (step === 1) {
    payload.displayName = values.displayName.trim();
    payload.organizationName = values.organizationName.trim();
    payload.businessType = values.businessType;
  }

  if (step === 2) {
    payload.primaryAudience = values.primaryAudience;
    payload.primaryOffering = values.primaryOffering;
  }

  if (step === 3) {
    payload.primaryGoal = values.primaryGoal;
    if (values.teamSizeBand) {
      payload.teamSizeBand = values.teamSizeBand;
    } else {
      payload.clearTeamSizeBand = true;
    }
  }

  return payload;
}

export function buildCompletePayload(
  organizationId: string,
  values: OnboardingFormValues,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    organizationId,
    displayName: values.displayName.trim(),
    organizationName: values.organizationName.trim(),
    businessType: values.businessType,
    primaryAudience: values.primaryAudience,
    primaryOffering: values.primaryOffering,
    primaryGoal: values.primaryGoal,
  };

  if (values.teamSizeBand) {
    payload.teamSizeBand = values.teamSizeBand;
  }

  return payload;
}

export function buildProductDestination(organizationId: string): string {
  return `/leads?org=${encodeURIComponent(organizationId)}`;
}

export function buildOnboardingPath(organizationId?: string | null): string {
  if (!organizationId) {
    return "/onboarding";
  }
  return `/onboarding?org=${encodeURIComponent(organizationId)}`;
}

export function optionGroups() {
  return {
    businessTypes: BUSINESS_TYPES.map((value) => ({
      value,
      label: BUSINESS_TYPE_LABELS[value],
    })),
    primaryAudiences: PRIMARY_AUDIENCES.map((value) => ({
      value,
      label: PRIMARY_AUDIENCE_LABELS[value],
    })),
    primaryOfferings: PRIMARY_OFFERINGS.map((value) => ({
      value,
      label: PRIMARY_OFFERING_LABELS[value],
    })),
    primaryGoals: PRIMARY_GOALS.map((value) => ({
      value,
      label: PRIMARY_GOAL_LABELS[value],
    })),
    teamSizeBands: TEAM_SIZE_BANDS.map((value) => ({
      value,
      label: TEAM_SIZE_BAND_LABELS[value],
    })),
  };
}

export function reviewLabels(values: OnboardingFormValues) {
  return {
    displayName: values.displayName.trim() || "—",
    organizationName: values.organizationName.trim() || "—",
    businessType: values.businessType
      ? BUSINESS_TYPE_LABELS[values.businessType]
      : "—",
    primaryAudience: values.primaryAudience
      ? PRIMARY_AUDIENCE_LABELS[values.primaryAudience]
      : "—",
    primaryOffering: values.primaryOffering
      ? PRIMARY_OFFERING_LABELS[values.primaryOffering]
      : "—",
  };
}
