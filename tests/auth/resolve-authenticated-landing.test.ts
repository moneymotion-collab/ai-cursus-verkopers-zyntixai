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

function fakeSupabase() {
  return {} as SupabaseClient<Database>;
}

describe("resolveAuthenticatedLanding", () => {
  beforeEach(() => {
    listMembershipsMock.mockReset();
  });

  it("lands single-organization users on organization-scoped leads", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase())).resolves.toBe(
      `/leads?org=${ORG_A}`,
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

  it("lands zero-organization users on /leads unavailable flow", async () => {
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [],
    });

    await expect(resolveAuthenticatedLanding(fakeSupabase())).resolves.toBe("/leads");
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

  it("uses sanitized allowlisted destinations", async () => {
    await expect(
      resolvePostLoginDestination(fakeSupabase(), "/tasks?status=open"),
    ).resolves.toBe("/tasks?status=open");
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
});
