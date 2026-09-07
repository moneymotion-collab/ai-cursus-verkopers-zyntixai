import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  resolveAuthenticatedLanding,
  resolvePostLoginDestination,
} from "@/features/auth/server/resolve-authenticated-landing";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

const listMembershipsMock = vi.hoisted(() => vi.fn());
const lifecycleMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));
vi.mock("@/features/onboarding/server/resolve-onboarding-lifecycle", () => ({
  resolveOrganizationOnboardingLifecycle: lifecycleMock,
}));

function fakeSupabase(completedAt: string | null = "2026-07-01T00:00:00.000Z") {
  return {
    lifecycleState: {
      kind: "legacy",
      logicalStage: "legacy",
      completed: Boolean(completedAt),
    },
  } as unknown as SupabaseClient<Database>;
}

function lifecycleClient(state: Record<string, unknown>) {
  return { lifecycleState: state } as unknown as SupabaseClient<Database>;
}

describe("resolveAuthenticatedLanding", () => {
  beforeEach(() => {
    listMembershipsMock.mockReset();
    lifecycleMock.mockReset();
    lifecycleMock.mockImplementation(async (supabase) => ({
      ok: true,
      organizationId: ORG_A,
      membershipRole: "owner",
      state: supabase.lifecycleState,
    }));
  });

  it("lands single completed-organization owners on organization-scoped home", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase())).resolves.toBe(
      `/home?org=${ORG_A}`,
    );
  });

  it("lands single incomplete-organization owners on onboarding", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase(null))).resolves.toBe(
      `/onboarding?org=${ORG_A}`,
    );
  });

  it("lands multi-organization users on /home for selection", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_A, role: "owner" },
        { organizationId: ORG_B, role: "staff" },
      ],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase())).resolves.toBe("/home");
  });

  it("lands zero-organization users on registration recovery", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase())).resolves.toBe(
      "/register/complete",
    );
  });

  it("maps V2 Ready to the existing onboarding route and Completed to Home", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    await expect(
      resolveAuthenticatedLanding(
        lifecycleClient({
          kind: "v2_ready",
          logicalStage: "ready",
          setupReadyAt: "2026-09-07T12:00:00.000Z",
        }),
      ),
    ).resolves.toBe(`/onboarding?org=${ORG_A}`);
    await expect(
      resolveAuthenticatedLanding(
        lifecycleClient({
          kind: "v2_completed",
          logicalStage: "completed",
          setupReadyAt: "2026-09-07T12:00:00.000Z",
          completedAt: "2026-09-07T12:01:00.000Z",
        }),
      ),
    ).resolves.toBe(`/home?org=${ORG_A}`);
  });

  it("keeps NULL organizations grandfathered", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    await expect(
      resolveAuthenticatedLanding(
        lifecycleClient({ kind: "grandfathered", logicalStage: "completed" }),
      ),
    ).resolves.toBe(`/home?org=${ORG_A}`);
  });

  it("maps V2 context continuation to the existing operating-model route", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    await expect(
      resolveAuthenticatedLanding(
        lifecycleClient({
          kind: "v2_context_required",
          logicalStage: "operating_model",
        }),
      ),
    ).resolves.toBe(`/onboarding/operating-model?org=${ORG_A}`);
  });
});

describe("resolvePostLoginDestination", () => {
  beforeEach(() => {
    listMembershipsMock.mockReset();
    lifecycleMock.mockReset();
    lifecycleMock.mockImplementation(async (supabase) => ({
      ok: true,
      organizationId: ORG_A,
      membershipRole: "owner",
      state: supabase.lifecycleState,
    }));
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
  });

  it("uses sanitized allowlisted destinations when onboarding is complete", async () => {
    await expect(
      resolvePostLoginDestination(fakeSupabase(), "/tasks?status=open"),
    ).resolves.toBe("/tasks?status=open");
  });

  it("rewrites incomplete owner product destinations to onboarding", async () => {
    await expect(
      resolvePostLoginDestination(fakeSupabase(null), `/leads?org=${ORG_A}`),
    ).resolves.toBe(`/onboarding?org=${ORG_A}`);
  });

  it("resolves default and root destinations through organization landing", async () => {
    await expect(resolvePostLoginDestination(fakeSupabase(), "/")).resolves.toBe(
      `/home?org=${ORG_A}`,
    );
    await expect(resolvePostLoginDestination(fakeSupabase(), undefined)).resolves.toBe(
      `/home?org=${ORG_A}`,
    );
  });

  it("falls back to organization landing for rejected open redirects", async () => {
    await expect(
      resolvePostLoginDestination(fakeSupabase(), "https://evil.example"),
    ).resolves.toBe(`/home?org=${ORG_A}`);
  });

  it("allows an onboarding return path", async () => {
    await expect(
      resolvePostLoginDestination(fakeSupabase(null), `/onboarding?org=${ORG_A}`),
    ).resolves.toBe(`/onboarding?org=${ORG_A}`);
  });

  it("rewrites direct onboarding access to Home after V2 completion", async () => {
    await expect(
      resolvePostLoginDestination(
        lifecycleClient({
          kind: "v2_completed",
          logicalStage: "completed",
          setupReadyAt: "2026-09-07T12:00:00.000Z",
          completedAt: "2026-09-07T12:01:00.000Z",
        }),
        `/onboarding?org=${ORG_A}`,
      ),
    ).resolves.toBe(`/home?org=${ORG_A}`);
  });
});
