import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveOrganizationOnboardingLifecycle } from "@/features/onboarding/server/resolve-onboarding-lifecycle";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";
const listMembershipsMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

type OrgRow = {
  id: string;
  name: string;
  team_size_band: string | null;
  onboarding_flow_version: number | null;
  onboarding_setup_ready_at: string | null;
  onboarding_completed_at: string | null;
};

function client(organizations: Record<string, OrgRow>, displayName = "Ada") {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER } },
        error: null,
      })),
    },
    from: vi.fn((table: string) => {
      let selectedId: string | undefined;
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn((_column: string, value: string) => {
        selectedId = value;
        return chain;
      });
      chain.maybeSingle = vi.fn(async () =>
        table === "organizations"
          ? { data: organizations[selectedId ?? ""] ?? null, error: null }
          : { data: { display_name: displayName }, error: null },
      );
      return chain;
    }),
  };
}

function row(
  id: string,
  overrides: Partial<OrgRow> = {},
): OrgRow {
  return {
    id,
    name: "Analytical Engines",
    team_size_band: "2_5",
    onboarding_flow_version: 2,
    onboarding_setup_ready_at: null,
    onboarding_completed_at: null,
    ...overrides,
  };
}

describe("server onboarding lifecycle authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("derives configured V2 eligibility from live core and context authorities", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    const resolveOperatingModelStatus = vi.fn(async () => ({
      kind: "configured" as const,
      organizationId: ORG_A,
      role: "owner",
      packKey: "foundation.service",
    }));

    const result = await resolveOrganizationOnboardingLifecycle(
      client({ [ORG_A]: row(ORG_A) }) as never,
      ORG_A,
      { resolveOperatingModelStatus: resolveOperatingModelStatus as never },
    );

    expect(result).toMatchObject({
      ok: true,
      organizationId: ORG_A,
      state: {
        kind: "v2_configured",
        setupReadyEligible: true,
        packKey: "foundation.service",
      },
    });
    expect(resolveOperatingModelStatus).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: ORG_A, role: "owner" }),
    );
  });

  it("does not resolve context until universal V2 core data is complete", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    const resolveOperatingModelStatus = vi.fn();
    const result = await resolveOrganizationOnboardingLifecycle(
      client(
        {
          [ORG_A]: row(ORG_A, {
            name: " ",
            team_size_band: null,
          }),
        },
        "",
      ) as never,
      ORG_A,
      { resolveOperatingModelStatus: resolveOperatingModelStatus as never },
    );

    expect(result).toMatchObject({
      ok: true,
      state: {
        kind: "v2_core_incomplete",
        missingCoreFields: [
          "displayName",
          "organizationName",
          "teamSizeBand",
        ],
      },
    });
    expect(resolveOperatingModelStatus).not.toHaveBeenCalled();
  });

  it("uses the selected organization rather than a user-global lifecycle flag", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_A, role: "owner" },
        { organizationId: ORG_B, role: "owner" },
      ],
    });
    const supabase = client({
      [ORG_A]: row(ORG_A, {
        onboarding_flow_version: 1,
        onboarding_completed_at: "2026-09-07T11:00:00.000Z",
      }),
      [ORG_B]: row(ORG_B, {
        onboarding_setup_ready_at: "2026-09-07T12:00:00.000Z",
      }),
    });

    await expect(
      resolveOrganizationOnboardingLifecycle(
        supabase as never,
        ORG_A,
      ),
    ).resolves.toMatchObject({
      ok: true,
      organizationId: ORG_A,
      state: { kind: "legacy", completed: true },
    });
    await expect(
      resolveOrganizationOnboardingLifecycle(
        supabase as never,
        ORG_B,
      ),
    ).resolves.toMatchObject({
      ok: true,
      organizationId: ORG_B,
      state: { kind: "v2_ready" },
    });
  });

  it("keeps a NULL organization grandfathered regardless of missing legacy data", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    await expect(
      resolveOrganizationOnboardingLifecycle(
        client({
          [ORG_A]: row(ORG_A, {
            onboarding_flow_version: null,
            team_size_band: null,
          }),
        }) as never,
        ORG_A,
      ),
    ).resolves.toMatchObject({
      ok: true,
      state: { kind: "grandfathered" },
    });
  });
});
