import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  ATTENTION_RPC_NAMES,
  acknowledgeAttentionItem,
  archiveAttentionItem,
  assignAttentionItem,
  attentionAdaptersAllowDirectTableWrites,
  createManualAttentionItem,
  dismissAttentionItem,
  evaluateAttentionRules,
  evaluateProjectAttentionRules,
  recordAttentionSignal,
  resolveAttentionItem,
  updateAttentionSeverity,
} from "@/features/attention/server/attention-rpc-adapters";
import * as orgContext from "@/features/organizations/server/resolve-organization-context";
import {
  ATTENTION_ITEM_ID,
  ENROLLMENT_ID,
  MEMBER_ID,
  ORG_ID,
  PROJECT_ID,
  SIGNAL_ID,
  USER_ID,
} from "../helpers/attention-test-fixtures";

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  resolveOrganizationContext: vi.fn(),
}));

const resolveOrganizationContext = vi.mocked(orgContext.resolveOrganizationContext);

function createRpcSupabase(rpcImpl: ReturnType<typeof vi.fn>) {
  return {
    rpc: rpcImpl,
    from: vi.fn(),
  } as unknown as SupabaseClient<Database>;
}

function mockRole(role: "owner" | "admin" | "staff" | "viewer") {
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
  mockRole("owner");
});

