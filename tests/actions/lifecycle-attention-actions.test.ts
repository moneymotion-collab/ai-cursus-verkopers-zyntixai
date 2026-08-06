import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import * as lifecycleAttentionActions from "@/features/attention/actions/lifecycle-attention-actions";
import * as attentionAdapters from "@/features/attention/server/attention-rpc-adapters";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ATTENTION_ITEM_ID,
  MEMBER_ID,
  ORG_ID,
  USER_ID,
} from "../helpers/attention-test-fixtures";

const mockSupabase = {
  auth: { getUser: vi.fn() },
} as unknown as SupabaseClient<Database>;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

vi.mock("@/features/attention/server/attention-rpc-adapters", () => ({
  acknowledgeAttentionItem: vi.fn(),
  assignAttentionItem: vi.fn(),
  updateAttentionSeverity: vi.fn(),
  resolveAttentionItem: vi.fn(),
  dismissAttentionItem: vi.fn(),
  archiveAttentionItem: vi.fn(),
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);
const acknowledgeMock = vi.mocked(attentionAdapters.acknowledgeAttentionItem);
const assignMock = vi.mocked(attentionAdapters.assignAttentionItem);
const severityMock = vi.mocked(attentionAdapters.updateAttentionSeverity);
const resolveMock = vi.mocked(attentionAdapters.resolveAttentionItem);
const dismissMock = vi.mocked(attentionAdapters.dismissAttentionItem);
const archiveMock = vi.mocked(attentionAdapters.archiveAttentionItem);

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
  acknowledgeMock.mockResolvedValue({
    ok: true,
    data: { attentionItemId: ATTENTION_ITEM_ID },
  });
  assignMock.mockResolvedValue({
    ok: true,
    data: { attentionItemId: ATTENTION_ITEM_ID },
  });
  severityMock.mockResolvedValue({
    ok: true,
    data: { attentionItemId: ATTENTION_ITEM_ID },
  });
  resolveMock.mockResolvedValue({
    ok: true,
    data: { attentionItemId: ATTENTION_ITEM_ID },
  });
  dismissMock.mockResolvedValue({
    ok: true,
    data: { attentionItemId: ATTENTION_ITEM_ID },
  });
  archiveMock.mockResolvedValue({
    ok: true,
    data: { attentionItemId: ATTENTION_ITEM_ID },
  });
});

describe("attention lifecycle server actions (B1.7.6-A)", () => {
  it("acknowledges through adapter with membership-resolved organization id and revalidates", async () => {
    const { revalidatePath } = await import("next/cache");
    const clientOrg = "99999999-9999-4999-8999-999999999999";

    const result = await lifecycleAttentionActions.acknowledgeAttentionItemAction({
      organizationId: clientOrg,
      attentionItemId: ATTENTION_ITEM_ID,
      returnPath: `/attention/${ATTENTION_ITEM_ID}`,
    });

    expect(result.ok).toBe(true);
    expect(resolveOrganizationContext).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: clientOrg,
    });
    expect(acknowledgeMock).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/attention");
    expect(revalidatePath).toHaveBeenCalledWith(`/attention/${ATTENTION_ITEM_ID}`);
    if (result.ok) {
      expect(result.returnPath).toBe(`/attention/${ATTENTION_ITEM_ID}`);
      expect(result.outcome).toBe("applied");
    }
  });

  it("rejects malformed input before adapter invocation", async () => {
    const result = await lifecycleAttentionActions.acknowledgeAttentionItemAction({
      organizationId: "bad",
      attentionItemId: ATTENTION_ITEM_ID,
    });
    expect(result.ok).toBe(false);
    expect(acknowledgeMock).not.toHaveBeenCalled();
    expect(resolveOrganizationContext).not.toHaveBeenCalled();
  });

  it("maps organization resolution failures without calling adapters", async () => {
    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required.",
        retryable: false,
        category: "auth",
      },
    });

    const result = await lifecycleAttentionActions.resolveAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      resolutionReason: "Done",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
    expect(resolveMock).not.toHaveBeenCalled();
  });

  it("assigns and unassigns through the same adapter", async () => {
    const assignResult = await lifecycleAttentionActions.assignAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      assigneeMemberId: MEMBER_ID,
    });
    expect(assignResult.ok).toBe(true);
    if (assignResult.ok) {
      expect(assignResult.action).toBe("assign");
    }

    const unassignResult = await lifecycleAttentionActions.assignAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      assigneeMemberId: null,
    });
    expect(unassignResult.ok).toBe(true);
    if (unassignResult.ok) {
      expect(unassignResult.action).toBe("unassign");
    }
    expect(assignMock).toHaveBeenCalledTimes(2);
  });

  it("normalizes adapter failures and rejects unsafe return paths", async () => {
    acknowledgeMock.mockResolvedValue({
      ok: false,
      error: {
        code: "INVALID_STATE",
        message: "This attention status change is not allowed.",
        retryable: false,
        category: "conflict",
        refreshRequired: true,
      },
    });

    const result = await lifecycleAttentionActions.acknowledgeAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      returnPath: "https://evil.example/x",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INVALID_STATE");
      expect(result.returnPath).toBe(`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`);
      expect(result.error.message).not.toMatch(/rpc|sql|postgres/i);
    }
  });

  it("updates severity, resolves, dismisses, and archives via adapters", async () => {
    await lifecycleAttentionActions.updateAttentionSeverityAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      severity: "low",
    });
    await lifecycleAttentionActions.resolveAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      resolutionReason: "Completed follow-up",
    });
    await lifecycleAttentionActions.dismissAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
      dismissalReason: "Not needed",
    });
    await lifecycleAttentionActions.archiveAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
    });

    expect(severityMock).toHaveBeenCalledOnce();
    expect(resolveMock).toHaveBeenCalledOnce();
    expect(dismissMock).toHaveBeenCalledOnce();
    expect(archiveMock).toHaveBeenCalledOnce();
  });

  it("returns recoverable unexpected errors when the boundary throws", async () => {
    serverClientMock.mockRejectedValue(new Error("boom"));
    const result = await lifecycleAttentionActions.acknowledgeAttentionItemAction({
      organizationId: ORG_ID,
      attentionItemId: ATTENTION_ITEM_ID,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("UNEXPECTED_ERROR");
      expect(result.error.retryable).toBe(true);
    }
  });
});
