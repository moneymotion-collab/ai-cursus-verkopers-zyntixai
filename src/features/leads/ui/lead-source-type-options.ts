export const DEFAULT_LEAD_SOURCE_TYPE = "manual" as const;

export const LEAD_SOURCE_TYPE_OPTIONS = [
  { value: "manual", label: "Manual entry" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "website", label: "Website" },
  { value: "advertisement", label: "Advertisement" },
  { value: "referral", label: "Referral" },
  { value: "event", label: "Event" },
  { value: "email", label: "Email" },
  { value: "other", label: "Other" },
] as const;

export type LeadSourceTypeValue = (typeof LEAD_SOURCE_TYPE_OPTIONS)[number]["value"];

export type LeadSourceTypeOption = {
  value: string;
  label: string;
};

const CANONICAL_LEAD_SOURCE_TYPE_VALUES = new Set<string>(
  LEAD_SOURCE_TYPE_OPTIONS.map((option) => option.value),
);

export function isCanonicalLeadSourceType(value: string): value is LeadSourceTypeValue {
  return CANONICAL_LEAD_SOURCE_TYPE_VALUES.has(value);
}

/**
 * Select options for create/edit. When edit loads a historical `sourceType`
 * outside the canonical list, include that value so it stays selected and
 * can be preserved on submit without silent replacement.
 */
export function buildLeadSourceTypeSelectOptions(
  currentSourceType?: string | null,
): readonly LeadSourceTypeOption[] {
  const trimmed = currentSourceType?.trim() ?? "";
  if (!trimmed || isCanonicalLeadSourceType(trimmed)) {
    return LEAD_SOURCE_TYPE_OPTIONS;
  }

  return [{ value: trimmed, label: trimmed }, ...LEAD_SOURCE_TYPE_OPTIONS];
}

export function getLeadSourceTypeDisplayLabel(sourceType: string): string {
  const trimmed = sourceType.trim();
  if (!trimmed) {
    return trimmed;
  }

  const match = LEAD_SOURCE_TYPE_OPTIONS.find((option) => option.value === trimmed);
  return match?.label ?? trimmed;
}
