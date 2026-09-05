import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { resolveCustomerPageOrganization } from "@/features/customers/server/resolve-customer-page-organization";
import { resolveLeadPageOrganization } from "@/features/leads/server/resolve-lead-page-organization";
import {
  buildUnresolvedProductModuleAccess,
  FAIL_CLOSED_MODULE_NAV_VISIBILITY,
} from "@/features/product-access/domain/module-access";
import { DEFAULT_PRODUCT_TERMINOLOGY } from "@/features/product-access/domain/terminology";
import type { ProductModuleAccessState } from "@/features/product-access/domain/types";
import { loadProductModuleAccess } from "@/features/product-access/server/load-product-module-access";
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

vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
}));

vi.mock("@/features/onboarding/server/operating-model-status", () => ({
  resolveOperatingModelSetupStatus: vi.fn(async (input: {
    organizationId: string;
    role: string;
  }) => ({
    kind: "configured",
    organizationId: input.organizationId,
    role: input.role,
    packKey: "niche.online-course-business",
  })),
  isCourseSellerContextPack: () => true,
}));

vi.mock("@/features/product-access/server/load-product-module-access", () => ({
  loadProductModuleAccess: vi.fn(),
}));

const ORG_B = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const loadModuleAccessMock = vi.mocked(loadProductModuleAccess);

function resolvedModuleAccess(input: {
  leads: boolean;
  customers: boolean;
}): ProductModuleAccessState {
  return {
    resolution: "resolved",
    navVisibility: {
      ...FAIL_CLOSED_MODULE_NAV_VISIBILITY,
      leads: input.leads,
      customers: input.customers,
    },
    relevantCapabilities: [],
    terminology: DEFAULT_PRODUCT_TERMINOLOGY,
  };
}

function createOrgResolverSupabase(options: {
  user?: { id: string } | null;
  memberships?: Array<{ organizationId: string; role: "owner" | "admin" | "staff" | "viewer" }>;
  orgNames?: Record<string, string>;
  timezone?: string | null;
  onboardingCompletedAt?: string | null;
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
                data: {
                  timezone: options.timezone ?? "UTC",
                  onboarding_completed_at:
                    options.onboardingCompletedAt ?? "2026-07-01T00:00:00.000Z",
                },
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

beforeEach(() => {
  vi.clearAllMocks();
  loadModuleAccessMock.mockResolvedValue(
    resolvedModuleAccess({ leads: true, customers: true }),
  );
});

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

describe("Lead and Customer product module route access", () => {
  function singleOrganizationSupabase() {
    return createOrgResolverSupabase({
      user: { id: USER_ID },
      memberships: [{ organizationId: ORG_ID, role: "staff" }],
      orgNames: { [ORG_ID]: "Org Alpha" },
    });
  }

  it("allows Product Customers while denying Product Leads", async () => {
    loadModuleAccessMock.mockResolvedValue(
      resolvedModuleAccess({ leads: false, customers: true }),
    );

    const customerResult = await resolveCustomerPageOrganization(
      singleOrganizationSupabase(),
      ORG_ID,
    );
    const leadResult = await resolveLeadPageOrganization(
      singleOrganizationSupabase(),
      ORG_ID,
    );

    expect(customerResult.kind).toBe("ready");
    expect(leadResult.kind).toBe("query_error");
  });

  it("denies both direct routes when module access is unresolved", async () => {
    loadModuleAccessMock.mockResolvedValue(buildUnresolvedProductModuleAccess());

    const customerResult = await resolveCustomerPageOrganization(
      singleOrganizationSupabase(),
      ORG_ID,
    );
    const leadResult = await resolveLeadPageOrganization(
      singleOrganizationSupabase(),
      ORG_ID,
    );

    expect(customerResult.kind).toBe("query_error");
    expect(leadResult.kind).toBe("query_error");
  });

  it.each(["TG1", "TG2", "TG3"])(
    "preserves lawful Lead and Customer access for %s",
    async () => {
      loadModuleAccessMock.mockResolvedValue(
        resolvedModuleAccess({ leads: true, customers: true }),
      );

      const customerResult = await resolveCustomerPageOrganization(
        singleOrganizationSupabase(),
        ORG_ID,
      );
      const leadResult = await resolveLeadPageOrganization(
        singleOrganizationSupabase(),
        ORG_ID,
      );

      expect(customerResult.kind).toBe("ready");
      expect(leadResult.kind).toBe("ready");
    },
  );
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
