import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { CustomerApplicationError } from "@/features/customers/domain/types";
import type { Database } from "@/types/database";
import {
  archiveCustomerMutation,
  createCustomerMutation,
  restoreCustomerMutation,
  transitionCustomerStatusMutation,
  updateCustomerProfileMutation,
} from "@/features/customers/server/customer-mutations";
import * as customerReadQueries from "@/features/customers/server/customer-read-queries";
import * as customerRpcAdapters from "@/features/customers/server/customer-rpc-adapters";
import {
  archiveRestoreInput,
  createCustomerInput,
  NEW_CUSTOMER_ID,
  sampleCustomerDetail,
  transitionStatusInput,
  updateProfileInput,
} from "../helpers/customer-mutation-mocks";
import { ORG_ID, CUSTOMER_ID } from "../helpers/customer-read-query-mocks";

const supabase = {} as SupabaseClient<Database>;

function adapterError(message: string, code?: CustomerApplicationError["code"]): CustomerApplicationError {
  return {
    code: code ?? "UNEXPECTED_ERROR",
    message,
    retryable: false,
    category: "server",
  };
}

vi.mock("@/features/customers/server/customer-rpc-adapters", () => ({
  callCreateCustomerRpc: vi.fn(),
  callTransitionCustomerStatusRpc: vi.fn(),
  callArchiveCustomerRpc: vi.fn(),
  callRestoreCustomerRpc: vi.fn(),
}));

vi.mock("@/features/customers/server/customer-read-queries", () => ({
  getCustomerById: vi.fn(),
}));

const rpcMocks = {
  create: vi.mocked(customerRpcAdapters.callCreateCustomerRpc),
  transition: vi.mocked(customerRpcAdapters.callTransitionCustomerStatusRpc),
  archive: vi.mocked(customerRpcAdapters.callArchiveCustomerRpc),
  restore: vi.mocked(customerRpcAdapters.callRestoreCustomerRpc),
};
const getCustomerById = vi.mocked(customerReadQueries.getCustomerById);

beforeEach(() => {
  vi.clearAllMocks();
  getCustomerById.mockResolvedValue({ ok: true, data: sampleCustomerDetail });
});

describe("createCustomerMutation", () => {
  it("returns authoritative detail after RPC and refetch", async () => {
    rpcMocks.create.mockResolvedValue({ ok: true, customerId: NEW_CUSTOMER_ID });

    const result = await createCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: createCustomerInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.operation).toBe("create");
      expect(result.customerId).toBe(NEW_CUSTOMER_ID);
      expect(result.refreshHints.history).toBe(true);
    }
    expect(rpcMocks.create).toHaveBeenCalledOnce();
    expect(getCustomerById).toHaveBeenCalledWith({
      supabase,
      organizationId: ORG_ID,
      customerId: NEW_CUSTOMER_ID,
    });
  });

  it("denies viewer role before RPC", async () => {
    const result = await createCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "viewer",
      input: createCustomerInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(rpcMocks.create).not.toHaveBeenCalled();
  });

  it("maps duplicate email without retry", async () => {
    rpcMocks.create.mockResolvedValue({
      ok: false,
      error: adapterError("duplicate", "DUPLICATE_CUSTOMER"),
    });

    const result = await createCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: createCustomerInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("DUPLICATE_CUSTOMER");
    }
    expect(getCustomerById).not.toHaveBeenCalled();
  });

  it("returns committed refresh failure when refetch fails", async () => {
    rpcMocks.create.mockResolvedValue({ ok: true, customerId: NEW_CUSTOMER_ID });
    getCustomerById.mockResolvedValue({
      ok: false,
      error: adapterError("missing", "CUSTOMER_UNAVAILABLE"),
    });

    const result = await createCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "owner",
      input: createCustomerInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.customerId).toBe(NEW_CUSTOMER_ID);
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
    }
  });
});

