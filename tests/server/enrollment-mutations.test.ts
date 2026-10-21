import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  archiveEnrollmentMutation,
  createEnrollmentMutation,
  restoreEnrollmentMutation,
  resolveVerifiedEnrollmentRole,
  transitionEnrollmentStatusMutation,
  updateEnrollmentOwnerMetadataMutation,
} from "@/features/enrollments/server/enrollment-mutations";
import {
  callArchiveEnrollmentRpc,
  callCreateEnrollmentRpc,
  callRestoreEnrollmentRpc,
  callTransitionEnrollmentStatusRpc,
  callUpdateEnrollmentOwnerMetadata,
} from "@/features/enrollments/server/enrollment-rpc-adapters";
import { getEnrollmentById } from "@/features/enrollments/server/enrollment-read-queries";
import {
  archiveEnrollmentInput,
  createEnrollmentInput,
  ENROLLMENT_ID,
  ORG_ID,
  restoreEnrollmentInput,
  sampleArchivedEnrollmentDetail,
  sampleEnrollmentDetail,
  transitionEnrollmentInput,
  updateOwnerMetadataInput,
} from "../helpers/enrollment-test-fixtures";

vi.mock("@/features/enrollments/server/enrollment-rpc-adapters", () => ({
  callCreateEnrollmentRpc: vi.fn(),
  callTransitionEnrollmentStatusRpc: vi.fn(),
  callArchiveEnrollmentRpc: vi.fn(),
  callRestoreEnrollmentRpc: vi.fn(),
  callUpdateEnrollmentOwnerMetadata: vi.fn(),
}));

vi.mock("@/features/enrollments/server/enrollment-read-queries", () => ({
  getEnrollmentById: vi.fn(),
}));

const createRpcMock = vi.mocked(callCreateEnrollmentRpc);
const transitionRpcMock = vi.mocked(callTransitionEnrollmentStatusRpc);
const archiveRpcMock = vi.mocked(callArchiveEnrollmentRpc);
const restoreRpcMock = vi.mocked(callRestoreEnrollmentRpc);
const updateOwnerMetadataRpcMock = vi.mocked(callUpdateEnrollmentOwnerMetadata);
const getEnrollmentByIdMock = vi.mocked(getEnrollmentById);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
  getEnrollmentByIdMock.mockResolvedValue({ ok: true, data: sampleEnrollmentDetail });
  createRpcMock.mockResolvedValue({ ok: true, enrollmentId: ENROLLMENT_ID });
  transitionRpcMock.mockResolvedValue({ ok: true, enrollmentId: ENROLLMENT_ID });
  archiveRpcMock.mockResolvedValue({ ok: true, enrollmentId: ENROLLMENT_ID });
  restoreRpcMock.mockResolvedValue({ ok: true, enrollmentId: ENROLLMENT_ID });
  updateOwnerMetadataRpcMock.mockResolvedValue({ ok: true, enrollmentId: ENROLLMENT_ID });
});

describe("createEnrollmentMutation", () => {
  it("allows owner, admin, and staff to create through create_enrollment RPC only", async () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      createRpcMock.mockClear();
      const result = await createEnrollmentMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: createEnrollmentInput,
      });
      expect(result.ok).toBe(true);
      expect(createRpcMock).toHaveBeenCalledWith({
        supabase: expect.anything(),
        organizationId: ORG_ID,
        input: createEnrollmentInput,
      });
    }
  });

  it("denies viewer before calling the RPC", async () => {
    const result = await createEnrollmentMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "viewer",
      input: createEnrollmentInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(createRpcMock).not.toHaveBeenCalled();
  });

  it("rejects invalid input before the permission check and the RPC", async () => {
    const result = await createEnrollmentMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: { ...createEnrollmentInput, customerId: "not-a-uuid" },
    });

    expect(result.ok).toBe(false);
    expect(createRpcMock).not.toHaveBeenCalled();
  });
});

describe("updateEnrollmentOwnerMetadataMutation", () => {
  it("allows owner, admin, and staff on a non-archived enrollment", async () => {
    for (const role of ["owner", "admin", "staff"] as const) {
      updateOwnerMetadataRpcMock.mockClear();
      const result = await updateEnrollmentOwnerMetadataMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: updateOwnerMetadataInput,
      });
      expect(result.ok).toBe(true);
      expect(updateOwnerMetadataRpcMock).toHaveBeenCalled();
    }
  });

  it("denies viewer before calling the RPC", async () => {
    const result = await updateEnrollmentOwnerMetadataMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "viewer",
      input: updateOwnerMetadataInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(updateOwnerMetadataRpcMock).not.toHaveBeenCalled();
  });

  it("denies staff on an archived enrollment with ARCHIVED_RECORD before the RPC", async () => {
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });

    const result = await updateEnrollmentOwnerMetadataMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      input: updateOwnerMetadataInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ARCHIVED_RECORD");
    }
    expect(updateOwnerMetadataRpcMock).not.toHaveBeenCalled();
  });
});

