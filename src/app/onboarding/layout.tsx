import { onboardingLayoutMetadata } from "@/features/onboarding/onboarding-document-titles";

export const metadata = onboardingLayoutMetadata();

export default function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
