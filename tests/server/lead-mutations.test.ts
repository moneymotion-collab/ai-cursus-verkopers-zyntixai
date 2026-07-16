import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { LeadApplicationError } from "@/features/leads/domain/types";
import type { Database } from "@/types/database";
import {
  archiveLeadMutation,
  convertLeadToCustomerMutation,
  createLeadMutation,
  restoreLeadMutation,
  transitionLeadStageMutation,
  transitionLeadStatusMutation,
  updateLeadProfileMutation,
} from "@/features/leads/server/lead-mutations";
import * as leadReadQueries from "@/features/leads/server/lead-read-queries";
import * as leadRpcAdapters from "@/features/leads/server/lead-rpc-adapters";
import {
  archiveRestoreInput,
  convertLeadInput,
  createLeadInput,
  NEW_LEAD_ID,
  sampleLeadDetail,
  transitionStageInput,
  transitionStatusInput,
  updateProfileInput,
} from "../helpers/lead-mutation-mocks";
import { CUSTOMER_ID, LEAD_ID, ORG_ID } from "../helpers/lead-read-query-mocks";

const supabase = {} as SupabaseClient<Database>;

function adapterError(
  message: string,
  code?: LeadApplicationError["code"],
): LeadApplicationError {
  return {
    code: code ?? "UNEXPECTED_ERROR",
    message,
    retryable: false,
    category: "server",
  };
}

vi.mock("@/features/leads/server/lead-rpc-adapters", () => ({
  callCreateLeadRpc: vi.fn(),
  callTransitionLeadStageRpc: vi.fn(),
  callTransitionLeadStatusRpc: vi.fn(),
  callConvertLeadToCustomerRpc: vi.fn(),
  callArchiveLeadRpc: vi.fn(),
  callRestoreLeadRpc: vi.fn(),
}));

vi.mock("@/features/leads/server/lead-read-queries", () => ({
  getLeadById: vi.fn(),
}));

const rpcMocks = {
  create: vi.mocked(leadRpcAdapters.callCreateLeadRpc),
  transitionStage: vi.mocked(leadRpcAdapters.callTransitionLeadStageRpc),
  transitionStatus: vi.mocked(leadRpcAdapters.callTransitionLeadStatusRpc),
  convert: vi.mocked(leadRpcAdapters.callConvertLeadToCustomerRpc),
  archive: vi.mocked(leadRpcAdapters.callArchiveLeadRpc),
  restore: vi.mocked(leadRpcAdapters.callRestoreLeadRpc),
};
const getLeadById = vi.mocked(leadReadQueries.getLeadById);

beforeEach(() => {
  vi.clearAllMocks();
  getLeadById.mockResolvedValue({ ok: true, data: sampleLeadDetail });
});

describe("createLeadMutation", () => {
  it("returns authoritative detail after RPC and refetch", async () => {
    rpcMocks.create.mockResolvedValue({ ok: true, leadId: NEW_LEAD_ID });

    const result = await createLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: createLeadInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.operation).toBe("create");
      expect(result.leadId).toBe(NEW_LEAD_ID);
      expect(result.refreshHints.statusHistory).toBe(true);
      expect(result.refreshHints.stageHistory).toBe(true);
    }
    expect(rpcMocks.create).toHaveBeenCalledOnce();
  });

  it("denies viewer role before RPC", async () => {
    const result = await createLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "viewer",
      input: createLeadInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(rpcMocks.create).not.toHaveBeenCalled();
  });

  it("returns committed refresh failure when refetch fails", async () => {
    rpcMocks.create.mockResolvedValue({ ok: true, leadId: NEW_LEAD_ID });
    getLeadById.mockResolvedValue({
      ok: false,
      error: adapterError("missing", "LEAD_UNAVAILABLE"),
    });

    const result = await createLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "owner",
      input: createLeadInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.leadId).toBe(NEW_LEAD_ID);
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
    }
  });
});

describe("updateLeadProfileMutation", () => {
  function createUpdateSupabase(options?: {
    updateError?: { message: string } | null;
    updatedRows?: Array<{ id: string }>;
    ownerFound?: boolean;
  }) {
    const updateResult = {
      data: options?.updatedRows ?? [{ id: LEAD_ID }],
      error: options?.updateError ?? null,
    };

    const chain = {
      eq: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue(updateResult),
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
                      data: options?.ownerFound === false ? null : { id: "member" },
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          };
        }

        if (table === "leads") {
          return {
            update: vi.fn().mockReturnValue(chain),
          };
        }

        throw new Error(`Unexpected table ${table}`);
      }),
    } as unknown as SupabaseClient<Database>;
  }

  it("updates allowlisted profile columns for staff", async () => {
    const client = createUpdateSupabase();

    const result = await updateLeadProfileMutation({
      supabase: client,
      organizationId: ORG_ID,
      role: "staff",
      input: updateProfileInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.operation).toBe("update_profile");
      expect(result.refreshHints.detail).toBe(true);
    }
  });

  it("rejects archived leads before update", async () => {
    getLeadById.mockResolvedValue({
      ok: true,
      data: {
        ...sampleLeadDetail,
        archivedAt: "2026-07-16T10:00:00.000Z",
        derived: {
          ...sampleLeadDetail.derived,
          isArchived: true,
          isConvertible: false,
          allowedStatusTransitions: [],
        },
      },
    });

    const result = await updateLeadProfileMutation({
      supabase: createUpdateSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      input: updateProfileInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ARCHIVED_RECORD");
    }
  });

  it("rejects invalid update payloads before database access", async () => {
    const result = await updateLeadProfileMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: {
        ...updateProfileInput,
        status: "lost",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INVALID_INPUT");
    }
  });
});

