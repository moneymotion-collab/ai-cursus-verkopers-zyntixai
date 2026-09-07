import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ORG = "11111111-1111-4111-8111-111111111111";
const FOREIGN_ORG = "22222222-2222-4222-8222-222222222222";
const USER = "33333333-3333-4333-8333-333333333333";
const listMembershipsMock = vi.hoisted(() => vi.fn());
const saveDraftMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));
vi.mock("@/features/onboarding/server/apply-onboarding", () => ({
  saveOnboardingDraft: saveDraftMock,
}));

import { saveV2CoreDraft } from "@/features/onboarding/server/save-v2-core-draft";

function client(flowVersion: number | null) {
  return {
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: { id: USER } },
        error: null,
      })),
    },
    from: vi.fn(() => {
      const chain: Record<string, unknown> = {};
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      chain.maybeSingle = vi.fn(async () => ({
        data: { onboarding_flow_version: flowVersion },
        error: null,
      }));
      return chain;
    }),
  };
}

describe("V2 core draft server authority", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG, role: "owner" }],
    });
    saveDraftMock.mockResolvedValue({
      ok: true,
      context: {
        organizationId: ORG,
        displayName: "Ada",
        organizationName: "Acme",
        teamSizeBand: "solo",
      },
    });
  });

  it("persists one coherent V2 core draft with no legacy fields", async () => {
    const supabase = client(2);
    const result = await saveV2CoreDraft(supabase as never, {
      organizationId: ORG,
      displayName: "Ada",
      organizationName: "Acme",
      teamSizeBand: "solo",
    });

    expect(result.ok).toBe(true);
    expect(saveDraftMock).toHaveBeenCalledWith(supabase, {
      organizationId: ORG,
      displayName: "Ada",
      organizationName: "Acme",
      teamSizeBand: "solo",
    });
    const payload = saveDraftMock.mock.calls[0]![1];
    expect(payload).not.toHaveProperty("businessType");
    expect(payload).not.toHaveProperty("primaryAudience");
    expect(payload).not.toHaveProperty("primaryOffering");
    expect(payload).not.toHaveProperty("primaryGoal");
  });

  it.each([1, null])(
    "does not route flow version %s through the V2 write path",
    async (flowVersion) => {
      const result = await saveV2CoreDraft(client(flowVersion) as never, {
        organizationId: ORG,
        displayName: "Ada",
        organizationName: "Acme",
        teamSizeBand: "solo",
      });
      expect(result).toMatchObject({
        ok: false,
        code: "validation_error",
      });
      expect(saveDraftMock).not.toHaveBeenCalled();
    },
  );

  it("does not trust a foreign client organization ID", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG, role: "owner" }],
    });
    const supabase = client(2);
    const result = await saveV2CoreDraft(supabase as never, {
      organizationId: FOREIGN_ORG,
      displayName: "Ada",
      organizationName: "Acme",
      teamSizeBand: "solo",
    });
    expect(result).toMatchObject({
      ok: false,
      code: "organization_not_found",
    });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(saveDraftMock).not.toHaveBeenCalled();
  });

  it("keeps lifecycle columns and privileged clients outside the core draft path", () => {
    const source = readFileSync(
      join(
        process.cwd(),
        "src/features/onboarding/server/save-v2-core-draft.ts",
      ),
      "utf8",
    );
    expect(source).not.toContain("createSupabaseServiceRoleClient");
    expect(source).not.toMatch(/\.update\s*\(/);
    expect(source).not.toContain("onboarding_setup_ready_at");
    expect(source).not.toContain("onboarding_completed_at");
    expect(source).not.toContain("mark_organization_onboarding_setup_ready");
    expect(source).not.toContain("complete_organization_v2_onboarding");
  });
});
