import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createProgramMutation } from "@/features/programs/server/program-mutations";
import { callCreateProgramRpc } from "@/features/programs/server/program-rpc-adapters";
import { getProgramById } from "@/features/programs/server/program-read-queries";
import {
  createProgramInput,
  ORG_ID,
  PROGRAM_ID,
  sampleProgramDetail,
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

const createRpcMock = vi.mocked(callCreateProgramRpc);
const getProgramByIdMock = vi.mocked(getProgramById);

function createSupabase() {
  return {} as unknown as SupabaseClient<Database>;
}

beforeEach(() => {
  vi.clearAllMocks();
  createRpcMock.mockResolvedValue({ ok: true, programId: PROGRAM_ID });
  getProgramByIdMock.mockResolvedValue({ ok: true, data: sampleProgramDetail });
});

describe("createProgramMutation authorization and RPC", () => {
  it("allows owner create through create_program RPC", async () => {
    const result = await createProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: createProgramInput,
    });

    expect(result.ok).toBe(true);
    expect(createRpcMock).toHaveBeenCalledWith({
      supabase: expect.anything(),
      organizationId: ORG_ID,
      input: createProgramInput,
    });
  });

  it("allows admin create", async () => {
    const result = await createProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "admin",
      input: createProgramInput,
    });
    expect(result.ok).toBe(true);
  });

  it("denies staff and viewer before RPC", async () => {
    for (const role of ["staff", "viewer"] as const) {
      createRpcMock.mockClear();
      const result = await createProgramMutation({
        supabase: createSupabase(),
        organizationId: ORG_ID,
        role,
        input: createProgramInput,
      });
      expect(result.ok).toBe(false);
      if (!result.ok && !result.committed) {
        expect(result.error.code).toBe("INSUFFICIENT_ROLE");
      }
      expect(createRpcMock).not.toHaveBeenCalled();
    }
  });

  it("rejects whitespace-only name", async () => {
    const result = await createProgramMutation({
      supabase: createSupabase(),
      organizationId: ORG_ID,
      role: "owner",
      input: { ...createProgramInput, name: "   " },
    });
    expect(result.ok).toBe(false);
    expect(createRpcMock).not.toHaveBeenCalled();
  });
});
