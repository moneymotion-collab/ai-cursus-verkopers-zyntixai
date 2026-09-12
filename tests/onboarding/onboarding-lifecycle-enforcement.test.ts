import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "11111111-1111-4111-8111-111111111111";
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

function client(completedAt: string | null = null) {
  return {
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.maybeSingle = vi.fn(async () => ({
        data: { onboarding_completed_at: completedAt },
        error: null,
      }));
      return chain;
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

describe("lifecycle-aware product onboarding enforcement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    operatingModelMock.mockResolvedValue({
      kind: "configured",
      organizationId: ORG,
      role: "owner",
      packKey: "foundation.knowledge",
    });
  });

  it("allows V2 Completed and never evaluates legacy questionnaire state", async () => {
    lifecycle({
      kind: "v2_completed",
      logicalStage: "completed",
      setupReadyAt: "2026-09-07T12:00:00.000Z",
      completedAt: "2026-09-07T12:01:00.000Z",
    });
    const supabase = client();
    await redirectIfOrganizationOnboardingIncomplete(
      supabase as never,
      ORG,
      "owner",
    );
    expect(operatingModelMock).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it.each([
    ["v2_core_incomplete", "you_and_company", `/onboarding?org=${ORG}`],
    ["v2_configured", "workspace", `/onboarding/workspace-confirmation?org=${ORG}`],
    ["v2_ready", "ready", `/onboarding/creating?org=${ORG}`],
  ])("keeps %s on the current onboarding stage", async (kind, logicalStage, target) => {
    lifecycle({ kind, logicalStage });
    await expect(
      redirectIfOrganizationOnboardingIncomplete(
        client() as never,
        ORG,
        "owner",
      ),
    ).rejects.toThrow(`REDIRECT:${target}`);
  });

  it("routes missing V2 context to the implemented operating-model route", async () => {
    lifecycle({
      kind: "v2_context_required",
      logicalStage: "operating_model",
    });
    await expect(
      redirectIfOrganizationOnboardingIncomplete(
        client() as never,
        ORG,
        "owner",
      ),
    ).rejects.toThrow(
      `REDIRECT:/onboarding/operating-model?org=${ORG}`,
    );
  });

  it("preserves NULL grandfathering while retaining context gating", async () => {
    lifecycle({ kind: "grandfathered", logicalStage: "completed" });
    const supabase = client(null);
    await redirectIfOrganizationOnboardingIncomplete(
      supabase as never,
      ORG,
      "owner",
    );
    expect(operatingModelMock).toHaveBeenCalledTimes(1);
    expect(supabase.from).not.toHaveBeenCalled();
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it("preserves the V1 Course-Seller questionnaire gate", async () => {
    lifecycle({ kind: "legacy", logicalStage: "legacy", completed: false });
    await expect(
      redirectIfOrganizationOnboardingIncomplete(
        client(null) as never,
        ORG,
        "owner",
      ),
    ).rejects.toThrow(`REDIRECT:/onboarding?org=${ORG}`);
  });
});
