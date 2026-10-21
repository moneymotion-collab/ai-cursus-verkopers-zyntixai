/**
 * Brand Brain + Campaign foundation contracts (SMM-B1.3).
 * Canonical brand truth excludes ai_inferred provenance.
 */

export const SOCIAL_BRAND_TRUTH_SOURCE_KINDS = [
  "user_entered",
  "imported",
  "system_derived",
  "manually_verified",
] as const;

export type SocialBrandTruthSourceKind =
  (typeof SOCIAL_BRAND_TRUTH_SOURCE_KINDS)[number];

export function isSocialBrandTruthSourceKind(
  value: string,
): value is SocialBrandTruthSourceKind {
  return (SOCIAL_BRAND_TRUTH_SOURCE_KINDS as readonly string[]).includes(value);
}

/** AI inference is never canonical Brand Brain truth. */
export function isCanonicalBrandTruthSourceKind(
  value: string,
): value is SocialBrandTruthSourceKind {
  return isSocialBrandTruthSourceKind(value);
}

export const SOCIAL_BRAND_RULE_KINDS = [
  "communication_principle",
  "prohibited_claim",
  "topic_avoid",
  "required_disclaimer",
  "forbidden_vocabulary",
  "cta_restriction",
  "factual_constraint",
] as const;

export type SocialBrandRuleKind = (typeof SOCIAL_BRAND_RULE_KINDS)[number];

export const SOCIAL_GOAL_KINDS = [
  "awareness",
  "engagement",
  "lead_generation",
  "customer_education",
  "recruitment",
  "retention",
  "product_launch",
  "traffic",
  "sales_support",
  "community_growth",
  "other",
] as const;

export type SocialGoalKind = (typeof SOCIAL_GOAL_KINDS)[number];

export const SOCIAL_CAMPAIGN_STATUSES = [
  "draft",
  "active",
  "completed",
] as const;

export type SocialCampaignStatus = (typeof SOCIAL_CAMPAIGN_STATUSES)[number];

export type SocialBrandVoiceConfig = {
  formality?: "casual" | "neutral" | "formal";
  toneDescriptors?: string[];
  principles?: string[];
  preferredVocabulary?: string[];
  avoidedVocabulary?: string[];
};

export type SocialBrandProfile = {
  brandId: string;
  organizationId: string;
  displayName: string;
  summary: string | null;
  positioning: string | null;
  primaryLanguage: string | null;
  websiteUrl: string | null;
  voiceConfig: SocialBrandVoiceConfig;
  profileSourceKind: SocialBrandTruthSourceKind;
  archivedAt: string | null;
};

export type SocialAudience = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  displayName: string;
  description: string | null;
  needs: string | null;
  desiredOutcome: string | null;
  priority: number;
  sourceKind: SocialBrandTruthSourceKind;
  archivedAt: string | null;
};

export type SocialContentPillar = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  displayName: string;
  description: string | null;
  sortOrder: number;
  sourceKind: SocialBrandTruthSourceKind;
  archivedAt: string | null;
};

export type SocialGoal = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  goalKind: SocialGoalKind;
  displayName: string;
  description: string | null;
  priority: number;
  successCriteria: Record<string, unknown>;
  sourceKind: SocialBrandTruthSourceKind;
  archivedAt: string | null;
};

export type SocialPlatformStrategy = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  plannedProvider: string;
  strategicRole: string | null;
  objective: string | null;
  contentStyle: string | null;
  intendedFrequency: string | null;
  sourceKind: SocialBrandTruthSourceKind;
  archivedAt: string | null;
};

export type SocialCampaign = {
  id: string;
  organizationId: string;
  brandId: string;
  workspaceId: string;
  displayName: string;
  description: string | null;
  goalId: string | null;
  status: SocialCampaignStatus;
  startsAt: string | null;
  endsAt: string | null;
  successCriteria: Record<string, unknown>;
  archivedAt: string | null;
};

/**
 * Offers/products: no Social duplicate catalog in B1.3.
 * Prefer future references to existing CRM/product domains when needed.
 */
export const SOCIAL_OFFERS_B13_DECISION =
  "deferred_no_duplicate_product_catalog" as const;
