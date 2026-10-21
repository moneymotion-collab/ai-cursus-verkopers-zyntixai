import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  TASK_RPC_NAMES,
  archiveTaskRpc,
  cancelTaskRpc,
  completeTaskRpc,
  createTaskRpc,
  reassignTaskRpc,
  rescheduleTaskRpc,
  restoreTaskRpc,
  updateTaskRpc,
} from "@/features/tasks/server/task-rpc-adapters";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";
const LEAD_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "44444444-4444-4444-8444-444444444444";
const USER_ID = "55555555-5555-4555-8555-555555555555";
const CUSTOMER_ID = "66666666-6666-4666-8666-666666666666";
const ENROLLMENT_ID = "77777777-7777-4777-8777-777777777777";
const PROGRAM_ID = "88888888-8888-4888-8888-888888888888";
const PROJECT_ID = "99999999-9999-4999-8999-999999999999";

function mockSupabaseForRpc(rpcResult: { data?: unknown; error?: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  const activeMembershipQuery = vi.fn().mockResolvedValue({
    data: [
      {
        id: MEMBER_ID,
        organization_id: ORG_ID,
        role: "staff",
        status: "active",
        user_id: USER_ID,
      },
    ],
    error: null,
  });
  const userEq = vi.fn().mockReturnValue({ eq: activeMembershipQuery });

  const supabase = {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: USER_ID } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: userEq,
      }),
    }),
    rpc,
  } as unknown as SupabaseClient<Database>;

  return { supabase, rpc };
}

describe("task RPC adapters", () => {
  it("exposes exactly eight RPC adapters", () => {
    expect(TASK_RPC_NAMES).toHaveLength(8);
    expect(TASK_RPC_NAMES).toEqual([
      "create_task",
      "update_task",
      "reassign_task",
      "reschedule_task",
      "complete_task",
      "cancel_task",
      "archive_task",
      "restore_task",
    ]);
  });

  it("maps create_task RPC args and returns UUID", async () => {
    const { supabase, rpc } = mockSupabaseForRpc({ data: TASK_ID, error: null });

    const result = await createTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        title: "Follow up",
        dueAt: "2026-07-15T10:00:00.000Z",
        leadId: LEAD_ID,
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("create_task", {
      p_organization_id: ORG_ID,
      p_title: "Follow up",
      p_due_at: "2026-07-15T10:00:00.000Z",
      p_description: undefined,
      p_task_type: "general",
      p_priority: "normal",
      p_source: "manual",
      p_assignee_member_id: undefined,
      p_lead_id: LEAD_ID,
      p_customer_id: undefined,
      p_enrollment_id: undefined,
      p_program_id: undefined,
      p_predecessor_task_id: undefined,
      p_idempotency_key: undefined,
      p_metadata: {},
    });
  });

  it.each([
    [
      "customer",
      { customerId: CUSTOMER_ID },
      { p_customer_id: CUSTOMER_ID, p_lead_id: undefined, p_enrollment_id: undefined, p_program_id: undefined },
    ],
    [
      "enrollment",
      { customerId: CUSTOMER_ID, enrollmentId: ENROLLMENT_ID, programId: PROGRAM_ID },
      {
        p_customer_id: CUSTOMER_ID,
        p_lead_id: undefined,
        p_enrollment_id: ENROLLMENT_ID,
        p_program_id: PROGRAM_ID,
      },
    ],
  ])("preserves the legacy create_task path for %s context", async (_name, linkedContext, expected) => {
    const { supabase, rpc } = mockSupabaseForRpc({ data: TASK_ID, error: null });

    const result = await createTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        title: "Follow up",
        dueAt: "2026-07-15T10:00:00.000Z",
        ...linkedContext,
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("create_task", expect.objectContaining(expected));
    expect(rpc).not.toHaveBeenCalledWith("create_project_task", expect.anything());
  });

  it("uses create_project_task with only organization and project context IDs", async () => {
    const { supabase, rpc } = mockSupabaseForRpc({ data: TASK_ID, error: null });

    const result = await createTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        title: "Prepare project review",
        dueAt: "2026-07-15T10:00:00.000Z",
        projectId: PROJECT_ID,
      },
    });

    expect(result.ok).toBe(true);
    expect(rpc).toHaveBeenCalledWith("create_project_task", {
      p_organization_id: ORG_ID,
      p_project_id: PROJECT_ID,
      p_title: "Prepare project review",
      p_due_at: "2026-07-15T10:00:00.000Z",
      p_description: undefined,
      p_task_type: "general",
      p_priority: "normal",
      p_assignee_member_id: undefined,
      p_predecessor_task_id: undefined,
      p_metadata: {},
    });
    const [, args] = rpc.mock.calls[0];
    expect(args).not.toHaveProperty("p_customer_id");
    expect(args).not.toHaveProperty("p_lead_id");
    expect(args).not.toHaveProperty("p_enrollment_id");
    expect(args).not.toHaveProperty("p_program_id");
    expect(rpc).not.toHaveBeenCalledWith("create_task", expect.anything());
  });

  it("maps void RPC adapters", async () => {
    const { supabase, rpc } = mockSupabaseForRpc({ data: null, error: null });

    await updateTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, title: "Updated" },
    });
    expect(rpc).toHaveBeenCalledWith(
      "update_task",
      expect.objectContaining({ p_task_id: TASK_ID, p_title: "Updated" }),
    );

    await reassignTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, assigneeMemberId: MEMBER_ID },
    });
    expect(rpc).toHaveBeenCalledWith("reassign_task", expect.objectContaining({ p_task_id: TASK_ID }));

    await rescheduleTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, dueAt: "2026-07-16T10:00:00.000Z" },
    });
    expect(rpc).toHaveBeenCalledWith("reschedule_task", expect.objectContaining({ p_due_at: expect.any(String) }));

    await completeTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, completionNote: "Done" },
    });
    expect(rpc).toHaveBeenCalledWith("complete_task", expect.objectContaining({ p_completion_note: "Done" }));

    await cancelTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, cancelReason: "No longer needed" },
    });
    expect(rpc).toHaveBeenCalledWith("cancel_task", expect.objectContaining({ p_cancel_reason: "No longer needed" }));

    await archiveTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID },
    });
    expect(rpc).toHaveBeenCalledWith("archive_task", expect.objectContaining({ p_task_id: TASK_ID }));

    await restoreTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID },
    });
    expect(rpc).toHaveBeenCalledWith("restore_task", expect.objectContaining({ p_task_id: TASK_ID }));
  });

  it("normalizes RPC errors", async () => {
    const { supabase } = mockSupabaseForRpc({ data: null, error: { message: "insufficient role" } });

    const result = await createTaskRpc({
      supabase,
      organizationId: ORG_ID,
      input: {
        title: "Follow up",
        dueAt: "2026-07-15T10:00:00.000Z",
        leadId: LEAD_ID,
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("INSUFFICIENT_ROLE");
    }
  });
});
