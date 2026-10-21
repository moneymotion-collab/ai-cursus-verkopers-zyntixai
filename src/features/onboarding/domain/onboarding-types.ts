import type {
  BusinessType,
  OnboardingRequiredFieldKey,
  PrimaryAudience,
  PrimaryGoal,
  PrimaryOffering,
  TeamSizeBand,
} from "@/features/onboarding/domain/onboarding-options";
import { ONBOARDING_REQUIRED_FIELD_KEYS } from "@/features/onboarding/domain/onboarding-options";

export type OnboardingErrorCode =
  | "not_authenticated"
  | "membership_required"
  | "owner_required"
  | "organization_not_found"
  | "organization_ambiguous"
  | "validation_error"
  | "conflict"
  | "unexpected_error";

export type OnboardingFieldSnapshot = {
  displayName: string | null;
  organizationName: string;
  businessType: BusinessType | null;
  primaryAudience: PrimaryAudience | null;
  primaryOffering: PrimaryOffering | null;
  primaryGoal: PrimaryGoal | null;
  teamSizeBand: TeamSizeBand | null;
  onboardingCompletedAt: string | null;
  firstRunChecklistDismissedAt: string | null;
};

export type OnboardingContext = OnboardingFieldSnapshot & {
  organizationId: string;
  membershipRole: string;
  isOwner: boolean;
  isComplete: boolean;
  missingRequiredFields: OnboardingRequiredFieldKey[];
};

export type OnboardingReadResult =
  | { ok: true; context: OnboardingContext }
  | {
      ok: false;
      code: OnboardingErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export type OnboardingWriteResult =
  | { ok: true; context: OnboardingContext }
  | {
      ok: false;
      code: OnboardingErrorCode;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export function computeMissingRequiredFields(input: {
  displayName: string | null;
  organizationName: string | null;
  businessType: string | null;
  primaryAudience: string | null;
  primaryOffering: string | null;
  primaryGoal: string | null;
}): OnboardingRequiredFieldKey[] {
  const missing: OnboardingRequiredFieldKey[] = [];
  const checks: Record<OnboardingRequiredFieldKey, boolean> = {
    displayName: Boolean(input.displayName?.trim()),
    organizationName: Boolean(input.organizationName?.trim()),
    businessType: Boolean(input.businessType),
    primaryAudience: Boolean(input.primaryAudience),
    primaryOffering: Boolean(input.primaryOffering),
    primaryGoal: Boolean(input.primaryGoal),
  };

  for (const key of ONBOARDING_REQUIRED_FIELD_KEYS) {
    if (!checks[key]) {
      missing.push(key);
    }
  }
  return missing;
}

export function isOnboardingComplete(
  onboardingCompletedAt: string | null | undefined,
): boolean {
  return Boolean(onboardingCompletedAt);
}
