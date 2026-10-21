import type { Metadata } from "next";
import {
  applyAuthenticatedTitleTemplate,
  AUTHENTICATED_DOCUMENT_TITLE_BRAND,
  AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE,
} from "@/features/workspace/authenticated-document-titles";

/**
 * Onboarding document-title contract (CB-VIS-1-R4-B).
 *
 * Privacy boundary: titles identify the onboarding stage only. Do not load
 * Auth, organization, operating-model, or invitation data solely to populate
 * a document title. Do not interpolate organization names, user names, emails,
 * or selected onboarding answers.
 */
export const ONBOARDING_DOCUMENT_TITLE_BRAND = AUTHENTICATED_DOCUMENT_TITLE_BRAND;
export const ONBOARDING_DOCUMENT_TITLE_TEMPLATE =
  AUTHENTICATED_DOCUMENT_TITLE_TEMPLATE;
export const ONBOARDING_DOCUMENT_TITLE_DEFAULT_SEGMENT =
  "Set up workspace" as const;
export const ONBOARDING_DOCUMENT_TITLE_DEFAULT = applyAuthenticatedTitleTemplate(
  ONBOARDING_DOCUMENT_TITLE_DEFAULT_SEGMENT,
);

export const ONBOARDING_ROUTE_TITLES = {
  "/onboarding": "Set up workspace",
  "/onboarding/operating-model": "Choose operating model",
  "/onboarding/team": "Invite your team",
  "/onboarding/workspace-confirmation": "Confirm workspace",
  "/onboarding/creating": "Creating workspace",
  "/onboarding/ready": "Workspace ready",
} as const;

export type OnboardingRoute = keyof typeof ONBOARDING_ROUTE_TITLES;

export function resolveOnboardingPageDocumentTitle(route: OnboardingRoute): string {
  return applyAuthenticatedTitleTemplate(ONBOARDING_ROUTE_TITLES[route]);
}

export function onboardingLayoutMetadata(): Metadata {
  return {
    title: {
      default: ONBOARDING_DOCUMENT_TITLE_DEFAULT,
      template: ONBOARDING_DOCUMENT_TITLE_TEMPLATE,
    },
  };
}

export function onboardingPageMetadata(route: OnboardingRoute): Metadata {
  return {
    title: ONBOARDING_ROUTE_TITLES[route],
  };
}
