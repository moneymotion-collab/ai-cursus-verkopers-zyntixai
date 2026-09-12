import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "11111111-1111-4111-8111-111111111111";
const FOREIGN = "33333333-3333-4333-8333-333333333333";
const redirectMock = vi.hoisted(() =>
  vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
);
const lifecycleMock = vi.hoisted(() => vi.fn());
const operatingModelMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  RedirectType: { push: "push", replace: "replace" },
}));
vi.mock("@/features/onboarding/server/resolve-onboarding-lifecycle", () => ({
  resolveOrganizationOnboardingLifecycle: lifecycleMock,
}));
vi.mock("@/features/onboarding/server/operating-model-status", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/onboarding/server/operating-model-status")
  >("@/features/onboarding/server/operating-model-status");
  return {
    ...actual,
    resolveOperatingModelSetupStatus: operatingModelMock,
  };
});

import { redirectIfOrganizationOnboardingIncomplete } from "@/features/onboarding/server/enforce-product-onboarding";

function client() {
  return {
    from: vi.fn(() => {
      throw new Error("product admission must not read organizations here");
    }),
  };
}

function lifecycle(state: Record<string, unknown>, role = "owner") {
  lifecycleMock.mockResolvedValue({
    ok: true,
    organizationId: ORG,
    membershipRole: role,
    state,
  });
}

describe("P1-D product-admission enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    operatingModelMock.mockResolvedValue({
      kind: "configured",
      organizationId: ORG,
      role: "owner",
      packKey: "foundation.knowledge",
    });
  });

  it("allows a completed organization for Owner and permitted member alike", async () => {
    lifecycle(
      {
        kind: "v2_completed",
        logicalStage: "completed",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
        completedAt: "2026-09-07T12:01:00.000Z",
      },
      "admin",
    );
    await redirectIfOrganizationOnboardingIncomplete(
      client() as never,
      ORG,
      "admin",
    );
    expect(operatingModelMock).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      "v2_owner_required",
      { kind: "v2_owner_required", logicalStage: "owner_required" },
      `/onboarding?org=${ORG}`,
    ],
    [
      "invalid",
      {
        kind: "invalid",
        logicalStage: "blocked",
        reason: "impossible_timestamps",
      },
      `/onboarding?org=${ORG}`,
    ],
    [
      "setup_ready creating",
      { kind: "v2_ready", logicalStage: "ready" },
      `/onboarding/creating?org=${ORG}`,
    ],
  ])("denies %s before any product route", async (_name, state, target) => {
    lifecycle(state);
    await expect(
      redirectIfOrganizationOnboardingIncomplete(
        client() as never,
        ORG,
        "owner",
      ),
    ).rejects.toThrow(`REDIRECT:${target}`);
  });

  it("re-reads lifecycle on every call instead of caching a prior decision", async () => {
    lifecycle({
      kind: "v2_ready",
      logicalStage: "ready",
      setupReadyAt: "2026-09-07T12:00:00.000Z",
    });
    await expect(
      redirectIfOrganizationOnboardingIncomplete(
        client() as never,
        ORG,
        "owner",
      ),
    ).rejects.toThrow(`REDIRECT:/onboarding/creating?org=${ORG}`);

    lifecycle({
      kind: "v2_completed",
      logicalStage: "completed",
      setupReadyAt: "2026-09-07T12:00:00.000Z",
      completedAt: "2026-09-07T12:01:00.000Z",
    });
    await redirectIfOrganizationOnboardingIncomplete(
      client() as never,
      ORG,
      "owner",
    );
    expect(lifecycleMock).toHaveBeenCalledTimes(2);
  });

  it("does not send a non-Owner incomplete member into Creating", async () => {
    lifecycle(
      {
        kind: "v2_ready",
        logicalStage: "ready",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
      },
      "admin",
    );
    await expect(
      redirectIfOrganizationOnboardingIncomplete(
        client() as never,
        ORG,
        "admin",
      ),
    ).rejects.toThrow(`REDIRECT:/onboarding?org=${ORG}`);
  });

  it("does not treat a foreign organization argument as a second authority", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/server/enforce-product-onboarding.ts",
      ),
      "utf8",
    );
    expect(source).toContain("resolveOrganizationOnboardingLifecycle");
    expect(source).toContain("organizationId");
    expect(source).not.toContain("searchParams");
    expect(source).not.toContain("FOREIGN");
    expect(source).not.toContain(FOREIGN);
    expect(source).not.toContain("createServiceRole");
    expect(source).not.toContain("SERVICE_ROLE");
    expect(source).not.toContain("localStorage");
    expect(source).not.toContain("completedFlag");
  });
});
