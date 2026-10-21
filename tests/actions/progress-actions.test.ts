import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as progressActions from "@/features/progress/actions/progress-actions";
import * as progressMutations from "@/features/progress/server/progress-mutations";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  correctProgressFactInput,
  correctProgressFactSuccessResult,
  MEMBER_ID,
  ORG_ID,
  PROGRESS_FACT_ID,
  recordProgressFactInput,
  recordProgressFactSuccessResult,
  USER_ID,
  voidProgressFactInput,
  voidProgressFactSuccessResult,
} from "../helpers/progress-test-fixtures";

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

vi.mock("@/features/progress/server/progress-mutations", () => ({
  recordProgressFactMutation: vi.fn(),
  voidProgressFactMutation: vi.fn(),
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);
const recordMutationMock = vi.mocked(progressMutations.recordProgressFactMutation);
const voidMutationMock = vi.mocked(progressMutations.voidProgressFactMutation);

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
  recordMutationMock.mockResolvedValue(recordProgressFactSuccessResult());
  voidMutationMock.mockResolvedValue(voidProgressFactSuccessResult());
});

describe("recordProgressFactAction", () => {
  it("records for owner, admin, and staff and revalidates progress routes", async () => {
    const { revalidatePath } = await import("next/cache");

    for (const role of ["owner", "admin", "staff"] as const) {
      mockOrgRole(role);
      recordMutationMock.mockClear();
      const result = await progressActions.recordProgressFactAction(recordProgressFactInput);
      expect(result.ok).toBe(true);
      expect(recordMutationMock).toHaveBeenCalledWith(
        expect.objectContaining({ role, organizationId: ORG_ID }),
      );
    }

    expect(revalidatePath).toHaveBeenCalledWith("/progress");
    expect(revalidatePath).toHaveBeenCalledWith(`/progress/${PROGRESS_FACT_ID}`);
  });

  it("rejects invalid input before calling the mutation", async () => {
    const missingEnrollment = await progressActions.recordProgressFactAction({
      ...recordProgressFactInput,
      enrollmentId: "not-a-uuid",
    });
    expect(missingEnrollment.ok).toBe(false);
    expect(recordMutationMock).not.toHaveBeenCalled();

    const noPayload = await progressActions.recordProgressFactAction({
      ...recordProgressFactInput,
      title: null,
    });
    expect(noPayload.ok).toBe(false);
    expect(recordMutationMock).not.toHaveBeenCalled();
  });

  it("rejects unsupported fields via strict schema", async () => {
    const result = await progressActions.recordProgressFactAction({
      ...recordProgressFactInput,
      status: "active",
    });
    expect(result.ok).toBe(false);
    expect(recordMutationMock).not.toHaveBeenCalled();
  });

  it("never trusts client-provided organization id directly", async () => {
    resolveOrganizationContext.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "internal",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await progressActions.recordProgressFactAction({
      ...recordProgressFactInput,
      organizationId: "22222222-2222-4222-8222-222222222299",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
      expect(JSON.stringify(result)).not.toMatch(/service_role|secret|password/i);
    }
    expect(recordMutationMock).not.toHaveBeenCalled();
  });

  it("propagates mutation-level permission and refresh failures", async () => {
    recordMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "record",
      committed: false,
      error: {
        code: "INSUFFICIENT_ROLE",
        message: "You don't have permission for this action.",
        retryable: false,
        category: "permission",
      },
    });

    const denied = await progressActions.recordProgressFactAction(recordProgressFactInput);
    expect(denied.ok).toBe(false);

    const { revalidatePath } = await import("next/cache");
    vi.mocked(revalidatePath).mockClear();

    recordMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "record",
      committed: true,
      progressFactId: PROGRESS_FACT_ID,
      refreshHints: { detail: true, list: true },
      error: {
        code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
        message: "Your change was saved. Refresh to see the latest progress fact.",
        retryable: false,
        category: "server",
        refreshRequired: true,
      },
    });

    const committedFailure = await progressActions.recordProgressFactAction(
      recordProgressFactInput,
    );
    expect(committedFailure.ok).toBe(false);
    expect(revalidatePath).toHaveBeenCalledWith(`/progress/${PROGRESS_FACT_ID}`);
  });

  it("propagates unexpected errors without secrets", async () => {
    recordMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "record",
      committed: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "Something went wrong. Please try again.",
        retryable: true,
        category: "server",
      },
    });

    const result = await progressActions.recordProgressFactAction(recordProgressFactInput);
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/apiKey|service_role|Bearer /i);
  });
});

describe("voidProgressFactAction", () => {
  it("voids for an authorized role and revalidates routes", async () => {
    const { revalidatePath } = await import("next/cache");

    const result = await progressActions.voidProgressFactAction(voidProgressFactInput);
    expect(result.ok).toBe(true);
    expect(voidMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({ role: "owner", organizationId: ORG_ID, input: voidProgressFactInput }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/progress");
    expect(revalidatePath).toHaveBeenCalledWith(`/progress/${PROGRESS_FACT_ID}`);
  });

  it("rejects a missing reason before calling the mutation", async () => {
    const result = await progressActions.voidProgressFactAction({
      ...voidProgressFactInput,
      reason: "",
    });
    expect(result.ok).toBe(false);
    expect(voidMutationMock).not.toHaveBeenCalled();
  });

  it("maps missing membership without invoking the mutation", async () => {
    resolveOrganizationContext.mockResolvedValueOnce({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "internal",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await progressActions.voidProgressFactAction(voidProgressFactInput);
    expect(result.ok).toBe(false);
    expect(voidMutationMock).not.toHaveBeenCalled();
  });

  it("propagates staff denial from the mutation service", async () => {
    mockOrgRole("staff");
    voidMutationMock.mockResolvedValueOnce({
      ok: false,
      operation: "void",
      committed: false,
      error: {
        code: "INSUFFICIENT_ROLE",
        message: "You don't have permission for this action.",
        retryable: false,
        category: "permission",
      },
    });

    const result = await progressActions.voidProgressFactAction(voidProgressFactInput);
    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
  });
});

describe("correctProgressFactAction", () => {
  beforeEach(() => {
    recordMutationMock.mockResolvedValue(correctProgressFactSuccessResult());
  });

  it("calls the record mutation foundation with correctedFromFactId and revalidates routes", async () => {
    const { revalidatePath } = await import("next/cache");

    const result = await progressActions.correctProgressFactAction(correctProgressFactInput);
    expect(result.ok).toBe(true);
    expect(recordMutationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        role: "owner",
        organizationId: ORG_ID,
        input: expect.objectContaining({ correctedFromFactId: PROGRESS_FACT_ID }),
      }),
    );
    expect(revalidatePath).toHaveBeenCalledWith("/progress");
    expect(revalidatePath).toHaveBeenCalledWith(`/progress/${PROGRESS_FACT_ID}`);
  });

  it("rejects a correction missing correctedFromFactId before calling the mutation", async () => {
    const withoutCorrectedFrom: Record<string, unknown> = { ...correctProgressFactInput };
    delete withoutCorrectedFrom.correctedFromFactId;
    const result = await progressActions.correctProgressFactAction(withoutCorrectedFrom);
    expect(result.ok).toBe(false);
    expect(recordMutationMock).not.toHaveBeenCalled();
  });

  it("rejects a correction missing an idempotency key before calling the mutation", async () => {
    const result = await progressActions.correctProgressFactAction({
      ...correctProgressFactInput,
      idempotencyKey: null,
    });
    expect(result.ok).toBe(false);
    expect(recordMutationMock).not.toHaveBeenCalled();
  });
});