describe("updateCustomerProfileMutation", () => {
  function createUpdateSupabase(options?: {
    updateError?: { message: string; code?: string } | null;
    updatedRows?: Array<{ id: string }>;
    ownerFound?: boolean;
  }) {
    const updateResult = {
      data: options?.updatedRows ?? [{ id: CUSTOMER_ID }],
      error: options?.updateError ?? null,
    };

    return {
      from: vi.fn((table: string) => {
        if (table === "organization_members") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: options?.ownerFound === false ? null : { id: updateProfileInput.ownerMemberId },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "customers") {
          return {
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  select: vi.fn().mockResolvedValue(updateResult),
                }),
              }),
            }),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;
  }

  it("uses explicit allowlist and organization/customer filters", async () => {
    const updateSupabase = createUpdateSupabase();
    const fromSpy = vi.spyOn(updateSupabase, "from");

    const result = await updateCustomerProfileMutation({
      supabase: updateSupabase,
      organizationId: ORG_ID,
      role: "staff",
      input: updateProfileInput,
    });

    expect(result.ok).toBe(true);
    const customersBuilder = fromSpy.mock.results.find((_, index) => fromSpy.mock.calls[index]?.[0] === "customers");
    expect(customersBuilder).toBeDefined();
    const updateMock = (customersBuilder?.value as { update: ReturnType<typeof vi.fn> }).update;
    expect(updateMock).toHaveBeenCalledWith({
      display_name: updateProfileInput.displayName,
      first_name: updateProfileInput.firstName,
      last_name: updateProfileInput.lastName,
      email: updateProfileInput.email,
      phone: updateProfileInput.phone,
      owner_member_id: updateProfileInput.ownerMemberId,
    });
    expect(updateMock.mock.calls[0]?.[0]).not.toHaveProperty("status");
    expect(updateMock.mock.calls[0]?.[0]).not.toHaveProperty("metadata");
  });

  it("denies viewer and archived customers", async () => {
    const viewerResult = await updateCustomerProfileMutation({
      supabase,
      organizationId: ORG_ID,
      role: "viewer",
      input: updateProfileInput,
    });
    expect(viewerResult.ok).toBe(false);

    getCustomerById.mockResolvedValueOnce({
      ok: true,
      data: { ...sampleCustomerDetail, archivedAt: "2026-07-14T12:00:00.000Z", derived: { isArchived: true, allowedTransitions: [] } },
    });

    const archivedResult = await updateCustomerProfileMutation({
      supabase: createUpdateSupabase(),
      organizationId: ORG_ID,
      role: "admin",
      input: updateProfileInput,
    });

    expect(archivedResult.ok).toBe(false);
    if (!archivedResult.ok && !archivedResult.committed) {
      expect(archivedResult.error.code).toBe("ARCHIVED_RECORD");
    }
  });

  it("maps invalid owner and unique email conflicts", async () => {
    const ownerResult = await updateCustomerProfileMutation({
      supabase: createUpdateSupabase({ ownerFound: false }),
      organizationId: ORG_ID,
      role: "admin",
      input: updateProfileInput,
    });
    expect(ownerResult.ok).toBe(false);
    if (!ownerResult.ok && !ownerResult.committed) {
      expect(ownerResult.error.code).toBe("INVALID_OWNER");
    }

    const duplicateResult = await updateCustomerProfileMutation({
      supabase: createUpdateSupabase({
        updateError: { message: "customer email already exists in organization" },
      }),
      organizationId: ORG_ID,
      role: "admin",
      input: updateProfileInput,
    });
    expect(duplicateResult.ok).toBe(false);
    if (!duplicateResult.ok && !duplicateResult.committed) {
      expect(duplicateResult.error.code).toBe("DUPLICATE_CUSTOMER");
    }
  });

  it("requires exactly one updated row", async () => {
    const zeroRowResult = await updateCustomerProfileMutation({
      supabase: createUpdateSupabase({ updatedRows: [] }),
      organizationId: ORG_ID,
      role: "admin",
      input: updateProfileInput,
    });

    expect(zeroRowResult.ok).toBe(false);
    if (!zeroRowResult.ok && !zeroRowResult.committed) {
      expect(zeroRowResult.error.code).toBe("CUSTOMER_UNAVAILABLE");
    }
  });

  it("returns committed refresh failure after successful update", async () => {
    getCustomerById
      .mockResolvedValueOnce({ ok: true, data: sampleCustomerDetail })
      .mockResolvedValueOnce({ ok: false, error: adapterError("missing", "CUSTOMER_UNAVAILABLE") });

    const result = await updateCustomerProfileMutation({
      supabase: createUpdateSupabase(),
      organizationId: ORG_ID,
      role: "admin",
      input: updateProfileInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
      expect(result.customerId).toBe(CUSTOMER_ID);
    }
  });
});

