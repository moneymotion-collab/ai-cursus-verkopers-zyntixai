import { describe, expect, it } from "vitest";
import {
  isProductAdmissionAllowed,
  resolveOnboardingLifecycle,
  resolveOnboardingLifecycleDestination,
  type OnboardingLifecycleState,
} from "@/features/onboarding/domain/onboarding-lifecycle";
import {
  buildOnboardingStagePath,
  CREATING_ONBOARDING_PATH,
  READY_ONBOARDING_PATH,
} from "@/features/onboarding/domain/onboarding-routes";
import {
  canOfferExplicitCompletion,
  canOfferExplicitProductEntry,
  isCoherentCompletedReadySnapshot,
  shouldEnterReadySurface,
} from "@/features/onboarding/domain/onboarding-ready";
import { buildProductDestination } from "@/features/onboarding/domain/onboarding-steps";

const ORG = "11111111-1111-4111-8111-111111111111";
const COMPLETED_AT = "2026-09-11T12:10:00.000Z";
const SETUP_READY_AT = "2026-09-11T11:00:00.000Z";

const CORE = {
  displayName: "Ada",
  organizationName: "Analytical Engines",
  teamSizeBand: "2_5",
};
const CONFIGURED = {
  kind: "configured" as const,
  packKey: "foundation.service",
};

function lifecycle(
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

function destinationOf(state: OnboardingLifecycleState, role = "owner") {
  return resolveOnboardingLifecycleDestination(state, role);
}

describe("P1-D product-admission routing", () => {
  it("denies product admission for every incomplete V2 state", () => {
    const incomplete = [
      lifecycle({
        coreData: {
          displayName: " ",
          organizationName: "",
          teamSizeBand: "invalid",
        },
      }),
      lifecycle({ context: { kind: "not_configured" } }),
      lifecycle(),
      lifecycle({ setupReadyAt: SETUP_READY_AT }),
      lifecycle({ membershipRole: "staff" }),
    ];

    for (const state of incomplete) {
      expect(isProductAdmissionAllowed(state, "owner")).toBe(false);
      expect(destinationOf(state).productAccessAllowed).toBe(false);
      expect(destinationOf(state).stageRoute).not.toBe("home");
    }
  });

  it("admits only completed V2 members and contracted compatibility states", () => {
    const completed = lifecycle({
      setupReadyAt: SETUP_READY_AT,
      completedAt: COMPLETED_AT,
    });
    expect(isProductAdmissionAllowed(completed, "owner")).toBe(true);
    expect(isProductAdmissionAllowed(completed, "staff")).toBe(true);
    expect(destinationOf(completed, "staff").stageRoute).toBe("home");

    const grandfathered = lifecycle({
      flowVersion: null,
      coreData: undefined,
      context: { kind: "not_required" },
    });
    expect(isProductAdmissionAllowed(grandfathered, "owner")).toBe(true);

    const legacyComplete = lifecycle({
      flowVersion: 1,
      completedAt: COMPLETED_AT,
      coreData: undefined,
      context: { kind: "not_required" },
    });
    expect(isProductAdmissionAllowed(legacyComplete, "owner")).toBe(true);
  });

  it("never maps a product destination back into an onboarding stage", () => {
    const completed = lifecycle({
      setupReadyAt: SETUP_READY_AT,
      completedAt: COMPLETED_AT,
    });
    const path = buildOnboardingStagePath(
      destinationOf(completed).stageRoute,
      ORG,
    );
    expect(path).toBe(buildProductDestination(ORG));
    expect(path).not.toContain("/onboarding");
  });

  it("does not create a Creating/Ready redirect loop for completed runs", () => {
    expect(shouldEnterReadySurface("completed")).toBe(false);
    expect(shouldEnterReadySurface("ready_for_cutover")).toBe(true);
    expect(shouldEnterReadySurface("invite_partial")).toBe(false);
    expect(shouldEnterReadySurface("inviting")).toBe(false);
    expect(shouldEnterReadySurface("setup_ready")).toBe(false);
    expect(CREATING_ONBOARDING_PATH).not.toBe(READY_ONBOARDING_PATH);
  });

  it("keeps foreign query-string organization out of stage path authority", () => {
    const foreign = "33333333-3333-4333-8333-333333333333";
    const path = buildOnboardingStagePath("home", ORG);
    expect(path).toContain(ORG);
    expect(path).not.toContain(foreign);
  });

  it("offers product entry only for a coherent completed Ready snapshot", () => {
    const coherent = {
      organizationId: ORG,
      workspaceName: "Northwind",
      operatingModelLabel: "Agency & Business Services",
      runStatus: "completed" as const,
      readyForCutoverAt: SETUP_READY_AT,
      runCompletedAt: COMPLETED_AT,
      organizationCompletedAt: COMPLETED_AT,
      results: [],
    };
    expect(isCoherentCompletedReadySnapshot(coherent)).toBe(true);
    expect(canOfferExplicitProductEntry(coherent)).toBe(true);
    expect(
      canOfferExplicitCompletion({
        runStatus: coherent.runStatus,
        organizationCompletedAt: coherent.organizationCompletedAt,
        results: coherent.results,
      }),
    ).toBe(false);
  });

  it("fails closed for mismatched or partial completion snapshots", () => {
    const mismatched = {
      organizationId: ORG,
      workspaceName: "Northwind",
      operatingModelLabel: "Agency & Business Services",
      runStatus: "completed" as const,
      readyForCutoverAt: SETUP_READY_AT,
      runCompletedAt: "2026-09-11T12:11:00.000Z",
      organizationCompletedAt: COMPLETED_AT,
      results: [],
    };
    expect(isCoherentCompletedReadySnapshot(mismatched)).toBe(false);
    expect(canOfferExplicitProductEntry(mismatched)).toBe(false);

    const runOnly = {
      ...mismatched,
      runCompletedAt: COMPLETED_AT,
      organizationCompletedAt: null,
      runStatus: "completed" as const,
    };
    expect(canOfferExplicitProductEntry(runOnly)).toBe(false);
    expect(
      canOfferExplicitCompletion({
        runStatus: "completed",
        organizationCompletedAt: null,
        results: [],
      }),
    ).toBe(false);
  });
});
