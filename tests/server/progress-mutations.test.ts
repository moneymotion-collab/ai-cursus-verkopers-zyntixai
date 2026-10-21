import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  recordProgressFactMutation,
  voidProgressFactMutation,
} from "@/features/progress/server/progress-mutations";
import * as rpcAdapters from "@/features/progress/server/progress-rpc-adapters";
import * as readQueries from "@/features/progress/server/progress-read-queries";
import {
  ENROLLMENT_ID,
  ORG_ID,
  PROGRESS_FACT_ID,
} from "../helpers/progress-test-fixtures";
import type { ProgressFactDetailReadModel } from "@/features/progress/domain/read-types";

vi.mock("@/features/progress/server/progress-rpc-adapters", () => ({
  callRecordProgressFactRpc: vi.fn(),
  callVoidProgressFactRpc: vi.fn(),
}));

vi.mock("@/features/progress/server/progress-read-queries", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/progress/server/progress-read-queries")
  >("@/features/progress/server/progress-read-queries");
  return {
    ...actual,
    getProgressFactById: vi.fn(),
  };
});

const callRecordProgressFactRpc = vi.mocked(rpcAdapters.callRecordProgressFactRpc);
const callVoidProgressFactRpc = vi.mocked(rpcAdapters.callVoidProgressFactRpc);
const getProgressFactById = vi.mocked(readQueries.getProgressFactById);

const sampleDetail: ProgressFactDetailReadModel = {
  id: PROGRESS_FACT_ID,
  organizationId: ORG_ID,
  enrollmentId: ENROLLMENT_ID,
  customerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  programId: "22222222-2222-4222-8222-222222222222",
  factType: "manual_observation",
  factTypeLabel: "Manual observation",
  source: "manual",
  sourceLabel: "Manual",
  title: "Note",
  description: null,
  numericValue: null,
  numericUnit: null,
  isComplete: null,
  sequenceNumber: null,
  idempotencyKey: null,
  correctedFromFactId: null,
  occurredAt: "2026-07-20T10:00:00.000Z",
  recordedAt: "2026-07-20T10:05:00.000Z",
  recordedByMemberId: "33333333-3333-4333-8333-333333333333",
  voidedAt: null,
  voidedByMemberId: null,
  voidReason: null,
  enrollment: {
    id: ENROLLMENT_ID,
    status: "active",
    archivedAt: null,
    customerId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    programId: "22222222-2222-4222-8222-222222222222",
  },
  customer: null,
  program: null,
  derived: {
    isVoided: false,
    isCorrection: false,
    isManual: true,
    hasActiveLineagePredecessor: false,
  },
};

function createMutationSupabase() {
  const maybeSingle = vi.fn().mockResolvedValue({
    data: { status: "active", archived_at: null },
    error: null,
  });
  return {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({ maybeSingle }),
        }),
      }),
    }),
  } as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  callRecordProgressFactRpc.mockReset();
  callVoidProgressFactRpc.mockReset();
  getProgressFactById.mockReset();
});

describe("progress mutations foundation", () => {
  it("denies viewer record mutations without calling RPC", async () => {
    const result = await recordProgressFactMutation({
      supabase: createMutationSupabase(),
      organizationId: ORG_ID,
      role: "viewer",
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "Note",
      },
    });

    expect(result.ok).toBe(false);
    expect(callRecordProgressFactRpc).not.toHaveBeenCalled();
  });

  it("records via RPC for staff on active enrollments", async () => {
    callRecordProgressFactRpc.mockResolvedValue({
      ok: true,
      progressFactId: PROGRESS_FACT_ID,
    });
    getProgressFactById.mockResolvedValue({ ok: true, data: sampleDetail });

    const result = await recordProgressFactMutation({
      supabase: createMutationSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        factType: "manual_observation",
        occurredAt: "2026-07-20T10:00:00.000Z",
        title: "Note",
      },
    });

    expect(result.ok).toBe(true);
    expect(callRecordProgressFactRpc).toHaveBeenCalledOnce();
  });

  it("voids via RPC when owner is permitted", async () => {
    getProgressFactById.mockResolvedValue({ ok: true, data: sampleDetail });
    callVoidProgressFactRpc.mockResolvedValue({
      ok: true,
      progressFactId: PROGRESS_FACT_ID,
    });

    const result = await voidProgressFactMutation({
      supabase: createMutationSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: {
        organizationId: ORG_ID,
        progressFactId: PROGRESS_FACT_ID,
        reason: "Duplicate",
      },
    });

    expect(result.ok).toBe(true);
    expect(callVoidProgressFactRpc).toHaveBeenCalledOnce();
  });
});
