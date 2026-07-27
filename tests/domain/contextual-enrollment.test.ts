import { describe, expect, it } from "vitest";
import {
  isCustomerEligibleForEnrollmentCreate,
  isProgramEligibleForEnrollmentCreate,
} from "@/features/enrollments/domain/contextual-enrollment";

describe("isCustomerEligibleForEnrollmentCreate", () => {
  it("is eligible for onboarding and active customers that are not archived", () => {
    expect(
      isCustomerEligibleForEnrollmentCreate({
        status: "onboarding",
        derived: { isArchived: false },
      }),
    ).toBe(true);
    expect(
      isCustomerEligibleForEnrollmentCreate({
        status: "active",
        derived: { isArchived: false },
      }),
    ).toBe(true);
  });

  it("is not eligible for paused, completed, cancelled, or churned customers", () => {
    for (const status of ["paused", "completed", "cancelled", "churned"]) {
      expect(
        isCustomerEligibleForEnrollmentCreate({ status, derived: { isArchived: false } }),
      ).toBe(false);
    }
  });

  it("is never eligible when the customer is archived, regardless of status", () => {
    expect(
      isCustomerEligibleForEnrollmentCreate({ status: "active", derived: { isArchived: true } }),
    ).toBe(false);
    expect(
      isCustomerEligibleForEnrollmentCreate({
        status: "onboarding",
        derived: { isArchived: true },
      }),
    ).toBe(false);
  });
});

describe("isProgramEligibleForEnrollmentCreate", () => {
  it("is eligible only for active, non-archived programs", () => {
    expect(
      isProgramEligibleForEnrollmentCreate({ status: "active", derived: { isArchived: false } }),
    ).toBe(true);
  });

  it("is not eligible for draft, paused, or retired programs", () => {
    for (const status of ["draft", "paused", "retired"]) {
      expect(
        isProgramEligibleForEnrollmentCreate({ status, derived: { isArchived: false } }),
      ).toBe(false);
    }
  });

  it("is never eligible when the program is archived, even if active", () => {
    expect(
      isProgramEligibleForEnrollmentCreate({ status: "active", derived: { isArchived: true } }),
    ).toBe(false);
  });
});
