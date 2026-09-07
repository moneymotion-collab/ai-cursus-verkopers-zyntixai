import { beforeEach, describe, expect, it, vi } from "vitest";

const ORG = "11111111-1111-4111-8111-111111111111";
const revalidatePathMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const markReadyMock = vi.hoisted(() => vi.fn());
const completeMock = vi.hoisted(() => vi.fn());

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));
vi.mock("@/features/onboarding/server/transition-v2-onboarding", () => ({
  markV2OnboardingSetupReady: markReadyMock,
  completeV2Onboarding: completeMock,
}));

import {
  completeV2OnboardingAction,
  markV2OnboardingSetupReadyAction,
} from "@/features/onboarding/actions/onboarding-actions";

describe("V2 onboarding server actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createServerClientMock.mockResolvedValue({ kind: "session-client" });
  });

  it("delegates Setup Ready to the governed wrapper without broad revalidation", async () => {
    markReadyMock.mockResolvedValue({
      ok: true,
      organizationId: ORG,
      idempotent: false,
      recovered: false,
      state: {
        kind: "v2_ready",
        logicalStage: "ready",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
      },
    });

    await expect(
      markV2OnboardingSetupReadyAction({ organizationId: ORG }),
    ).resolves.toMatchObject({ ok: true });
    expect(markReadyMock).toHaveBeenCalledWith(
      { kind: "session-client" },
      ORG,
    );
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("revalidates only Home after authoritative V2 completion", async () => {
    completeMock.mockResolvedValue({
      ok: true,
      organizationId: ORG,
      idempotent: false,
      recovered: false,
      state: {
        kind: "v2_completed",
        logicalStage: "completed",
        setupReadyAt: "2026-09-07T12:00:00.000Z",
        completedAt: "2026-09-07T12:01:00.000Z",
      },
    });

    await expect(
      completeV2OnboardingAction({ organizationId: ORG }),
    ).resolves.toMatchObject({ ok: true });
    expect(completeMock).toHaveBeenCalledWith(
      { kind: "session-client" },
      ORG,
    );
    expect(revalidatePathMock).toHaveBeenCalledTimes(1);
    expect(revalidatePathMock).toHaveBeenCalledWith("/home");
  });

  it("does not revalidate when completion is rejected", async () => {
    completeMock.mockResolvedValue({
      ok: false,
      code: "invalid_state",
      message: "This setup cannot make that transition yet.",
    });

    await expect(
      completeV2OnboardingAction({ organizationId: ORG }),
    ).resolves.toMatchObject({ ok: false, code: "invalid_state" });
    expect(revalidatePathMock).not.toHaveBeenCalled();
  });

  it("rejects malformed action input before creating a server client", async () => {
    await expect(
      completeV2OnboardingAction({ organizationId: "not-an-id" }),
    ).resolves.toMatchObject({ ok: false, code: "invalid_state" });
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(completeMock).not.toHaveBeenCalled();
  });
});
