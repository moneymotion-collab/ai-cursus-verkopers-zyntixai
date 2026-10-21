import { describe, expect, it } from "vitest";
import {
  BUSINESS_TYPES,
  BUSINESS_TYPE_LABELS,
  PRIMARY_AUDIENCES,
  PRIMARY_GOALS,
  PRIMARY_OFFERINGS,
  TEAM_SIZE_BANDS,
} from "@/features/onboarding/domain/onboarding-options";
import {
  parseOnboardingCompleteInput,
  parseOnboardingDraftInput,
} from "@/features/onboarding/domain/onboarding-schema";
import {
  computeMissingRequiredFields,
  isOnboardingComplete,
} from "@/features/onboarding/domain/onboarding-types";

const orgId = "11111111-1111-4111-8111-111111111111";

describe("onboarding option contracts", () => {
  it("keeps machine values lowercase and labels separate", () => {
    for (const value of BUSINESS_TYPES) {
      expect(value).toBe(value.toLowerCase());
      expect(BUSINESS_TYPE_LABELS[value].length).toBeGreaterThan(0);
      expect(BUSINESS_TYPE_LABELS[value]).not.toBe(value);
    }
    expect(PRIMARY_AUDIENCES).toContain("mixed");
    expect(PRIMARY_OFFERINGS).toContain("hybrid");
    expect(PRIMARY_GOALS).toContain("organize_leads");
    expect(TEAM_SIZE_BANDS).toEqual(["solo", "2_5", "6_20", "21_plus"]);
  });
});

describe("onboarding draft schema", () => {
  it("accepts partial draft fields", () => {
    const parsed = parseOnboardingDraftInput({
      organizationId: orgId,
      businessType: "course_seller",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects unknown enum values and unknown keys", () => {
    expect(
      parseOnboardingDraftInput({
        organizationId: orgId,
        businessType: "influencer",
      }).success,
    ).toBe(false);
    expect(
      parseOnboardingDraftInput({
        organizationId: orgId,
        extra: true,
      }).success,
    ).toBe(false);
  });

  it("trims names and rejects control characters / blank company", () => {
    const ok = parseOnboardingDraftInput({
      organizationId: orgId,
      displayName: "  Ada  ",
      organizationName: "  Ada Co  ",
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.displayName).toBe("Ada");
      expect(ok.data.organizationName).toBe("Ada Co");
    }

    expect(
      parseOnboardingDraftInput({
        organizationId: orgId,
        displayName: "Ada\u0000",
      }).success,
    ).toBe(false);
    expect(
      parseOnboardingDraftInput({
        organizationId: orgId,
        organizationName: " ",
      }).success,
    ).toBe(false);
  });

  it("rejects set+clear team size together", () => {
    expect(
      parseOnboardingDraftInput({
        organizationId: orgId,
        teamSizeBand: "solo",
        clearTeamSizeBand: true,
      }).success,
    ).toBe(false);
  });
});

describe("onboarding complete schema", () => {
  const valid = {
    organizationId: orgId,
    displayName: "Ada",
    organizationName: "Ada Academy",
    businessType: "course_seller",
    primaryAudience: "beginners",
    primaryOffering: "online_course",
    primaryGoal: "organize_leads",
  };

  it("requires all completion fields", () => {
    expect(parseOnboardingCompleteInput(valid).success).toBe(true);
    expect(
      parseOnboardingCompleteInput({
        ...valid,
        primaryGoal: undefined,
      }).success,
    ).toBe(false);
  });

  it("allows optional team size", () => {
    expect(
      parseOnboardingCompleteInput({
        ...valid,
        teamSizeBand: "2_5",
      }).success,
    ).toBe(true);
  });
});

describe("completion helpers", () => {
  it("computes missing required fields", () => {
    expect(
      computeMissingRequiredFields({
        displayName: null,
        organizationName: "Org",
        businessType: "course_seller",
        primaryAudience: null,
        primaryOffering: "online_course",
        primaryGoal: "organize_leads",
      }),
    ).toEqual(["displayName", "primaryAudience"]);
  });

  it("treats completion timestamp as authoritative", () => {
    expect(isOnboardingComplete(null)).toBe(false);
    expect(isOnboardingComplete("2026-07-20T12:00:00.000Z")).toBe(true);
  });
});
