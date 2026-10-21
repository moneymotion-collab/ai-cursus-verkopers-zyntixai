import { describe, expect, it } from "vitest";
import {
  eligibleReadinessForRollout,
  isReadinessEligibleForRollout,
} from "@/features/business-qualification/domain/rollout-policy";
import type { ContextReadinessStatus, RolloutMode } from "@/features/business-qualification/domain/types";

const READINESS: readonly ContextReadinessStatus[] = [
  "planned",
  "context_ready",
  "beta_supported",
  "production_verified",
];

describe("BQA-1E readiness policy matrix", () => {
  it("allows context_ready only for internal_qa", () => {
    expect(isReadinessEligibleForRollout("context_ready", "internal_qa")).toBe(true);
    expect(isReadinessEligibleForRollout("context_ready", "closed_beta")).toBe(false);
    expect(isReadinessEligibleForRollout("context_ready", "production")).toBe(false);
    expect(isReadinessEligibleForRollout("planned", "internal_qa")).toBe(false);
  });

  it("requires beta_supported as the Closed Beta customer minimum", () => {
    expect(isReadinessEligibleForRollout("beta_supported", "closed_beta")).toBe(true);
    expect(isReadinessEligibleForRollout("production_verified", "closed_beta")).toBe(true);
    expect(isReadinessEligibleForRollout("context_ready", "closed_beta")).toBe(false);
  });

  it("requires production_verified for production", () => {
    expect(isReadinessEligibleForRollout("production_verified", "production")).toBe(true);
    expect(isReadinessEligibleForRollout("beta_supported", "production")).toBe(false);
    expect(isReadinessEligibleForRollout("context_ready", "production")).toBe(false);
  });

  it("leaves Open Beta without an eligibility set", () => {
    expect(eligibleReadinessForRollout("open_beta")).toBeNull();
    for (const readiness of READINESS) {
      expect(isReadinessEligibleForRollout(readiness, "open_beta")).toBe(false);
    }
  });

  it("covers every readiness × frozen customer rollout combination", () => {
    const expected: Record<Exclude<RolloutMode, "open_beta">, readonly ContextReadinessStatus[]> = {
      internal_qa: ["context_ready", "beta_supported", "production_verified"],
      closed_beta: ["beta_supported", "production_verified"],
      production: ["production_verified"],
    };
    for (const [rollout, allowed] of Object.entries(expected) as [
      Exclude<RolloutMode, "open_beta">,
      readonly ContextReadinessStatus[],
    ][]) {
      expect(eligibleReadinessForRollout(rollout)).toEqual(allowed);
      for (const readiness of READINESS) {
        expect(isReadinessEligibleForRollout(readiness, rollout)).toBe(allowed.includes(readiness));
      }
    }
  });
});
