import type { PostgrestError } from "@supabase/supabase-js";
import type { OnboardingErrorCode } from "@/features/onboarding/domain/onboarding-types";

const MESSAGE_BY_CODE: Record<OnboardingErrorCode, string> = {
  not_authenticated: "Sign in to continue.",
  membership_required: "Join an organization before continuing setup.",
  owner_required: "Only the organization owner can update company setup.",
  organization_not_found: "That organization could not be found.",
  organization_ambiguous:
    "Choose which organization to set up before continuing.",
  validation_error: "Check the highlighted fields and try again.",
  conflict: "Could not save company setup because of a conflict. Try again.",
  unexpected_error: "Something went wrong. Try again.",
};

export function onboardingMessage(code: OnboardingErrorCode): string {
  return MESSAGE_BY_CODE[code];
}

export function mapOnboardingRpcError(
  error: PostgrestError | { message?: string; code?: string } | null,
): OnboardingErrorCode {
  const message = String(error?.message ?? "").toLowerCase();

  if (message.includes("not authenticated")) {
    return "not_authenticated";
  }
  if (message.includes("owner membership required")) {
    return "owner_required";
  }
  if (message.includes("organization not found")) {
    return "organization_not_found";
  }
  if (
    message.includes("invalid organization name") ||
    message.includes("invalid display name") ||
    message.includes("display name required") ||
    message.includes("organization name required") ||
    message.includes("onboarding fields incomplete") ||
    message.includes("invalid onboarding mode")
  ) {
    return "validation_error";
  }
  if (message.includes("unique") || message.includes("conflict")) {
    return "conflict";
  }

  return "unexpected_error";
}
