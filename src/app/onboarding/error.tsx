"use client";

import { OnboardingErrorFallback } from "@/features/onboarding/ui/onboarding-error-fallback";

type OnboardingErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function OnboardingError({ reset }: OnboardingErrorProps) {
  return <OnboardingErrorFallback reset={reset} />;
}
