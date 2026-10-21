import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  archiveProgramMutation,
  restoreProgramMutation,
  transitionProgramStatusMutation,
  updateProgramMutation,
} from "@/features/programs/server/program-mutations";
import {
  callArchiveProgramRpc,
  callRestoreProgramRpc,
  callTransitionProgramStatusRpc,
  callUpdateProgramRpc,
} from "@/features/programs/server/program-rpc-adapters";
import { getProgramById } from "@/features/programs/server/program-read-queries";
import {
  archiveProgramInput,
  ORG_ID,
  PROGRAM_ID,
  restoreProgramInput,
  sampleArchivedProgramDetail,
  sampleProgramDetail,
  transitionProgramInput,
  updateProgramInput,
} from "../helpers/program-test-fixtures";

vi.mock("@/features/programs/server/program-rpc-adapters", () => ({
  callCreateProgramRpc: vi.fn(),
  callUpdateProgramRpc: vi.fn(),
  callTransitionProgramStatusRpc: vi.fn(),
  callArchiveProgramRpc: vi.fn(),
  callRestoreProgramRpc: vi.fn(),
}));

vi.mock("@/features/programs/server/program-read-queries", () => ({
  getProgramById: vi.fn(),
}));

const updateRpcMock = vi.mocked(callUpdateProgramRpc);
const transitionRpcMock = vi.mocked(callTransitionProgramStatusRpc);
const archiveRpcMock = vi.mocked(callArchiveProgramRpc);
const restoreRpcMock = vi.mocked(callRestoreProgramRpc);
const getProgramByIdMock = vi.mocked(getProgramById);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
  getProgramByIdMock.mockResolvedValue({ ok: true, data: sampleProgramDetail });
  updateRpcMock.mockResolvedValue({ ok: true, programId: PROGRAM_ID });
  transitionRpcMock.mockResolvedValue({ ok: true, programId: PROGRAM_ID });
  archiveRpcMock.mockResolvedValue({ ok: true, programId: PROGRAM_ID });
  restoreRpcMock.mockResolvedValue({ ok: true, programId: PROGRAM_ID });
});

describe("updateProgramMutation", () => {
  it("allows owner and admin update through update_program RPC", async () => {
    for (const role of ["owner", "admin"] as const) {
      updateRpcMock.mockClear();
      const result = await updateProgramMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: updateProgramInput,
      });
      expect(result.ok).toBe(true);
      expect(updateRpcMock).toHaveBeenCalledWith({
        supabase: expect.anything(),
        organizationId: ORG_ID,
        input: updateProgramInput,
      });
    }
  });

  it("denies staff and viewer before RPC", async () => {
    for (const role of ["staff", "viewer"] as const) {
      updateRpcMock.mockClear();
      const result = await updateProgramMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: updateProgramInput,
      });
      expect(result.ok).toBe(false);
      if (!result.ok && !result.committed) {
        expect(result.error.code).toBe("INSUFFICIENT_ROLE");
      }
      expect(updateRpcMock).not.toHaveBeenCalled();
    }
  });

  it("rejects archived program update before RPC", async () => {
    getProgramByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedProgramDetail,
    });

    const result = await updateProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: updateProgramInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ARCHIVED_RECORD");
    }
    expect(updateRpcMock).not.toHaveBeenCalled();
  });

  it("rejects whitespace-only name and unavailable program", async () => {
    const invalid = await updateProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: { ...updateProgramInput, name: "   " },
    });
    expect(invalid.ok).toBe(false);
    expect(updateRpcMock).not.toHaveBeenCalled();

    getProgramByIdMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "PROGRAM_UNAVAILABLE",
        message: "Program not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });
    const missing = await updateProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: updateProgramInput,
    });
    expect(missing.ok).toBe(false);
    expect(updateRpcMock).not.toHaveBeenCalled();
  });
});

