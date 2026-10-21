import { describe, expect, it } from "vitest";
import {
  DEFAULT_LEAD_SOURCE_TYPE,
  LEAD_SOURCE_TYPE_OPTIONS,
  buildLeadSourceTypeSelectOptions,
  isCanonicalLeadSourceType,
} from "@/features/leads/ui/lead-source-type-options";

describe("lead-source-type-options", () => {
  it("exposes the shared canonical option contract", () => {
    expect(DEFAULT_LEAD_SOURCE_TYPE).toBe("manual");
    expect(LEAD_SOURCE_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      "manual",
      "instagram",
      "facebook",
      "linkedin",
      "website",
      "advertisement",
      "referral",
      "event",
      "email",
      "other",
    ]);
    expect(LEAD_SOURCE_TYPE_OPTIONS.map((option) => option.label)).toEqual([
      "Manual entry",
      "Instagram",
      "Facebook",
      "LinkedIn",
      "Website",
      "Advertisement",
      "Referral",
      "Event",
      "Email",
      "Other",
    ]);
  });

  it("returns only canonical options for known or empty source types", () => {
    expect(buildLeadSourceTypeSelectOptions("manual")).toEqual(LEAD_SOURCE_TYPE_OPTIONS);
    expect(buildLeadSourceTypeSelectOptions("instagram")).toEqual(LEAD_SOURCE_TYPE_OPTIONS);
    expect(buildLeadSourceTypeSelectOptions("")).toEqual(LEAD_SOURCE_TYPE_OPTIONS);
    expect(buildLeadSourceTypeSelectOptions(null)).toEqual(LEAD_SOURCE_TYPE_OPTIONS);
    expect(isCanonicalLeadSourceType("linkedin")).toBe(true);
  });

  it("prepends legacy historical values so edit can preserve them without data loss", () => {
    const options = buildLeadSourceTypeSelectOptions("  Cold Call Desk  ");

    expect(isCanonicalLeadSourceType("Cold Call Desk")).toBe(false);
    expect(options[0]).toEqual({ value: "Cold Call Desk", label: "Cold Call Desk" });
    expect(options.slice(1)).toEqual([...LEAD_SOURCE_TYPE_OPTIONS]);
  });
});