describe("transitionLeadStageMutation and transitionLeadStatusMutation", () => {
  it("transitions stage for eligible open leads", async () => {
    rpcMocks.transitionStage.mockResolvedValue({ ok: true, leadId: LEAD_ID });

    const result = await transitionLeadStageMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: transitionStageInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refreshHints.stageHistory).toBe(true);
    }
  });

  it("transitions status for eligible open leads", async () => {
    rpcMocks.transitionStatus.mockResolvedValue({ ok: true, leadId: LEAD_ID });

    const result = await transitionLeadStatusMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: transitionStatusInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refreshHints.statusHistory).toBe(true);
    }
  });

  it("rejects conversion through generic status mutation", async () => {
    const result = await transitionLeadStatusMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: {
        organizationId: ORG_ID,
        leadId: LEAD_ID,
        toStatus: "converted",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INVALID_INPUT");
    }
    expect(rpcMocks.transitionStatus).not.toHaveBeenCalled();
  });

  it("denies stage transition for converted leads at permission layer", async () => {
    getLeadById.mockResolvedValue({
      ok: true,
      data: {
        ...sampleLeadDetail,
        status: "converted",
        statusLabel: "Converted",
        derived: {
          isArchived: false,
          isConverted: true,
          isConvertible: false,
          allowedStatusTransitions: [],
        },
      },
    });

    const result = await transitionLeadStageMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: transitionStageInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(rpcMocks.transitionStage).not.toHaveBeenCalled();
  });
});

describe("convertLeadToCustomerMutation", () => {
  it("returns lead and customer identifiers after conversion", async () => {
    rpcMocks.convert.mockResolvedValue({
      ok: true,
      leadId: LEAD_ID,
      customerId: CUSTOMER_ID,
    });

    const result = await convertLeadToCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: convertLeadInput,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.customerId).toBe(CUSTOMER_ID);
      expect(result.refreshHints.statusHistory).toBe(true);
    }
  });

  it("maps already-converted RPC failures", async () => {
    rpcMocks.convert.mockResolvedValue({
      ok: false,
      error: adapterError("already", "ALREADY_CONVERTED"),
    });

    const result = await convertLeadToCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: convertLeadInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ALREADY_CONVERTED");
    }
  });

  it("denies viewer conversion", async () => {
    const result = await convertLeadToCustomerMutation({
      supabase,
      organizationId: ORG_ID,
      role: "viewer",
      input: convertLeadInput,
    });

    expect(result.ok).toBe(false);
    expect(rpcMocks.convert).not.toHaveBeenCalled();
  });
});

describe("archiveLeadMutation and restoreLeadMutation", () => {
  it("allows owner archive and restore", async () => {
    rpcMocks.archive.mockResolvedValue({ ok: true, leadId: LEAD_ID });
    rpcMocks.restore.mockResolvedValue({ ok: true, leadId: LEAD_ID });

    const archive = await archiveLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "owner",
      input: archiveRestoreInput,
    });
    const restore = await restoreLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: archiveRestoreInput,
    });

    expect(archive.ok).toBe(true);
    expect(restore.ok).toBe(true);
  });

  it("denies staff archive and restore", async () => {
    const archive = await archiveLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: archiveRestoreInput,
    });
    const restore = await restoreLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "staff",
      input: archiveRestoreInput,
    });

    expect(archive.ok).toBe(false);
    expect(restore.ok).toBe(false);
    expect(rpcMocks.archive).not.toHaveBeenCalled();
    expect(rpcMocks.restore).not.toHaveBeenCalled();
  });

  it("normalizes unavailable archive targets", async () => {
    rpcMocks.archive.mockResolvedValue({
      ok: false,
      error: adapterError("missing", "LEAD_UNAVAILABLE"),
    });

    const result = await archiveLeadMutation({
      supabase,
      organizationId: ORG_ID,
      role: "admin",
      input: archiveRestoreInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("LEAD_UNAVAILABLE");
    }
  });
});
