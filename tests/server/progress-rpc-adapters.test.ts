import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  PROGRESS_RPC_NAMES,
  PROGRESS_UNSUPPORTED_RPC_NAMES,
  callRecordProgressFactRpc,
  callVoidProgressFactRpc,
} from "@/features/progress/server/progress-rpc-adapters";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import {
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROGRESS_FACT_ID,
  USER_ID,
} from "../helpers/progress-test-fixtures";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);

function createRpcSupabase(rpcImpl: ReturnType<typeof vi.fn>) {
  return {
    rpc: rpcImpl,
  } as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role: "owner",
      userId: USER_ID,
    },
  });
});

describe("progress RPC adapters", () => {
  it("uses exact record_progress_fact name and membership-resolved organization id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: PROGRESS_FACT_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await callRecordProgressFactRpc({
      supabase,
      organizationId: "99999999-9999-4999-8999-999999999999",
      input: {
        organizationId: "99999999-9999-4999-8999-999999999999",
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "Note",
        description: null,
        numericValue: null,
        numericUnit: null,
        isComplete: null,
        sequenceNumber: null,
        idempotencyKey: null,
        correctedFromFactId: null,
      },
    });

    expect(result.ok).toBe(true);
    expect(PROGRESS_RPC_NAMES.record).toBe("record_progress_fact");
    expect(PROGRESS_UNSUPPORTED_RPC_NAMES.update).toBe("update_progress_fact");
    expect(rpc).toHaveBeenCalledWith(PROGRESS_RPC_NAMES.record, {
      p_organization_id: ORG_ID,
      p_enrollment_id: ENROLLMENT_ID,
      p_fact_type: "manual_observation",
      p_occurred_at: "2026-07-20T10:00:00.000Z",
      p_title: "Note",
      p_description: undefined,
      p_numeric_value: undefined,
      p_numeric_unit: undefined,
      p_is_complete: undefined,
      p_sequence_number: undefined,
      p_idempotency_key: undefined,
      p_corrected_from_fact_id: undefined,
    });
    expect(rpc.mock.calls[0][0]).not.toBe("from");
  });

  it("uses exact void_progress_fact name and argument keys", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await callVoidProgressFactRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        progressFactId: PROGRESS_FACT_ID,
        reason: "Duplicate entry",
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith(PROGRESS_RPC_NAMES.void, {
      p_organization_id: ORG_ID,
      p_progress_fact_id: PROGRESS_FACT_ID,
      p_reason: "Duplicate entry",
    });
  });

  it("fails closed when membership organization context is missing", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const rpc = vi.fn();
    const result = await callRecordProgressFactRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "Note",
        description: null,
        numericValue: null,
        numericUnit: null,
        isComplete: null,
        sequenceNumber: null,
        idempotencyKey: null,
        correctedFromFactId: null,
      },
    });

    expect(result.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("maps known RPC errors without leaking details", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "insufficient role" } });
    const result = await callVoidProgressFactRpc({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        progressFactId: PROGRESS_FACT_ID,
        reason: "Mistake",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
      expect(result.error.message).not.toContain(PROGRESS_FACT_ID);
    }
  });
});
