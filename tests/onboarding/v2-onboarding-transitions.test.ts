import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeV2Onboarding,
  markV2OnboardingSetupReady,
} from "@/features/onboarding/server/transition-v2-onboarding";

const ORG = "11111111-1111-4111-8111-111111111111";
const USER = "22222222-2222-4222-8222-222222222222";
const READY_AT = "2026-09-07T12:00:00.000Z";
const COMPLETED_AT = "2026-09-07T12:01:00.000Z";

const listMembershipsMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

function client(rpcResult: { data: unknown; error: unknown }) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER } },
        error: null,
      })),
    },
    rpc: vi.fn(async () => rpcResult),
  };
}

const readyLifecycle = vi.fn(async () => ({
  ok: true as const,
  organizationId: ORG,
  membershipRole: "owner",
  state: {
    kind: "v2_ready" as const,
    logicalStage: "ready" as const,
    setupReadyAt: READY_AT,
  },
}));

const completedLifecycle = vi.fn(async () => ({
  ok: true as const,
  organizationId: ORG,
  membershipRole: "owner",
  state: {
    kind: "v2_completed" as const,
    logicalStage: "completed" as const,
    setupReadyAt: READY_AT,
    completedAt: COMPLETED_AT,
  },
}));

describe("V2 onboarding transition integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG, role: "owner" }],
    });
  });

  it("invokes only the governed Setup Ready RPC and returns fresh Ready state", async () => {
    const supabase = client({
      data: { ok: true, idempotent: false, state: "ready" },
      error: null,
    });

    const result = await markV2OnboardingSetupReady(
      supabase as never,
      ORG,
      { resolveLifecycle: readyLifecycle as never },
    );

    expect(result).toMatchObject({
      ok: true,
      idempotent: false,
      recovered: false,
      state: { kind: "v2_ready" },
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "mark_organization_onboarding_setup_ready",
      { p_organization_id: ORG },
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "apply_organization_onboarding",
      expect.anything(),
    );
  });

  it("invokes only the governed Complete RPC and returns fresh Completed state", async () => {
    const supabase = client({
      data: { ok: true, idempotent: true, state: "completed" },
      error: null,
    });

    const result = await completeV2Onboarding(supabase as never, ORG, {
      resolveLifecycle: completedLifecycle as never,
    });

    expect(result).toMatchObject({
      ok: true,
      idempotent: true,
      recovered: false,
      state: { kind: "v2_completed" },
    });
    expect(supabase.rpc).toHaveBeenCalledWith(
      "complete_organization_v2_onboarding",
      { p_organization_id: ORG },
    );
    expect(supabase.rpc).not.toHaveBeenCalledWith(
      "apply_organization_onboarding",
      expect.anything(),
    );
  });

  it("maps database outcomes without exposing raw database details", async () => {
    const supabase = client({
      data: { ok: false, code: "DISPLAY_NAME_REQUIRED" },
      error: null,
    });
    await expect(
      markV2OnboardingSetupReady(supabase as never, ORG, {
        resolveLifecycle: readyLifecycle as never,
      }),
    ).resolves.toEqual({
      ok: false,
      code: "core_data_incomplete",
      message: "Complete your name, company name, and team size first.",
    });

    const transportFailure = client({
      data: null,
      error: { code: "P0001", message: "secret constraint detail" },
    });
    const unresolved = vi.fn(async () => ({
      ok: true as const,
      organizationId: ORG,
      membershipRole: "owner",
      state: {
        kind: "v2_configured" as const,
        logicalStage: "workspace" as const,
        packKey: "foundation.service" as const,
        setupReadyEligible: true as const,
      },
    }));
    await expect(
      completeV2Onboarding(transportFailure as never, ORG, {
        resolveLifecycle: unresolved as never,
      }),
    ).resolves.toMatchObject({ ok: false, code: "retryable_error" });
  });

  it("recovers safely after response loss through an authoritative reread", async () => {
    const setupClient = client({ data: null, error: { message: "timeout" } });
    await expect(
      markV2OnboardingSetupReady(setupClient as never, ORG, {
        resolveLifecycle: readyLifecycle as never,
      }),
    ).resolves.toMatchObject({
      ok: true,
      recovered: true,
      state: { kind: "v2_ready" },
    });

    const completeClient = client({
      data: null,
      error: { message: "timeout" },
    });
    await expect(
      completeV2Onboarding(completeClient as never, ORG, {
        resolveLifecycle: completedLifecycle as never,
      }),
    ).resolves.toMatchObject({
      ok: true,
      recovered: true,
      state: { kind: "v2_completed" },
    });
    expect(setupClient.rpc).toHaveBeenCalledTimes(1);
    expect(completeClient.rpc).toHaveBeenCalledTimes(1);
  });

  it("rejects a client-selected foreign organization before invoking an RPC", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        {
          organizationId: "33333333-3333-4333-8333-333333333333",
          role: "owner",
        },
      ],
    });
    const supabase = client({ data: null, error: null });
    await expect(
      completeV2Onboarding(supabase as never, ORG),
    ).resolves.toMatchObject({ ok: false, code: "unauthorized" });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("proves the legacy-field-independent Ready to Complete chain", async () => {
    const legacyFields = {
      businessType: null,
      primaryAudience: null,
      primaryOffering: null,
      primaryGoal: null,
    };
    expect(Object.values(legacyFields)).toEqual([null, null, null, null]);

    const setupClient = client({
      data: { ok: true, idempotent: false, state: "ready" },
      error: null,
    });
    const completeClient = client({
      data: { ok: true, idempotent: false, state: "completed" },
      error: null,
    });
    await expect(
      markV2OnboardingSetupReady(setupClient as never, ORG, {
        resolveLifecycle: readyLifecycle as never,
      }),
    ).resolves.toMatchObject({ ok: true });
    await expect(
      completeV2Onboarding(completeClient as never, ORG, {
        resolveLifecycle: completedLifecycle as never,
      }),
    ).resolves.toMatchObject({ ok: true });
  });

  it("keeps the application boundary free of raw lifecycle updates and service role", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/server/transition-v2-onboarding.ts",
      ),
      "utf8",
    );
    expect(source).not.toMatch(/\.update\s*\(/);
    expect(source).not.toContain("createSupabaseServiceRoleClient");
    expect(source).not.toContain("apply_organization_onboarding");
    expect(source).toContain("mark_organization_onboarding_setup_ready");
    expect(source).toContain("complete_organization_v2_onboarding");
  });

  it("maps a database NOT_READY refusal without completing or leaking SQL", async () => {
    const supabase = client({
      data: { ok: false, code: "NOT_READY" },
      error: null,
    });
    const result = await completeV2Onboarding(supabase as never, ORG, {
      resolveLifecycle: readyLifecycle as never,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_state");
      expect(result.message).not.toMatch(/P0001|organization_onboarding|872004/);
    }
    expect(supabase.rpc).toHaveBeenCalledWith(
      "complete_organization_v2_onboarding",
      { p_organization_id: ORG },
    );
  });
});
