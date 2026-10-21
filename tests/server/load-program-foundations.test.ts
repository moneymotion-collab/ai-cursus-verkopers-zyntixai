import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  loadProgramDetailFoundation,
  loadProgramsListFoundation,
} from "@/features/programs/server/load-program-foundations";
import {
  getProgramById,
  listPrograms,
  listProgramStatusHistory,
} from "@/features/programs/server/program-read-queries";
import {
  ORG_ID,
  PROGRAM_ID,
  sampleProgramDetail,
  sampleProgramHistory,
  sampleProgramListItem,
} from "../helpers/program-test-fixtures";

vi.mock("@/features/programs/server/program-read-queries", () => ({
  listPrograms: vi.fn(),
  getProgramById: vi.fn(),
  listProgramStatusHistory: vi.fn(),
}));

const listProgramsMock = vi.mocked(listPrograms);
const getProgramByIdMock = vi.mocked(getProgramById);
const historyMock = vi.mocked(listProgramStatusHistory);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadProgramsListFoundation", () => {
  it("returns typed list result with owner capabilities", async () => {
    listProgramsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [sampleProgramListItem],
        pagination: {
          page: 1,
          pageSize: 25,
          total: 1,
          totalPages: 1,
          hasPreviousPage: false,
          hasNextPage: false,
        },
      },
    });

    const result = await loadProgramsListFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      filters: { search: "growth", status: "active" },
      pagination: { page: 1, pageSize: 25 },
      sort: { field: "name", direction: "asc" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.capabilities.canCreateProgram).toBe(true);
    expect(result.data.result.items[0]?.name).toBe("Growth Lab");
    expect(result.data.sort).toEqual({ field: "name", direction: "asc" });
  });

  it("propagates read adapter failures", async () => {
    listProgramsMock.mockResolvedValue({
      ok: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to view programs.",
        retryable: false,
        category: "permission",
      },
    });

    const result = await loadProgramsListFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "viewer",
    });

    expect(result.ok).toBe(false);
  });
});

describe("loadProgramDetailFoundation", () => {
  it("loads program and history for permitted roles", async () => {
    getProgramByIdMock.mockResolvedValue({ ok: true, data: sampleProgramDetail });
    historyMock.mockResolvedValue({ ok: true, data: [sampleProgramHistory] });

    const result = await loadProgramDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "admin",
      programId: PROGRAM_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.historyState.kind).toBe("ready");
    expect(result.data.history).toHaveLength(1);
    expect(result.data.program.openEnrollmentCount).toBe(0);
  });

  it("returns empty history state when no events exist", async () => {
    getProgramByIdMock.mockResolvedValue({ ok: true, data: sampleProgramDetail });
    historyMock.mockResolvedValue({ ok: true, data: [] });

    const result = await loadProgramDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      programId: PROGRAM_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.historyState.kind).toBe("empty");
  });

  it("keeps program readable when history fails independently", async () => {
    getProgramByIdMock.mockResolvedValue({ ok: true, data: sampleProgramDetail });
    historyMock.mockResolvedValue({
      ok: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "Unable to load program history.",
        retryable: true,
        category: "server",
      },
    });

    const result = await loadProgramDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      programId: PROGRAM_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.historyState.kind).toBe("error");
    expect(result.data.program.id).toBe(PROGRAM_ID);
  });

  it("denies staff viewing archived programs", async () => {
    getProgramByIdMock.mockResolvedValue({
      ok: true,
      data: {
        ...sampleProgramDetail,
        archivedAt: "2026-07-20T00:00:00.000Z",
        derived: { isArchived: true, allowedTransitions: [] },
      },
    });

    const result = await loadProgramDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      programId: PROGRAM_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("PROGRAM_UNAVAILABLE");
    expect(historyMock).not.toHaveBeenCalled();
  });
});
