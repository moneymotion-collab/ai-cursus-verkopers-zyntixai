import { describe, expect, it } from "vitest";
import {
  CUSTOMER_STATUSES,
  getAllowedCustomerStatusTransitions,
  getCustomerStatusLabel,
  isAllowedCustomerStatusTransition,
  isCustomerStatus,
} from "@/features/customers/domain/status";

describe("customer status domain", () => {
  it("defines all six customer statuses", () => {
    expect(CUSTOMER_STATUSES).toHaveLength(6);
    for (const status of CUSTOMER_STATUSES) {
      expect(isCustomerStatus(status)).toBe(true);
      expect(getCustomerStatusLabel(status)).toBeTruthy();
    }
  });

  it("allows database-authoritative transitions", () => {
    const allowed: Array<[string, string]> = [
      ["onboarding", "active"],
      ["onboarding", "cancelled"],
      ["active", "paused"],
      ["active", "completed"],
      ["active", "cancelled"],
      ["active", "churned"],
      ["paused", "active"],
      ["paused", "completed"],
      ["paused", "cancelled"],
      ["paused", "churned"],
      ["completed", "active"],
      ["completed", "onboarding"],
      ["cancelled", "active"],
      ["cancelled", "onboarding"],
      ["churned", "active"],
      ["churned", "onboarding"],
    ];

    for (const [from, to] of allowed) {
      expect(isAllowedCustomerStatusTransition(from as never, to as never)).toBe(true);
    }
  });

  it("rejects prohibited and same-state transitions", () => {
    expect(isAllowedCustomerStatusTransition("onboarding", "onboarding")).toBe(false);
    expect(isAllowedCustomerStatusTransition("onboarding", "paused")).toBe(false);
    expect(isAllowedCustomerStatusTransition("active", "onboarding")).toBe(false);
    expect(isAllowedCustomerStatusTransition("completed", "cancelled")).toBe(false);
    expect(isAllowedCustomerStatusTransition("churned", "paused")).toBe(false);
  });

  it("exposes allowed transitions per status", () => {
    expect(getAllowedCustomerStatusTransitions("onboarding")).toEqual(["active", "cancelled"]);
    expect(getAllowedCustomerStatusTransitions("completed")).toEqual(["active", "onboarding"]);
  });
});
