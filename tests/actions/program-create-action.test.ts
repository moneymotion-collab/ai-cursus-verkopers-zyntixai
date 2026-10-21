import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as programActions from "@/features/programs/actions/program-actions";
import * as programMutations from "@/features/programs/server/program-mutations";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  createProgramInput,
  createProgramSuccessResult,
  ORG_ID,
  PROGRAM_ID,
  USER_ID,
  MEMBER_ID,
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
const createMutationMock = vi.mocked(programMutations.createProgramMutation);

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
  createMutationMock.mockResolvedValue(createProgramSuccessResult());
});

describe("createProgramAction", () => {
  it("creates for owner and revalidates program routes", async () => {
    const { revalidatePath } = await import("next/cache");
    const result = await programActions.createProgramAction(createProgramInput);

    expect(result.ok).toBe(true);
    expect(createMutationMock).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      role: "owner",
      input: createProgramInput,
    });
    expect(revalidatePath).toHaveBeenCalledWith("/programs");
    expect(revalidatePath).toHaveBeenCalledWith(`/programs/${PROGRAM_ID}`);
  });

  it("creates for admin", async () => {
    mockOrgRole("admin");
    const result = await programActions.createProgramAction(createProgramInput);
    expect(result.ok).toBe(true);
    expect(createMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "admin" }),
    );
  });

  it("rejects invalid name and whitespace-only name before mutation", async () => {
    const empty = await programActions.createProgramAction({
      ...createProgramInput,
      name: "   ",
    });
    expect(empty.ok).toBe(false);
    if (!empty.ok && !empty.committed) {
      expect(empty.error.code).toBe("INVALID_INPUT");
    }
    expect(createMutationMock).not.toHaveBeenCalled();
  });

  it("rejects invalid delivery mode", async () => {
    const result = await programActions.createProgramAction({
      ...createProgramInput,
      deliveryMode: "telepathy",
    });
    expect(result.ok).toBe(false);
    expect(createMutationMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported fields via strict schema", async () => {
    const result = await programActions.createProgramAction({
      ...createProgramInput,
      expected_end_date: "2026-12-01",
      status: "active",
    });
    expect(result.ok).toBe(false);
    expect(createMutationMock).not.toHaveBeenCalled();
  });

  it("rejects malicious organization input", async () => {
    const result = await programActions.createProgramAction({
      ...createProgramInput,
      organizationId: "';-org",
    });
    expect(result.ok).toBe(false);
    expect(createMutationMock).not.toHaveBeenCalled();
  });

  it("maps missing membership without invoking mutation", async () => {
    resolveOrganizationContext.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "internal",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await programActions.createProgramAction(createProgramInput);
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
      expect(JSON.stringify(result)).not.toMatch(/service_role|secret|password/i);
    }
    expect(createMutationMock).not.toHaveBeenCalled();
  });

  it("maps auth required from organization resolution", async () => {
    resolveOrganizationContext.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Sign in required",
        retryable: false,
        category: "auth",
      },
    });

    const result = await programActions.createProgramAction(createProgramInput);
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("propagates staff denial from mutation service", async () => {
    mockOrgRole("staff");
    createMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "create",
      committed: false,
      error: {
        code: "INSUFFICIENT_ROLE",
        message: "You do not have permission to perform this action.",
        retryable: false,
        category: "permission",
      },
    });

    const result = await programActions.createProgramAction(createProgramInput);
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
  });

  it("propagates viewer denial from mutation service", async () => {
    mockOrgRole("viewer");
    createMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "create",
      committed: false,
      error: {
        code: "INSUFFICIENT_ROLE",
        message: "You do not have permission to perform this action.",
        retryable: false,
        category: "permission",
      },
    });

    const result = await programActions.createProgramAction(createProgramInput);
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
  });

  it("propagates RPC permission and validation errors", async () => {
    createMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "create",
      committed: false,
      error: {
        code: "PERMISSION_DENIED",
        message: "You do not have permission to create programs.",
        retryable: false,
        category: "permission",
      },
    });
    const permission = await programActions.createProgramAction(createProgramInput);
    expect(permission.ok).toBe(false);

    createMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "create",
      committed: false,
      error: {
        code: "INVALID_INPUT",
        message: "Please correct the highlighted fields and try again.",
        retryable: false,
        category: "validation",
        fieldErrors: { name: "Program name is required." },
      },
    });
    const validation = await programActions.createProgramAction(createProgramInput);
    expect(validation.ok).toBe(false);
    if (!validation.ok && !validation.committed) {
      expect(validation.error.fieldErrors?.name).toBeTruthy();
    }
  });

  it("propagates unexpected RPC errors without secrets", async () => {
    createMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "create",
      committed: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "Something went wrong. Please try again.",
        retryable: true,
        category: "server",
      },
    });

    const result = await programActions.createProgramAction(createProgramInput);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/apiKey|service_role|Bearer /i);
  });

  it("returns typed success with program identity", async () => {
    const result = await programActions.createProgramAction(createProgramInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.programId).toBe(PROGRAM_ID);
    expect(result.program.name).toBe("Growth Lab");
    expect(result.refreshHints.list).toBe(true);
  });
});
