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

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

function fakeSupabase(completedAt: string | null = "2026-07-01T00:00:00.000Z") {
  return {
    from() {
      return {
        select() {
          return {
            eq() {
              return {
                maybeSingle: async () => ({
                  data: { onboarding_completed_at: completedAt },
                  error: null,
                }),
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient<Database>;
}

describe("resolveAuthenticatedLanding", () => {
  beforeEach(() => {
    listMembershipsMock.mockReset();
  });

  it("lands single completed-organization owners on organization-scoped leads", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase())).resolves.toBe(
      `/leads?org=${ORG_A}`,
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

  it("lands multi-organization users on /leads for selection", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_A, role: "owner" },
        { organizationId: ORG_B, role: "staff" },
      ],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase())).resolves.toBe("/leads");
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
});

describe("resolvePostLoginDestination", () => {
  beforeEach(() => {
    listMembershipsMock.mockReset();
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
      `/leads?org=${ORG_A}`,
    );
    await expect(resolvePostLoginDestination(fakeSupabase(), undefined)).resolves.toBe(
      `/leads?org=${ORG_A}`,
    );
  });

  it("falls back to organization landing for rejected open redirects", async () => {
    await expect(
      resolvePostLoginDestination(fakeSupabase(), "https://evil.example"),
    ).resolves.toBe(`/leads?org=${ORG_A}`);
  });

  it("allows an onboarding return path", async () => {
    await expect(
      resolvePostLoginDestination(fakeSupabase(null), `/onboarding?org=${ORG_A}`),
    ).resolves.toBe(`/onboarding?org=${ORG_A}`);
  });
});
