/**
 * Canonical B1.2 onboarding option values (machine) and display labels.
 * UI and server must import from here — do not redefine lists elsewhere.
 */

export const BUSINESS_TYPES = [
  "course_seller",
  "trading_mentor",
  "business_coach",
  "online_coach",
  "membership_owner",
  "other",
] as const;

export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const BUSINESS_TYPE_LABELS: Record<BusinessType, string> = {
  course_seller: "Course seller",
  trading_mentor: "Trading mentor",
  business_coach: "Business coach",
  online_coach: "Online coach",
  membership_owner: "Membership owner",
  other: "Other",
};

export const PRIMARY_AUDIENCES = [
  "beginners",
  "professionals",
  "business_owners",
  "students",
  "mixed",
  "other",
] as const;

export type PrimaryAudience = (typeof PRIMARY_AUDIENCES)[number];

export const PRIMARY_AUDIENCE_LABELS: Record<PrimaryAudience, string> = {
  beginners: "Beginners",
  professionals: "Professionals",
  business_owners: "Business owners",
  students: "Students",
  mixed: "Mixed audience",
  other: "Other",
};

export const PRIMARY_OFFERINGS = [
  "online_course",
  "coaching_program",
  "mentorship",
  "community",
  "membership",
  "hybrid",
  "other",
] as const;

export type PrimaryOffering = (typeof PRIMARY_OFFERINGS)[number];

export const PRIMARY_OFFERING_LABELS: Record<PrimaryOffering, string> = {
  online_course: "Online course",
  coaching_program: "Coaching program",
  mentorship: "Mentorship",
  community: "Community",
  membership: "Membership",
  hybrid: "Hybrid",
  other: "Other",
};

export const PRIMARY_GOALS = [
  "organize_leads",
  "convert_more",
  "track_customers",
  "save_time",
  "other",
] as const;

export type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

export const PRIMARY_GOAL_LABELS: Record<PrimaryGoal, string> = {
  organize_leads: "Organize leads and follow-ups",
  convert_more: "Convert more prospects to customers",
  track_customers: "Track customers after sale",
  save_time: "Save time on admin",
  other: "Other",
};

export const TEAM_SIZE_BANDS = ["solo", "2_5", "6_20", "21_plus"] as const;

export type TeamSizeBand = (typeof TEAM_SIZE_BANDS)[number];

export const TEAM_SIZE_BAND_LABELS: Record<TeamSizeBand, string> = {
  solo: "Just me",
  "2_5": "2–5",
  "6_20": "6–20",
  "21_plus": "21+",
};

export const ONBOARDING_REQUIRED_FIELD_KEYS = [
  "displayName",
  "organizationName",
  "businessType",
  "primaryAudience",
  "primaryOffering",
  "primaryGoal",
] as const;

export type OnboardingRequiredFieldKey =
  (typeof ONBOARDING_REQUIRED_FIELD_KEYS)[number];
