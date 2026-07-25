import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  loadEnrollmentDetailFoundation,
  loadEnrollmentsListFoundation,
} from "@/features/enrollments/server/load-enrollment-foundations";
import {
  getEnrollmentById,
  listEnrollments,
  listEnrollmentStatusHistory,
} from "@/features/enrollments/server/enrollment-read-queries";
import {
  ORG_ID,
  ENROLLMENT_ID,
  sampleArchivedEnrollmentDetail,
  sampleEnrollmentDetail,
  sampleEnrollmentHistory,
  sampleEnrollmentListItem,
} from "../helpers/enrollment-test-fixtures";

vi.mock("@/features/enrollments/server/enrollment-read-queries", () => ({
  listEnrollments: vi.fn(),
  getEnrollmentById: vi.fn(),
  listEnrollmentStatusHistory: vi.fn(),
}));

const listEnrollmentsMock = vi.mocked(listEnrollments);
const getEnrollmentByIdMock = vi.mocked(getEnrollmentById);
const historyMock = vi.mocked(listEnrollmentStatusHistory);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("loadEnrollmentsListFoundation", () => {
  it("returns typed list result with staff create capability", async () => {
    listEnrollmentsMock.mockResolvedValue({
      ok: true,
      data: {
        items: [sampleEnrollmentListItem],
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

    const result = await loadEnrollmentsListFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      filters: { search: "acme" },
      pagination: { page: 1, pageSize: 25 },
      sort: { field: "status", direction: "asc" },
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.capabilities.canCreateEnrollment).toBe(true);
    expect(result.data.capabilities.canArchiveEnrollment).toBe(false);
    expect(result.data.result.items[0]?.id).toBe(sampleEnrollmentListItem.id);
    expect(result.data.sort).toEqual({ field: "status", direction: "asc" });
    expect(result.data.filters.includeArchived).toBe(false);
  });

  it("propagates read adapter failures", async () => {
    listEnrollmentsMock.mockResolvedValue({
      ok: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "You don't have permission for this action.",
        retryable: false,
        category: "permission",
      },
    });

    const result = await loadEnrollmentsListFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "viewer",
    });

    expect(result.ok).toBe(false);
  });
});

describe("loadEnrollmentDetailFoundation", () => {
  it("loads enrollment and history for permitted roles", async () => {
    getEnrollmentByIdMock.mockResolvedValue({ ok: true, data: sampleEnrollmentDetail });
    historyMock.mockResolvedValue({ ok: true, data: [sampleEnrollmentHistory] });

    const result = await loadEnrollmentDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "admin",
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.historyState.kind).toBe("ready");
    expect(result.data.history).toHaveLength(1);
    expect(result.data.enrollment.id).toBe(ENROLLMENT_ID);
  });

  it("returns empty history state when no events exist", async () => {
    getEnrollmentByIdMock.mockResolvedValue({ ok: true, data: sampleEnrollmentDetail });
    historyMock.mockResolvedValue({ ok: true, data: [] });

    const result = await loadEnrollmentDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.historyState.kind).toBe("empty");
  });

  it("keeps enrollment readable when history fails independently", async () => {
    getEnrollmentByIdMock.mockResolvedValue({ ok: true, data: sampleEnrollmentDetail });
    historyMock.mockResolvedValue({
      ok: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "Unable to load enrollment history.",
        retryable: true,
        category: "server",
      },
    });

    const result = await loadEnrollmentDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.historyState.kind).toBe("error");
    expect(result.data.enrollment.id).toBe(ENROLLMENT_ID);
  });

  it("hides history and denies detail access for a viewer on an archived enrollment", async () => {
    getEnrollmentByIdMock.mockResolvedValue({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });

    const result = await loadEnrollmentDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "viewer",
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ENROLLMENT_UNAVAILABLE");
    expect(historyMock).not.toHaveBeenCalled();
  });

  it("denies staff viewing archived enrollments before loading history", async () => {
    getEnrollmentByIdMock.mockResolvedValue({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });

    const result = await loadEnrollmentDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.code).toBe("ENROLLMENT_UNAVAILABLE");
    expect(historyMock).not.toHaveBeenCalled();
  });

  it("allows owner/admin to view archived enrollments and their history", async () => {
    getEnrollmentByIdMock.mockResolvedValue({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });
    historyMock.mockResolvedValue({ ok: true, data: [sampleEnrollmentHistory] });

    const result = await loadEnrollmentDetailFoundation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      enrollmentId: ENROLLMENT_ID,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.capabilities.canRestoreEnrollment).toBe(true);
    expect(result.data.historyState.kind).toBe("ready");
  });
});
