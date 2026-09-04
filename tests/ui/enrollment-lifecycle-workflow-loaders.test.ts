import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { loadEnrollmentEditPage } from "@/features/enrollments/ui/load-enrollment-edit-page";
import {
  loadEnrollmentArchivePage,
  loadEnrollmentRestorePage,
  loadEnrollmentStatusPage,
} from "@/features/enrollments/ui/load-enrollment-lifecycle-workflow-page";
import { resolveEnrollmentPageOrganization } from "@/features/enrollments/server/resolve-enrollment-page-organization";
import { getEnrollmentById } from "@/features/enrollments/server/enrollment-read-queries";
import { loadEligibleEnrollmentMembers } from "@/features/enrollments/server/load-enrollment-create-options";
import {
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  sampleArchivedEnrollmentDetail,
  sampleEnrollmentDetail,
} from "../helpers/enrollment-test-fixtures";
import { mockKnowledgeProductModuleAccess } from "../features/product-access/module-access-fixtures";

vi.mock("@/features/enrollments/server/resolve-enrollment-page-organization", () => ({
  resolveEnrollmentPageOrganization: vi.fn(),
}));

vi.mock("@/features/enrollments/server/enrollment-read-queries", () => ({
  getEnrollmentById: vi.fn(),
}));

vi.mock("@/features/enrollments/server/load-enrollment-create-options", () => ({
  loadEligibleEnrollmentMembers: vi.fn(),
}));

const pageOrgMock = vi.mocked(resolveEnrollmentPageOrganization);
const getEnrollmentByIdMock = vi.mocked(getEnrollmentById);
const loadMembersMock = vi.mocked(loadEligibleEnrollmentMembers);

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

const terminalNotArchivedEnrollment = {
  ...sampleEnrollmentDetail,
  status: "completed" as const,
  statusLabel: "Completed",
  derived: {
    isArchived: false,
    isOpen: false,
    isTerminal: true,
    allowedTransitions: [],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  pageOrgMock.mockResolvedValue(readyOrg("owner"));
  getEnrollmentByIdMock.mockResolvedValue({ ok: true, data: sampleEnrollmentDetail });
  loadMembersMock.mockResolvedValue({
    options: [{ value: MEMBER_ID, label: "Jordan Lee" }],
    capped: false,
    failed: false,
  });
});

describe("loadEnrollmentEditPage", () => {
  it("loads owner-reassignment edit page for owner with eligible members", async () => {
    const result = await loadEnrollmentEditPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.enrollment.id).toBe(ENROLLMENT_ID);
    expect(result.organizationId).toBe(ORG_ID);
    expect(result.members).toHaveLength(1);
  });

  it("allows staff to reach owner reassignment", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    const result = await loadEnrollmentEditPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("ready");
  });

  it("denies viewer and marks archived enrollments unavailable for edit", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    const viewer = await loadEnrollmentEditPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(viewer.kind).toBe("action_unavailable");

    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });
    const archived = await loadEnrollmentEditPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(archived.kind).toBe("action_unavailable");
    if (archived.kind === "action_unavailable") {
      expect(archived.message).toContain("Archived");
    }
  });

  it("returns unavailable for invalid and missing enrollments without calling member lookup", async () => {
    const invalid = await loadEnrollmentEditPage(createSupabase(), "bad-id", {
      org: ORG_ID,
    });
    expect(invalid.kind).toBe("invalid_enrollment");
    expect(loadMembersMock).not.toHaveBeenCalled();

    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ENROLLMENT_UNAVAILABLE",
        message: "Enrollment not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });
    const missing = await loadEnrollmentEditPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(missing.kind).toBe("enrollment_unavailable");
    expect(loadMembersMock).not.toHaveBeenCalled();
  });

  it("surfaces a members error without blocking the edit page", async () => {
    loadMembersMock.mockResolvedValueOnce({ options: [], capped: false, failed: true });
    const result = await loadEnrollmentEditPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.membersError).toBeDefined();
  });
});

describe("loadEnrollmentStatusPage", () => {
  it("returns only allowed targets for the current status", async () => {
    const result = await loadEnrollmentStatusPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("ready");
    if (result.kind !== "ready") return;
    expect(result.allowedTargets).toEqual(["paused", "completed", "cancelled"]);
  });

  it("denies viewer status workflow", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("viewer"));
    const result = await loadEnrollmentStatusPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("action_unavailable");
  });

  it("marks terminal (no-transition) enrollments unavailable for status change", async () => {
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: terminalNotArchivedEnrollment,
    });
    const result = await loadEnrollmentStatusPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("action_unavailable");
  });

  it("denies status workflow on archived enrollments", async () => {
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });
    const result = await loadEnrollmentStatusPage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(result.kind).toBe("action_unavailable");
  });

  it("returns invalid_enrollment for a malformed id", async () => {
    const result = await loadEnrollmentStatusPage(createSupabase(), "not-a-uuid", {
      org: ORG_ID,
    });
    expect(result.kind).toBe("invalid_enrollment");
  });
});

describe("loadEnrollmentArchivePage and loadEnrollmentRestorePage", () => {
  it("allows owner to archive a terminal, non-archived enrollment", async () => {
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: terminalNotArchivedEnrollment,
    });
    const archive = await loadEnrollmentArchivePage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(archive.kind).toBe("ready");
  });

  it("requires terminal status before archiving even for owner", async () => {
    const archive = await loadEnrollmentArchivePage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(archive.kind).toBe("action_unavailable");
  });

  it("allows owner to restore an archived enrollment", async () => {
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });
    const restore = await loadEnrollmentRestorePage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(restore.kind).toBe("ready");
  });

  it("denies staff archive/restore and denies restore on non-archived enrollments", async () => {
    pageOrgMock.mockResolvedValue(readyOrg("staff"));
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: terminalNotArchivedEnrollment,
    });
    const archive = await loadEnrollmentArchivePage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(archive.kind).toBe("action_unavailable");

    pageOrgMock.mockResolvedValue(readyOrg("owner"));
    const restore = await loadEnrollmentRestorePage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(restore.kind).toBe("action_unavailable");
  });

  it("returns invalid_enrollment/enrollment_unavailable for bad or missing ids", async () => {
    const invalid = await loadEnrollmentArchivePage(createSupabase(), "bad-id", {
      org: ORG_ID,
    });
    expect(invalid.kind).toBe("invalid_enrollment");

    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ENROLLMENT_UNAVAILABLE",
        message: "Enrollment not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });
    const missing = await loadEnrollmentRestorePage(createSupabase(), ENROLLMENT_ID, {
      org: ORG_ID,
    });
    expect(missing.kind).toBe("enrollment_unavailable");
  });
});