describe("transitionEnrollmentStatusMutation", () => {
  it("allows staff to transition a non-archived enrollment", async () => {
    const result = await transitionEnrollmentStatusMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      input: transitionEnrollmentInput,
    });

    expect(result.ok).toBe(true);
    expect(transitionRpcMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_ID,
      input: transitionEnrollmentInput,
    });
  });

  it("denies viewer before calling the RPC", async () => {
    const result = await transitionEnrollmentStatusMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "viewer",
      input: transitionEnrollmentInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(transitionRpcMock).not.toHaveBeenCalled();
  });

  it("still forwards a database-invalid transition to the RPC once the permission gate passes", async () => {
    transitionRpcMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "TRANSITION_NOT_ALLOWED",
        message: "This status change is not allowed.",
        retryable: false,
        category: "validation",
      },
    });

    const result = await transitionEnrollmentStatusMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: { ...transitionEnrollmentInput, toStatus: "pending" as const },
    });

    expect(transitionRpcMock).toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("TRANSITION_NOT_ALLOWED");
    }
  });

  it("rejects a transition on an archived enrollment before the RPC", async () => {
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });

    const result = await transitionEnrollmentStatusMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: transitionEnrollmentInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ARCHIVED_RECORD");
    }
    expect(transitionRpcMock).not.toHaveBeenCalled();
  });
});

describe("archiveEnrollmentMutation", () => {
  it("denies staff before calling the RPC", async () => {
    const result = await archiveEnrollmentMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      input: archiveEnrollmentInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(archiveRpcMock).not.toHaveBeenCalled();
  });

  it("allows owner and admin to archive", async () => {
    for (const role of ["owner", "admin"] as const) {
      archiveRpcMock.mockClear();
      const result = await archiveEnrollmentMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: archiveEnrollmentInput,
      });
      expect(result.ok).toBe(true);
      expect(archiveRpcMock).toHaveBeenCalled();
    }
  });
});

describe("restoreEnrollmentMutation", () => {
  beforeEach(() => {
    getEnrollmentByIdMock.mockResolvedValue({
      ok: true,
      data: sampleArchivedEnrollmentDetail,
    });
  });

  it("denies staff before calling the RPC", async () => {
    const result = await restoreEnrollmentMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "staff",
      input: restoreEnrollmentInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(restoreRpcMock).not.toHaveBeenCalled();
  });

  it("allows owner to restore an archived enrollment", async () => {
    const result = await restoreEnrollmentMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: restoreEnrollmentInput,
    });

    expect(result.ok).toBe(true);
    expect(restoreRpcMock).toHaveBeenCalled();
  });

  it("denies owner restore when the enrollment is not archived", async () => {
    getEnrollmentByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleEnrollmentDetail,
    });

    const result = await restoreEnrollmentMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: restoreEnrollmentInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(restoreRpcMock).not.toHaveBeenCalled();
  });
});

describe("resolveVerifiedEnrollmentRole", () => {
  it("passes through known roles and fails closed for unknown, null, or undefined roles", () => {
    expect(resolveVerifiedEnrollmentRole("owner")).toBe("owner");
    expect(resolveVerifiedEnrollmentRole("staff")).toBe("staff");
    expect(resolveVerifiedEnrollmentRole("superuser")).toBeNull();
    expect(resolveVerifiedEnrollmentRole(null)).toBeNull();
    expect(resolveVerifiedEnrollmentRole(undefined)).toBeNull();
  });
});

describe("RPC-only mutation boundary", () => {
  it("never performs a direct insert or delete on enrollments; create uses the RPC only", async () => {
    const supabase = {
      from: vi.fn(() => {
        throw new Error("enrollment-mutations must not call supabase.from directly for create");
      }),
    } as unknown as SupabaseClient<Database>;

    const result = await createEnrollmentMutation({
      supabase,
      organizationId: ORG_ID,
      role: "owner",
      input: createEnrollmentInput,
    });

    expect(result.ok).toBe(true);
    expect(createRpcMock).toHaveBeenCalled();
  });
});
