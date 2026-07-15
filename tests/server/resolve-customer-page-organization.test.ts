import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import {
  getCustomerById,
} from "@/features/customers/server/customer-read-queries";
import {
  createCustomerReadMockSupabase,
  CUSTOMER_ID,
  ORG_ID,
  sampleCustomerDetailRow,
  USER_ID,
} from "../helpers/customer-read-query-mocks";

const ORG_B = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function createOrgResolverSupabase(options: {
  user?: { id: string } | null;
  memberships?: Array<{ organizationId: string; role: "owner" | "admin" | "staff" | "viewer" }>;
  orgNames?: Record<string, string>;
  timezone?: string | null;
}) {
  const membershipRows = (options.memberships ?? []).map((membership, index) => ({
    id: `33333333-3333-4333-8333-333333333${index}`,
    organization_id: membership.organizationId,
    role: membership.role,
    status: "active",
    user_id: options.user?.id ?? USER_ID,
  }));

  const activeMembershipQuery = vi.fn().mockResolvedValue({
    data: membershipRows,
    error: null,
  });
  const userEq = vi.fn().mockReturnValue({ eq: activeMembershipQuery });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: null,
      }),
    },
    from: vi.fn((table: string) => {
      if (table === "organization_members") {
        return {
          select: vi.fn().mockReturnValue({ eq: userEq }),
        };
      }

      if (table === "organizations") {
        return {
          select: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue({
              data: Object.entries(options.orgNames ?? {}).map(([id, name]) => ({ id, name })),
              error: null,
            }),
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { timezone: options.timezone ?? "UTC" },
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    }),
  } as unknown as SupabaseClient<Database>;
}

describe("resolveCustomerPageOrganization", () => {
  it("returns auth_required when unauthenticated", async () => {
    const result = await resolveCustomerPageOrganization(
      createOrgResolverSupabase({ user: null }),
      undefined,
    );
    expect(result.kind).toBe("auth_required");
  });

  it("returns organization_unavailable with zero memberships", async () => {
    const result = await resolveCustomerPageOrganization(
      createOrgResolverSupabase({ user: { id: USER_ID }, memberships: [] }),
      undefined,
    );
    expect(result.kind).toBe("organization_unavailable");
  });

  it("auto-selects a single organization", async () => {
    const result = await resolveCustomerPageOrganization(
      createOrgResolverSupabase({
        user: { id: USER_ID },
        memberships: [{ organizationId: ORG_ID, role: "staff" }],
        orgNames: { [ORG_ID]: "Org Alpha" },
      }),
      undefined,
    );

    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.organizationId).toBe(ORG_ID);
      expect(result.organizationName).toBe("Org Alpha");
      expect(result.isMultiOrganization).toBe(false);
    }
  });

  it("requires organization selection for multiple memberships", async () => {
    const result = await resolveCustomerPageOrganization(
      createOrgResolverSupabase({
        user: { id: USER_ID },
        memberships: [
          { organizationId: ORG_ID, role: "staff" },
          { organizationId: ORG_B, role: "owner" },
        ],
        orgNames: { [ORG_ID]: "Org Alpha", [ORG_B]: "Org Beta" },
      }),
      undefined,
    );

    expect(result.kind).toBe("organization_required");
  });

  it("accepts valid org selection for multiple memberships", async () => {
    const result = await resolveCustomerPageOrganization(
      createOrgResolverSupabase({
        user: { id: USER_ID },
        memberships: [
          { organizationId: ORG_ID, role: "staff" },
          { organizationId: ORG_B, role: "owner" },
        ],
        orgNames: { [ORG_ID]: "Org Alpha", [ORG_B]: "Org Beta" },
      }),
      ORG_B,
    );

    expect(result.kind).toBe("ready");
    if (result.kind === "ready") {
      expect(result.organizationId).toBe(ORG_B);
      expect(result.isMultiOrganization).toBe(true);
    }
  });
});

describe("customer read query suppression", () => {
  it("does not query customers during organization resolution", async () => {
    const supabase = createOrgResolverSupabase({
      user: { id: USER_ID },
      memberships: [
        { organizationId: ORG_ID, role: "staff" },
        { organizationId: ORG_B, role: "owner" },
      ],
      orgNames: { [ORG_ID]: "Org Alpha", [ORG_B]: "Org Beta" },
    });
    const fromSpy = vi.spyOn(supabase, "from");

    const orgResult = await resolveCustomerPageOrganization(supabase, undefined);
    expect(orgResult.kind).toBe("organization_required");
    expect(fromSpy.mock.calls.some(([table]) => table === "customers")).toBe(false);
  });
});

describe("getCustomerById unavailable equivalence", () => {
  it("maps missing customers to CUSTOMER_UNAVAILABLE", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customerDetail: { data: null, error: null },
    });

    const result = await getCustomerById({
      supabase,
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("CUSTOMER_UNAVAILABLE");
    }
  });

  it("returns mapped detail for accessible customers", async () => {
    const supabase = createCustomerReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      customerDetail: { data: sampleCustomerDetailRow, error: null },
    });

    const result = await getCustomerById({
      supabase,
      organizationId: ORG_ID,
      customerId: CUSTOMER_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.displayName).toBe("Acme Corp");
      expect(result.data.ownerLabel).toBe("Taylor Owner");
    }
  });
});