describe("transitionProgramStatusMutation", () => {
  it("allows owner and admin transitions through transition_program_status RPC", async () => {
    for (const role of ["owner", "admin"] as const) {
      transitionRpcMock.mockClear();
      const result = await transitionProgramStatusMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: transitionProgramInput,
      });
      expect(result.ok).toBe(true);
      expect(transitionRpcMock).toHaveBeenCalledWith({
        supabase: expect.anything(),
        organizationId: ORG_ID,
        input: transitionProgramInput,
      });
    }
  });

  it("denies staff and viewer before RPC", async () => {
    for (const role of ["staff", "viewer"] as const) {
      transitionRpcMock.mockClear();
      const result = await transitionProgramStatusMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: transitionProgramInput,
      });
      expect(result.ok).toBe(false);
      if (!result.ok && !result.committed) {
        expect(result.error.code).toBe("INSUFFICIENT_ROLE");
      }
      expect(transitionRpcMock).not.toHaveBeenCalled();
    }
  });

  it("rejects archived transitions and maps invalid RPC transitions", async () => {
    getProgramByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedProgramDetail,
    });
    const archived = await transitionProgramStatusMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: transitionProgramInput,
    });
    expect(archived.ok).toBe(false);
    if (!archived.ok && !archived.committed) {
      expect(archived.error.code).toBe("ARCHIVED_RECORD");
    }
    expect(transitionRpcMock).not.toHaveBeenCalled();

    transitionRpcMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "TRANSITION_NOT_ALLOWED",
        message: "This status change is not allowed.",
        retryable: false,
        category: "validation",
      },
    });
    const invalid = await transitionProgramStatusMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: { ...transitionProgramInput, toStatus: "paused" },
    });
    expect(invalid.ok).toBe(false);
    if (!invalid.ok && !invalid.committed) {
      expect(invalid.error.code).toBe("TRANSITION_NOT_ALLOWED");
    }
  });

  it("maps repeated/stale no-op transitions as invalid state requiring refresh", async () => {
    transitionRpcMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "INVALID_STATE",
        message: "This program changed and must be reloaded.",
        retryable: false,
        category: "conflict",
      },
    });

    const result = await transitionProgramStatusMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: transitionProgramInput,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INVALID_STATE");
      expect(result.error.refreshRequired).toBe(true);
    }
  });
});

describe("archiveProgramMutation", () => {
  it("allows owner and admin archive", async () => {
    for (const role of ["owner", "admin"] as const) {
      archiveRpcMock.mockClear();
      const result = await archiveProgramMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: archiveProgramInput,
      });
      expect(result.ok).toBe(true);
      expect(archiveRpcMock).toHaveBeenCalled();
    }
  });

  it("denies staff and viewer before RPC", async () => {
    for (const role of ["staff", "viewer"] as const) {
      archiveRpcMock.mockClear();
      const result = await archiveProgramMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: archiveProgramInput,
      });
      expect(result.ok).toBe(false);
      if (!result.ok && !result.committed) {
        expect(result.error.code).toBe("INSUFFICIENT_ROLE");
      }
      expect(archiveRpcMock).not.toHaveBeenCalled();
    }
  });

  it("maps open-enrollment archive block and repeated archive conflicts", async () => {
    archiveRpcMock.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ARCHIVE_BLOCKED_OPEN_ENROLLMENTS",
        message: "Cannot archive a program that still has open enrollments.",
        retryable: false,
        category: "conflict",
      },
    });
    const blocked = await archiveProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: archiveProgramInput,
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok && !blocked.committed) {
      expect(blocked.error.code).toBe("ARCHIVE_BLOCKED_OPEN_ENROLLMENTS");
    }

    getProgramByIdMock.mockResolvedValueOnce({
      ok: true,
      data: sampleArchivedProgramDetail,
    });
    const alreadyArchived = await archiveProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: archiveProgramInput,
    });
    expect(alreadyArchived.ok).toBe(false);
    expect(archiveRpcMock).toHaveBeenCalledTimes(1);
  });
});

describe("restoreProgramMutation", () => {
  it("allows owner and admin restore for archived programs", async () => {
    getProgramByIdMock.mockResolvedValue({
      ok: true,
      data: sampleArchivedProgramDetail,
    });

    for (const role of ["owner", "admin"] as const) {
      restoreRpcMock.mockClear();
      const result = await restoreProgramMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: restoreProgramInput,
      });
      expect(result.ok).toBe(true);
      expect(restoreRpcMock).toHaveBeenCalled();
    }
  });

  it("denies staff and viewer before RPC", async () => {
    getProgramByIdMock.mockResolvedValue({
      ok: true,
      data: sampleArchivedProgramDetail,
    });

    for (const role of ["staff", "viewer"] as const) {
      restoreRpcMock.mockClear();
      const result = await restoreProgramMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: restoreProgramInput,
      });
      expect(result.ok).toBe(false);
      if (!result.ok && !result.committed) {
        expect(result.error.code).toBe("INSUFFICIENT_ROLE");
      }
      expect(restoreRpcMock).not.toHaveBeenCalled();
    }
  });

  it("denies restore when program is not archived", async () => {
    const result = await restoreProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: restoreProgramInput,
    });
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
    expect(restoreRpcMock).not.toHaveBeenCalled();
  });
});
