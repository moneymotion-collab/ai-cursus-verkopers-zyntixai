import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadProgramEditPage } from "@/features/programs/ui/load-program-edit-page";
import {
  loadProgramArchivePage,
  loadProgramRestorePage,
  loadProgramStatusPage,
} from "@/features/programs/ui/load-program-lifecycle-workflow-page";
import { resolveProgramPageOrganization } from "@/features/programs/server/resolve-program-page-organization";
import { getProgramById } from "@/features/programs/server/program-read-queries";
import {
  ORG_ID,
  PROGRAM_ID,
  sampleArchivedProgramDetail,
  sampleProgramDetail,
} from "../helpers/program-test-fixtures";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";

vi.mock("@/features/programs/server/resolve-program-page-organization", () => ({
  resolveProgramPageOrganization: vi.fn(),
}));

vi.mock("@/features/programs/server/program-read-queries", () => ({
  getProgramById: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveProgramPageOrganization);
const getProgramByIdMock = vi.mocked(getProgramById);

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
    moduleAccess: mockKnowledgeProductModuleAccess(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("owner"));
  getProgramByIdMock.mockResolvedValue({ ok: true, data: sampleProgramDetail });
});

describe("loadProgramEditPage", () => {
  it("loads edit page for owner with current program values", async () => {
    const result = await loadProgramEditPage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.program.name).toBe("Growth Lab");
    expect(result.organizationId).toBe(ORG_ID);
  });

  it("denies staff and marks archived programs unavailable for edit", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    const staff = await loadProgramEditPage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(staff.kind).toBe("action_unavailable");

    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    getProgramByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedProgramDetail,
    });
    const archived = await loadProgramEditPage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(archived.kind).toBe("action_unavailable");
    if (archived.kind === "action_unavailable") {
      expect(archived.message).toContain("Archived");
    }
  });

  it("returns unavailable for invalid and missing programs", async () => {
    const invalid = await loadProgramEditPage(createSupabase(), "bad-id", {
      org: ORG_ID,
    });
    expect(invalid.kind).toBe("invalid_program");

    getProgramByIdMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "PROGRAM_UNAVAILABLE",
        message: "Program not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });
    const missing = await loadProgramEditPage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(missing.kind).toBe("program_unavailable");
  });
});

describe("loadProgramStatusPage", () => {
  it("returns only allowed targets for draft programs", async () => {
    const result = await loadProgramStatusPage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.allowedTargets).toEqual(["active", "retired"]);
  });

  it("denies viewer status workflow", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    const result = await loadProgramStatusPage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("action_unavailable");
  });
});

describe("loadProgramArchivePage and loadProgramRestorePage", () => {
  it("allows owner archive and restore according to archive state", async () => {
    const archive = await loadProgramArchivePage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(archive.kind).toBe("ready");

    getProgramByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedProgramDetail,
    });
    const restore = await loadProgramRestorePage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(restore.kind).toBe("ready");
  });

  it("denies staff archive/restore and non-archived restore", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    const archive = await loadProgramArchivePage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(archive.kind).toBe("action_unavailable");

    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    const restore = await loadProgramRestorePage(createSupabase(), PROGRAM_ID, {
      org: ORG_ID,
    });
    expect(restore.kind).toBe("action_unavailable");
  });
});
