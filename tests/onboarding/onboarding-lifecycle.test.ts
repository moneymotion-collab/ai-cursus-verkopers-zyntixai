import { describe, expect, it } from "vitest";
import {
  resolveOnboardingLifecycle,
  resolveOnboardingLifecycleDestination,
} from "@/features/onboarding/domain/onboarding-lifecycle";

const CORE = {
  displayName: "Ada",
  organizationName: "Analytical Engines",
  teamSizeBand: "2_5",
};
const CONFIGURED = {
  kind: "configured" as const,
  packKey: "foundation.service",
};

function resolve(
  overrides: Partial<Parameters<typeof resolveOnboardingLifecycle>[0]> = {},
) {
  return resolveOnboardingLifecycle({
    flowVersion: 2,
    setupReadyAt: null,
    completedAt: null,
    membershipRole: "owner",
    coreData: CORE,
    context: CONFIGURED,
    ...overrides,
  });
}

describe("onboarding lifecycle resolver", () => {
  it("grandfathers NULL versions without recapturing them", () => {
    const state = resolve({
      flowVersion: null,
      coreData: undefined,
      context: { kind: "not_required" },
    });
    expect(state).toEqual({ kind: "grandfathered", logicalStage: "completed" });
    expect(resolveOnboardingLifecycleDestination(state, "owner")).toEqual({
      logicalStage: "completed",
      availableRoute: "home",
      productAccessAllowed: true,
    });
  });

  it("keeps V1 incomplete and completed in the isolated legacy state", () => {
    expect(
      resolve({
        flowVersion: 1,
        completedAt: null,
        coreData: undefined,
        context: { kind: "not_required" },
      }),
    ).toEqual({ kind: "legacy", logicalStage: "legacy", completed: false });
    expect(
      resolve({
        flowVersion: 1,
        completedAt: "2026-09-07T12:00:00.000Z",
        coreData: undefined,
        context: { kind: "not_required" },
      }),
    ).toEqual({ kind: "legacy", logicalStage: "legacy", completed: true });
  });

  it("reports every missing V2 universal core field", () => {
    expect(
      resolve({
        coreData: {
          displayName: " ",
          organizationName: "",
          teamSizeBand: "invalid",
        },
      }),
    ).toEqual({
      kind: "v2_core_incomplete",
      logicalStage: "you_and_company",
      missingCoreFields: ["displayName", "organizationName", "teamSizeBand"],
    });
  });

  it("distinguishes core complete/context missing from configured", () => {
    expect(resolve({ context: { kind: "not_configured" } })).toEqual({
      kind: "v2_context_required",
      logicalStage: "operating_model",
    });
    expect(resolve()).toEqual({
      kind: "v2_configured",
      logicalStage: "workspace",
      packKey: "foundation.service",
      setupReadyEligible: true,
    });
  });

  it("resolves persisted Ready and Completed from server timestamps", () => {
    expect(
      resolve({ setupReadyAt: "2026-09-07T12:00:00.000Z" }),
    ).toEqual({
      kind: "v2_ready",
      logicalStage: "ready",
      setupReadyAt: "2026-09-07T12:00:00.000Z",
    });
    expect(
      resolve({
        setupReadyAt: "2026-09-07T12:00:00.000Z",
        completedAt: "2026-09-07T12:01:00.000Z",
      }),
    ).toEqual({
      kind: "v2_completed",
      logicalStage: "completed",
      setupReadyAt: "2026-09-07T12:00:00.000Z",
      completedAt: "2026-09-07T12:01:00.000Z",
    });
  });

  it("fails closed for unsupported and impossible state", () => {
    expect(
      resolve({
        context: { kind: "configured", packKey: "internal.unsupported" },
      }),
    ).toMatchObject({ kind: "invalid", reason: "unsupported_context" });
    expect(
      resolve({
        setupReadyAt: null,
        completedAt: "2026-09-07T12:01:00.000Z",
      }),
    ).toMatchObject({ kind: "invalid", reason: "impossible_timestamps" });
    expect(resolve({ flowVersion: 9 })).toMatchObject({
      kind: "invalid",
      reason: "invalid_flow_version",
    });
  });

  it("requires an owner for an incomplete V2 flow", () => {
    expect(resolve({ membershipRole: "staff" })).toEqual({
      kind: "v2_owner_required",
      logicalStage: "owner_required",
    });
  });

  it("is independent from all four legacy questionnaire fields", () => {
    const input = {
      ...CORE,
      businessType: null,
      primaryAudience: null,
      primaryOffering: null,
      primaryGoal: null,
    };
    expect(
      resolve({
        coreData: {
          displayName: input.displayName,
          organizationName: input.organizationName,
          teamSizeBand: input.teamSizeBand,
        },
      }),
    ).toMatchObject({
      kind: "v2_configured",
      setupReadyEligible: true,
    });
  });
});