describe("attention RPC adapters", () => {
  it("uses exact create RPC name and membership-resolved organization id", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: ATTENTION_ITEM_ID, error: null });
    const supabase = createRpcSupabase(rpc);

    const result = await createManualAttentionItem({
      supabase,
      organizationId: "99999999-9999-4999-8999-999999999999",
      input: {
        organizationId: "99999999-9999-4999-8999-999999999999",
        enrollmentId: ENROLLMENT_ID,
        title: "Follow up",
        summary: null,
        explanation: "Manual review",
        evidenceNote: null,
      },
    });

    expect(result.ok).toBe(true);
    expect(ATTENTION_RPC_NAMES.createManual).toBe("create_manual_attention_item");
    expect(rpc).toHaveBeenCalledWith(ATTENTION_RPC_NAMES.createManual, {
      p_organization_id: ORG_ID,
      p_enrollment_id: ENROLLMENT_ID,
      p_title: "Follow up",
      p_summary: undefined,
      p_severity: undefined,
      p_explanation: "Manual review",
      p_evidence_note: undefined,
    });
    expect(supabase.from).not.toHaveBeenCalled();
    expect(attentionAdaptersAllowDirectTableWrites()).toBe(false);
  });

  it("invokes all lifecycle RPCs with exact argument keys", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    await acknowledgeAttentionItem({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, attentionItemId: ATTENTION_ITEM_ID },
    });
    expect(rpc).toHaveBeenLastCalledWith(ATTENTION_RPC_NAMES.acknowledge, {
      p_organization_id: ORG_ID,
      p_attention_item_id: ATTENTION_ITEM_ID,
    });

    await assignAttentionItem({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        assigneeMemberId: MEMBER_ID,
      },
    });
    expect(rpc).toHaveBeenLastCalledWith(ATTENTION_RPC_NAMES.assign, {
      p_organization_id: ORG_ID,
      p_attention_item_id: ATTENTION_ITEM_ID,
      p_assignee_member_id: MEMBER_ID,
    });

    await updateAttentionSeverity({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        severity: "low",
      },
    });
    expect(rpc).toHaveBeenLastCalledWith(ATTENTION_RPC_NAMES.updateSeverity, {
      p_organization_id: ORG_ID,
      p_attention_item_id: ATTENTION_ITEM_ID,
      p_severity: "low",
    });

    await resolveAttentionItem({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        resolutionReason: "Done",
      },
    });
    expect(rpc).toHaveBeenLastCalledWith(ATTENTION_RPC_NAMES.resolve, {
      p_organization_id: ORG_ID,
      p_attention_item_id: ATTENTION_ITEM_ID,
      p_resolution_reason: "Done",
    });

    await dismissAttentionItem({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        dismissalReason: "Noise",
      },
    });
    expect(rpc).toHaveBeenLastCalledWith(ATTENTION_RPC_NAMES.dismiss, {
      p_organization_id: ORG_ID,
      p_attention_item_id: ATTENTION_ITEM_ID,
      p_dismissal_reason: "Noise",
    });

    await archiveAttentionItem({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, attentionItemId: ATTENTION_ITEM_ID },
    });
    expect(rpc).toHaveBeenLastCalledWith(ATTENTION_RPC_NAMES.archive, {
      p_organization_id: ORG_ID,
      p_attention_item_id: ATTENTION_ITEM_ID,
    });
  });

  it("maps record signal id and evaluate rules jsonb result", async () => {
    const signalRpc = vi.fn().mockResolvedValue({ data: SIGNAL_ID, error: null });
    const signalResult = await recordAttentionSignal({
      supabase: createRpcSupabase(signalRpc),
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        explanation: "Still quiet",
      },
    });
    expect(signalResult.ok).toBe(true);
    if (signalResult.ok) {
      expect(signalResult.data?.signalId).toBe(SIGNAL_ID);
    }

    const evaluateRpc = vi.fn().mockResolvedValue({
      data: {
        created: 1,
        updated: 2,
        expired: 0,
        evaluatedAt: "2026-08-05T10:00:00.000Z",
      },
      error: null,
    });
    const evaluateResult = await evaluateAttentionRules({
      supabase: createRpcSupabase(evaluateRpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, enrollmentId: ENROLLMENT_ID },
    });
    expect(evaluateResult.ok).toBe(true);
    if (evaluateResult.ok) {
      expect(evaluateResult.data).toEqual({
        created: 1,
        updated: 2,
        expired: 0,
        evaluatedAt: "2026-08-05T10:00:00.000Z",
      });
    }
  });

  it("uses exact project evaluate RPC name and args, and maps jsonb result", async () => {
    expect(ATTENTION_RPC_NAMES.evaluateProjectRules).toBe(
      "evaluate_project_attention_rules",
    );

    const rpc = vi.fn().mockResolvedValue({
      data: {
        created: 2,
        updated: 1,
        expired: 1,
        evaluatedAt: "2026-09-05T10:00:00.000Z",
      },
      error: null,
    });
    const result = await evaluateProjectAttentionRules({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, projectId: PROJECT_ID },
    });

    expect(rpc).toHaveBeenCalledWith(ATTENTION_RPC_NAMES.evaluateProjectRules, {
      p_organization_id: ORG_ID,
      p_project_id: PROJECT_ID,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({
        created: 2,
        updated: 1,
        expired: 1,
        evaluatedAt: "2026-09-05T10:00:00.000Z",
      });
    }
  });

  it("denies staff/viewer project evaluate before RPC", async () => {
    const rpc = vi.fn();

    mockRole("viewer");
    const viewerResult = await evaluateProjectAttentionRules({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID },
    });
    expect(viewerResult.ok).toBe(false);
    if (!viewerResult.ok) {
      expect(viewerResult.error.code).toBe("PERMISSION_DENIED");
    }

    mockRole("staff");
    const staffResult = await evaluateProjectAttentionRules({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID },
    });
    expect(staffResult.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("denies viewer mutations and staff archive/evaluate before RPC", async () => {
    const rpc = vi.fn();
    mockRole("viewer");
    const viewerResult = await createManualAttentionItem({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        enrollmentId: ENROLLMENT_ID,
        title: "x",
        summary: null,
        explanation: "y",
        evidenceNote: null,
      },
    });
    expect(viewerResult.ok).toBe(false);
    if (!viewerResult.ok) {
      expect(viewerResult.error.code).toBe("PERMISSION_DENIED");
    }
    expect(rpc).not.toHaveBeenCalled();

    mockRole("staff");
    const archiveResult = await archiveAttentionItem({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, attentionItemId: ATTENTION_ITEM_ID },
    });
    expect(archiveResult.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();

    const evaluateResult = await evaluateAttentionRules({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID },
    });
    expect(evaluateResult.ok).toBe(false);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("allows staff dismiss and fails closed when org context is missing", async () => {
    mockRole("staff");
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const dismissResult = await dismissAttentionItem({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        dismissalReason: "Not relevant",
      },
    });
    expect(dismissResult.ok).toBe(true);
    expect(rpc).toHaveBeenCalled();

    resolveOrganizationContext.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });
    const blockedRpc = vi.fn();
    const blocked = await acknowledgeAttentionItem({
      supabase: createRpcSupabase(blockedRpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, attentionItemId: ATTENTION_ITEM_ID },
    });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.error.code).toBe("ORG_CONTEXT_MISSING");
    }
    expect(blockedRpc).not.toHaveBeenCalled();
  });

  it("normalizes RPC errors and rejects malformed evaluate responses", async () => {
    const rpc = vi
      .fn()
      .mockResolvedValue({ data: null, error: { message: "attention item not found" } });
    const result = await acknowledgeAttentionItem({
      supabase: createRpcSupabase(rpc),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, attentionItemId: ATTENTION_ITEM_ID },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ATTENTION_ITEM_UNAVAILABLE");
    }

    const malformed = await evaluateAttentionRules({
      supabase: createRpcSupabase(
        vi.fn().mockResolvedValue({ data: { created: "nope" }, error: null }),
      ),
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID },
    });
    expect(malformed.ok).toBe(false);
  });

  it("treats repository-proven idempotent RPC successes as success", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    const supabase = createRpcSupabase(rpc);

    const ack = await acknowledgeAttentionItem({
      supabase,
      organizationId: ORG_ID,
      input: { organizationId: ORG_ID, attentionItemId: ATTENTION_ITEM_ID },
    });
    const severity = await updateAttentionSeverity({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        severity: "high",
      },
    });
    const resolve = await resolveAttentionItem({
      supabase,
      organizationId: ORG_ID,
      input: {
        organizationId: ORG_ID,
        attentionItemId: ATTENTION_ITEM_ID,
        resolutionReason: "Already done",
      },
    });

    expect(ack.ok).toBe(true);
    expect(severity.ok).toBe(true);
    expect(resolve.ok).toBe(true);
  });
});
