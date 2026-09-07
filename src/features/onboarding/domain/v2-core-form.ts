import {
  parseV2CoreDraftInput,
  type V2CoreDraftInput,
} from "@/features/onboarding/domain/onboarding-schema";
import type { TeamSizeBand } from "@/features/onboarding/domain/onboarding-options";

export type V2CoreFormValues = {
  displayName: string;
  organizationName: string;
  teamSizeBand: TeamSizeBand | "";
};

export type V2CoreFieldErrors = Partial<
  Record<keyof V2CoreFormValues, string[]>
>;

export function validateV2CoreForm(
  organizationId: string,
  values: V2CoreFormValues,
):
  | { success: true; input: V2CoreDraftInput }
  | { success: false; fieldErrors: V2CoreFieldErrors } {
  const parsed = parseV2CoreDraftInput({ organizationId, ...values });
  if (parsed.success) {
    return { success: true, input: parsed.data };
  }

  const fieldErrors: V2CoreFieldErrors = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0];
    if (
      key === "displayName" ||
      key === "organizationName" ||
      key === "teamSizeBand"
    ) {
      fieldErrors[key] ??= [];
      fieldErrors[key].push(issue.message);
    }
  }
  return { success: false, fieldErrors };
}

export function firstInvalidV2CoreField(
  errors: V2CoreFieldErrors,
): keyof V2CoreFormValues | null {
  for (const field of [
    "displayName",
    "organizationName",
    "teamSizeBand",
  ] as const) {
    if (errors[field]?.length) {
      return field;
    }
  }
  return null;
}