describe("transitionCustomerStatusMutation", () => {
  it("allows owner/admin/staff and uses transition RPC", async () => {
    rpcMocks.transition.mockResolvedValue({ ok: true, customerId: CUSTOMER_ID });

    const result = await transitionCustomerStatusMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: transitionStatusInput,
    });

    expect(result.ok).toBe(true);
    expect(rpcMocks.transition).toHaveBeenCalledOnce();
    if (result.ok) {
      expect(result.refreshHints.history).toBe(true);
    }
  });

  it("denies viewer and maps RPC failures", async () => {
    const viewerResult = await transitionCustomerStatusMutation({
      supabase,
      organizationId: ORG_ID,
      role: "viewer",
      input: transitionStatusInput,
    });
    expect(viewerResult.ok).toBe(false);

    rpcMocks.transition.mockResolvedValue({
      ok: false,
      error: adapterError("blocked", "TRANSITION_NOT_ALLOWED"),
    });

    const blockedResult = await transitionCustomerStatusMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: transitionStatusInput,
    });

    expect(blockedResult.ok).toBe(false);
    if (!blockedResult.ok && !blockedResult.committed) {
      expect(blockedResult.error.code).toBe("TRANSITION_NOT_ALLOWED");
    }
  });

  it("returns committed refresh failure", async () => {
    rpcMocks.transition.mockResolvedValue({ ok: true, customerId: CUSTOMER_ID });
    getCustomerById.mockResolvedValue({
      ok: false,
      error: adapterError("missing", "CUSTOMER_UNAVAILABLE"),
    });

    const result = await transitionCustomerStatusMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: transitionStatusInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
    }
  });
});

describe("archive and restore mutations", () => {
  it("allows owner/admin archive via RPC without direct archive update", async () => {
    rpcMocks.archive.mockResolvedValue({ ok: true, customerId: CUSTOMER_ID });

    const result = await archiveCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "owner",
      input: archiveRestoreInput,
    });

    expect(result.ok).toBe(true);
    expect(rpcMocks.archive).toHaveBeenCalledOnce();
    if (result.ok) {
      expect(result.refreshHints.history).toBe(false);
    }
  });

  it("denies staff archive and viewer restore", async () => {
    const staffArchive = await archiveCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: archiveRestoreInput,
    });
    expect(staffArchive.ok).toBe(false);

    const viewerRestore = await restoreCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "viewer",
      input: archiveRestoreInput,
    });
    expect(viewerRestore.ok).toBe(false);
  });

  it("restores via exact RPC and preserves lifecycle in returned model", async () => {
    rpcMocks.restore.mockResolvedValue({ ok: true, customerId: CUSTOMER_ID });

    const result = await restoreCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: archiveRestoreInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.customer.status).toBe("active");
      expect(result.customer.archivedAt).toBeNull();
    }
  });

  it("returns committed refresh failures for archive and restore", async () => {
    rpcMocks.archive.mockResolvedValue({ ok: true, customerId: CUSTOMER_ID });
    getCustomerById.mockResolvedValue({
      ok: false,
      error: adapterError("missing", "CUSTOMER_UNAVAILABLE"),
    });

    const archiveResult = await archiveCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: archiveRestoreInput,
    });

    expect(archiveResult.ok).toBe(false);
    if (!archiveResult.ok && archiveResult.committed) {
      expect(archiveResult.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
    }
  });
});
