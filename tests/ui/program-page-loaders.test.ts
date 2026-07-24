import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadProgramsPage } from "@/features/programs/ui/load-programs-page";
import { loadProgramDetailPage } from "@/features/programs/ui/load-program-detail-page";
import { loadProgramCreatePage } from "@/features/programs/ui/load-program-create-page";
import { resolveProgramPageOrganization } from "@/features/programs/server/resolve-program-page-organization";
import {
  loadProgramDetailFoundation,
  loadProgramsListFoundation,
} from "@/features/programs/server/load-program-foundations";
import {
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  sampleProgramDetail,
  sampleProgramHistory,
  sampleProgramListItem,
} from "../helpers/program-test-fixtures";

vi.mock("@/features/programs/server/resolve-program-page-organization", () => ({
  resolveProgramPageOrganization: vi.fn(),
}));

vi.mock("@/features/programs/server/load-program-foundations", () => ({
  loadProgramsListFoundation: vi.fn(),
  loadProgramDetailFoundation: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveProgramPageOrganization);
const listFoundationMock = vi.mocked(loadProgramsListFoundation);
const detailFoundationMock = vi.mocked(loadProgramDetailFoundation);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

function readyOrg(role: "owner" | "admin" | "staff" | "viewer" = "owner") {
  return {
    kind: "ready" as const,
    organizationId: ORG_ID,
    organizationName: "Acme",
    organizationOptions: [
      {
        organizationId: ORG_ID,
        displayName: "Acme",
        role,
      },
    ],
    role,
    timezone: "Europe/Amsterdam",
    isMultiOrganization: false,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("owner"));
});

describe("loadProgramsPage", () => {
  it("returns populated list for owner with capabilities", async () => {
    listFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "owner",
        capabilities: {
          canListPrograms: true,
          canViewProgram: true,
          canViewArchivedPrograms: true,
          canCreateProgram: true,
          canUpdateProgram: true,
          canTransitionProgramStatus: true,
          canArchiveProgram: true,
          canRestoreProgram: false,
          canViewProgramHistory: true,
        },
        filters: { includeArchived: false },
        sort: { field: "updated_at", direction: "desc" },
        result: {
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
      },
    });

    const result = await loadProgramsPage(createSupabase(), { q: " growth " });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.list.items).toHaveLength(1);
    expect(result.capabilities.canCreateProgram).toBe(true);
    expect(result.urlState.q).toBe("growth");
    expect(listFoundationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: ORG_ID,
        role: "owner",
        filters: expect.objectContaining({ search: "growth" }),
      }),
    );
  });

  it("returns auth_required without calling list foundation", async () => {
    pageOrgMock.mockResolvedValueOnce({ kind: "auth_required" });
    const result = await loadProgramsPage(createSupabase(), {});
    expect(result.kind).toBe("auth_required");
    expect(listFoundationMock).not.toHaveBeenCalled();
  });

  it("surfaces adapter query errors safely", async () => {
    listFoundationMock.mockResolvedValue({
      ok: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "Unable to load programs.",
        retryable: true,
        category: "server",
      },
    });

    const result = await loadProgramsPage(createSupabase(), {});
    expect(result.kind).toBe("query_error");
    if (result.kind !== "query_error") return;
    expect(result.message).toBe("Unable to load programs.");
    expect(result.retryable).toBe(true);
  });

  it("does not trust browser organization authority beyond membership resolution", async () => {
    pageOrgMock.mockResolvedValueOnce(readyOrg("staff"));
    listFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "staff",
        capabilities: {
          canListPrograms: true,
          canViewProgram: true,
          canViewArchivedPrograms: false,
          canCreateProgram: false,
          canUpdateProgram: false,
          canTransitionProgramStatus: false,
          canArchiveProgram: false,
          canRestoreProgram: false,
          canViewProgramHistory: true,
        },
        filters: { includeArchived: false },
        sort: { field: "updated_at", direction: "desc" },
        result: {
          items: [],
          pagination: {
            page: 1,
            pageSize: 25,
            total: 0,
            totalPages: 0,
            hasPreviousPage: false,
            hasNextPage: false,
          },
        },
      },
    });

    const result = await loadProgramsPage(createSupabase(), {
      org: ORG_ID,
      archived: "true",
    });
    expect(result.kind).toBe("success");
    if (result.kind !== "success") return;
    expect(result.urlState.archived).toBe(false);
    expect(result.filterWarning).toContain("filters were reset");
    expect(result.capabilities.canCreateProgram).toBe(false);
  });
});

describe("loadProgramCreatePage", () => {
  it("allows owner create", async () => {
    const result = await loadProgramCreatePage(createSupabase(), {});
    expect(result.kind).toBe("ready");
  });

  it("denies staff create at page loader", async () => {
    pageOrgMock.mockResolvedValueOnce(readyOrg("staff"));
    const result = await loadProgramCreatePage(createSupabase(), {});
    expect(result.kind).toBe("action_unavailable");
  });
});

describe("loadProgramDetailPage", () => {
  it("returns ready detail with history", async () => {
    detailFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "owner",
        capabilities: {
          canListPrograms: true,
          canViewProgram: true,
          canViewArchivedPrograms: true,
          canCreateProgram: true,
          canUpdateProgram: true,
          canTransitionProgramStatus: true,
          canArchiveProgram: true,
          canRestoreProgram: false,
          canViewProgramHistory: true,
        },
        program: sampleProgramDetail,
        history: [sampleProgramHistory],
        historyState: { kind: "ready" },
      },
    });

    const result = await loadProgramDetailPage(createSupabase(), PROGRAM_ID, {});
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.data.program.name).toBe("Growth Lab");
    expect(result.data.history).toHaveLength(1);
    expect(result.data.history[0]?.transitionLabel).toContain("Draft");
    expect(result.data.historyState.kind).toBe("ready");
  });

  it("maps unavailable and invalid ids to program_unavailable without leaking tenant existence", async () => {
    const invalid = await loadProgramDetailPage(createSupabase(), "not-a-uuid", {});
    expect(invalid.kind).toBe("program_unavailable");
    expect(detailFoundationMock).not.toHaveBeenCalled();

    detailFoundationMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "PROGRAM_UNAVAILABLE",
        message: "This program is unavailable.",
        retryable: false,
        category: "not_found",
      },
    });
    const missing = await loadProgramDetailPage(createSupabase(), PROGRAM_ID, {});
    expect(missing.kind).toBe("program_unavailable");
  });

  it("preserves recoverable history error state", async () => {
    detailFoundationMock.mockResolvedValue({
      ok: true,
      data: {
        organizationId: ORG_ID,
        role: "admin",
        capabilities: {
          canListPrograms: true,
          canViewProgram: true,
          canViewArchivedPrograms: true,
          canCreateProgram: true,
          canUpdateProgram: true,
          canTransitionProgramStatus: true,
          canArchiveProgram: true,
          canRestoreProgram: false,
          canViewProgramHistory: true,
        },
        program: sampleProgramDetail,
        history: [],
        historyState: {
          kind: "error",
          message: "Unable to load program history.",
        },
      },
    });

    const result = await loadProgramDetailPage(createSupabase(), PROGRAM_ID, {});
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.data.historyState.kind).toBe("error");
    expect(MEMBER_ID).toBeTruthy();
  });
});
