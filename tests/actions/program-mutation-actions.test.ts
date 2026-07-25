import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as programActions from "@/features/programs/actions/program-actions";
import * as programMutations from "@/features/programs/server/program-mutations";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  archiveProgramInput,
  archiveProgramSuccessResult,
  MEMBER_ID,
  ORG_ID,
  PROGRAM_ID,
  restoreProgramInput,
  restoreProgramSuccessResult,
  transitionProgramInput,
  transitionProgramSuccessResult,
  updateProgramInput,
  updateProgramSuccessResult,
  USER_ID,
} from "../helpers/program-test-fixtures";

const mockSupabase = { auth: { getUser: vi.fn() } } as unknown as SupabaseClient<Database>;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

vi.mock("@/features/programs/server/program-mutations", () => ({
  createProgramMutation: vi.fn(),
  updateProgramMutation: vi.fn(),
  transitionProgramStatusMutation: vi.fn(),
  archiveProgramMutation: vi.fn(),
  restoreProgramMutation: vi.fn(),
  resolveVerifiedProgramRole: (role: string) =>
    role === "owner" || role === "admin" || role === "staff" || role === "viewer" ? role : null,
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);
const updateMutationMock = vi.mocked(programMutations.updateProgramMutation);
const transitionMutationMock = vi.mocked(programMutations.transitionProgramStatusMutation);
const archiveMutationMock = vi.mocked(programMutations.archiveProgramMutation);
const restoreMutationMock = vi.mocked(programMutations.restoreProgramMutation);

function mockOrgRole(role: "owner" | "admin" | "staff" | "viewer") {
  resolveOrganizationContext.mockResolvedValue({
    ok: true,
    context: {
      organizationId: ORG_ID,
      membershipId: MEMBER_ID,
      role,
      userId: USER_ID,
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  serverClientMock.mockResolvedValue(mockSupabase);
  mockOrgRole("owner");
  updateMutationMock.mockResolvedValue(updateProgramSuccessResult());
  transitionMutationMock.mockResolvedValue(transitionProgramSuccessResult());
  archiveMutationMock.mockResolvedValue(archiveProgramSuccessResult());
  restoreMutationMock.mockResolvedValue(restoreProgramSuccessResult());
});

describe("updateProgramAction", () => {
  it("updates for owner and admin and revalidates routes", async () => {
    const { revalidatePath } = await import("next/cache");

    for (const role of ["owner", "admin"] as const) {
      mockOrgRole(role);
      updateMutationMock.mockClear();
      const result = await programActions.updateProgramAction(updateProgramInput);
      expect(result.ok).toBe(true);
      expect(updateMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({ role, organizationId: ORG_ID }),
      );
    }

    expect(revalidatePath).toHaveBeenCalledWith("/programs");
    expect(revalidatePath).toHaveBeenCalledWith(`/programs/${PROGRAM_ID}`);
  });

  it("rejects invalid program id and malicious organization before mutation", async () => {
    const invalidId = await programActions.updateProgramAction({
      ...updateProgramInput,
      programId: "not-a-uuid",
    });
    expect(invalidId.ok).toBe(false);
    expect(updateMutationMock).not.toHaveBeenCalled();

    const maliciousOrg = await programActions.updateProgramAction({
      ...updateProgramInput,
      organizationId: "foreign-org",
    });
    expect(maliciousOrg.ok).toBe(false);
    expect(updateMutationMock).not.toHaveBeenCalled();
  });

  it("uses membership-derived organization context, not browser role", async () => {
    mockOrgRole("staff");
    updateMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "update",
      committed: false,
      error: {
        code: "INSUFFICIENT_ROLE",
        message: "You do not have permission to perform this action.",
        retryable: false,
        category: "permission",
      },
    });

    const result = await programActions.updateProgramAction(updateProgramInput);
    expect(result.ok).toBe(false);
    expect(updateMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "staff", organizationId: ORG_ID }),
    );
  });
});

describe("transitionProgramStatusAction", () => {
  it("transitions for owner and rejects invalid status values", async () => {
    const ok = await programActions.transitionProgramStatusAction(transitionProgramInput);
    expect(ok.ok).toBe(true);
    expect(transitionMutationMock).toHaveBeenCalled();

    const invalid = await programActions.transitionProgramStatusAction({
      ...transitionProgramInput,
      toStatus: "teleported",
    });
    expect(invalid.ok).toBe(false);
    expect(transitionMutationMock).not.toHaveBeenCalledTimes(2);
  });
});

describe("archiveProgramAction and restoreProgramAction", () => {
  it("archives and restores for owner with revalidation", async () => {
    const { revalidatePath } = await import("next/cache");

    const archived = await programActions.archiveProgramAction(archiveProgramInput);
    expect(archived.ok).toBe(true);
    expect(archiveMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "owner", input: archiveProgramInput }),
    );

    const restored = await programActions.restoreProgramAction(restoreProgramInput);
    expect(restored.ok).toBe(true);
    expect(restoreMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "owner", input: restoreProgramInput }),
    );

    expect(revalidatePath).toHaveBeenCalledWith("/programs");
    expect(revalidatePath).toHaveBeenCalledWith(`/programs/${PROGRAM_ID}`);
  });

  it("maps missing membership without invoking mutations", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "internal",
        retryable: false,
        category: "not_found",
      },
    });

    const archive = await programActions.archiveProgramAction(archiveProgramInput);
    const restore = await programActions.restoreProgramAction(restoreProgramInput);

    expect(archive.ok).toBe(false);
    expect(restore.ok).toBe(false);
    expect(archiveMutationMock).not.toHaveBeenCalled();
    expect(restoreMutationMock).not.toHaveBeenCalled();
  });
});
