import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type {
  TaskApplicationError,
  TaskMutationResult,
} from "@/features/tasks/domain/types";
import type { Database } from "@/types/database";
import {
  archiveTaskMutation,
  cancelTaskMutation,
  completeTaskMutation,
  createTaskMutation,
  MUTATION_REFRESH_HINTS,
  reassignTaskMutation,
  rescheduleTaskMutation,
  restoreTaskMutation,
  updateTaskMutation,
} from "@/features/tasks/server/task-mutations";
import * as taskReadQueries from "@/features/tasks/server/task-read-queries";
import * as taskRpcAdapters from "@/features/tasks/server/task-rpc-adapters";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";
const LEAD_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "44444444-4444-4444-8444-444444444444";

const sampleTask: TaskReadModel = {
  id: TASK_ID,
  organizationId: ORG_ID,
  title: "Follow up",
  description: null,
  status: "open",
  taskType: "general",
  priority: "normal",
  source: "manual",
  dueAt: "2026-07-15T10:00:00.000Z",
  assigneeMemberId: MEMBER_ID,
  createdByMemberId: MEMBER_ID,
  linkedContext: { kind: "lead", leadId: LEAD_ID },
  predecessorTaskId: null,
  archivedAt: null,
  completedAt: null,
  cancelledAt: null,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-01T10:00:00.000Z",
  derived: {
    terminal: false,
    archived: false,
    overdue: false,
    dueToday: false,
    upcoming: true,
    dueState: "upcoming",
  },
};

const supabase = {} as SupabaseClient<Database>;

function adapterError(message: string, code?: TaskApplicationError["code"]): TaskApplicationError {
  return {
    code: code ?? "UNEXPECTED_ERROR",
    message,
    retryable: false,
    category: "server",
  };
}

vi.mock("@/features/tasks/server/task-rpc-adapters", () => ({
  createTaskRpc: vi.fn(),
  updateTaskRpc: vi.fn(),
  reassignTaskRpc: vi.fn(),
  rescheduleTaskRpc: vi.fn(),
  completeTaskRpc: vi.fn(),
  cancelTaskRpc: vi.fn(),
  archiveTaskRpc: vi.fn(),
  restoreTaskRpc: vi.fn(),
}));

vi.mock("@/features/tasks/server/task-read-queries", () => ({
  getTaskById: vi.fn(),
}));

const mocks = {
  createTaskRpc: vi.mocked(taskRpcAdapters.createTaskRpc),
  updateTaskRpc: vi.mocked(taskRpcAdapters.updateTaskRpc),
  reassignTaskRpc: vi.mocked(taskRpcAdapters.reassignTaskRpc),
  rescheduleTaskRpc: vi.mocked(taskRpcAdapters.rescheduleTaskRpc),
  completeTaskRpc: vi.mocked(taskRpcAdapters.completeTaskRpc),
  cancelTaskRpc: vi.mocked(taskRpcAdapters.cancelTaskRpc),
  archiveTaskRpc: vi.mocked(taskRpcAdapters.archiveTaskRpc),
  restoreTaskRpc: vi.mocked(taskRpcAdapters.restoreTaskRpc),
  getTaskById: vi.mocked(taskReadQueries.getTaskById),
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getTaskById.mockResolvedValue({ ok: true, data: sampleTask });
});

describe("task mutation result envelope", () => {
  it("returns serializable success without raw Error objects", async () => {
    mocks.createTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });

    const result = await createTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID },
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.committed).toBe(true);
      expect(result.refreshRequired).toBe(false);
      expect(result.taskId).toBe(TASK_ID);
      expect(result.task).toEqual(sampleTask);
      expect(result.refreshHints).toEqual(MUTATION_REFRESH_HINTS.create);
      expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    }
  });

  it("returns committed refresh failure when refetch fails after create", async () => {
    mocks.createTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });
    mocks.getTaskById.mockResolvedValue({
      ok: false,
      error: { code: "NETWORK_ERROR", message: "Connection problem.", retryable: true, category: "network" },
    });

    const result = await createTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID },
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.taskId).toBe(TASK_ID);
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
      expect(result.error.refreshRequired).toBe(true);
      expect(result.error.retryable).toBe(false);
      expect(result.error.message).not.toMatch(/network/i);
      expect(result.refreshHints).toEqual(MUTATION_REFRESH_HINTS.create);
      expect(mocks.createTaskRpc).toHaveBeenCalledTimes(1);
    }
  });

  it("returns committed refresh failure when refetch fails after void mutation", async () => {
    mocks.completeTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });
    mocks.getTaskById.mockResolvedValue({
      ok: false,
      error: { code: "UNEXPECTED_ERROR", message: "Something went wrong.", retryable: true, category: "server" },
    });

    const result = await completeTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID },
    });

    expect(result.ok).toBe(false);
    if (!result.ok && result.committed) {
      expect(result.taskId).toBe(TASK_ID);
      expect(result.error.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
      expect(result.refreshHints).toEqual(MUTATION_REFRESH_HINTS.complete);
      expect(mocks.completeTaskRpc).toHaveBeenCalledTimes(1);
    }
  });

  it("returns normal failure with committed false for validation errors", async () => {
    const result = await createTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { title: "", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID },
    });

    expect(result).toEqual({
      ok: false,
      committed: false,
      error: expect.objectContaining({
        code: "VALIDATION_ERROR",
        retryable: false,
      }),
    });
    expect(mocks.createTaskRpc).not.toHaveBeenCalled();
    expect(mocks.getTaskById).not.toHaveBeenCalled();
  });
});

describe("task mutation validation", () => {
  it("rejects malformed UUID before adapter invocation", async () => {
    const result = await updateTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: "bad-id", title: "Updated" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.committed).toBe(false);
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.taskId).toBeDefined();
    }
    expect(mocks.updateTaskRpc).not.toHaveBeenCalled();
  });

  it("rejects manual create with idempotency key", async () => {
    const result = await createTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: {
        title: "Follow up",
        dueAt: "2026-07-15T10:00:00.000Z",
        leadId: LEAD_ID,
        idempotencyKey: "dup-key",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
      expect(result.error.fieldErrors?.idempotencyKey).toBeDefined();
    }
    expect(mocks.createTaskRpc).not.toHaveBeenCalled();
  });

  it("rejects system create without idempotency key", async () => {
    const result = await createTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: {
        title: "System task",
        dueAt: "2026-07-15T10:00:00.000Z",
        leadId: LEAD_ID,
        source: "system",
      },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.fieldErrors?.idempotencyKey).toBeDefined();
    }
    expect(mocks.createTaskRpc).not.toHaveBeenCalled();
  });

  it("rejects missing cancel reason before adapter invocation", async () => {
    const result = await cancelTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, cancelReason: "   " },
    });

    expect(result.ok).toBe(false);
    expect(mocks.cancelTaskRpc).not.toHaveBeenCalled();
  });
});

describe("task mutation authentication and context", () => {
  it("surfaces AUTH_REQUIRED from adapter without refetch", async () => {
    mocks.createTaskRpc.mockResolvedValue({
      ok: false,
      error: {
        code: "AUTH_REQUIRED",
        message: "Please sign in to continue.",
        retryable: false,
        category: "auth",
      },
    });

    const result = await createTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.committed).toBe(false);
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
    expect(mocks.getTaskById).not.toHaveBeenCalled();
  });

  it("surfaces organization context missing from adapter", async () => {
    mocks.updateTaskRpc.mockResolvedValue({
      ok: false,
      error: {
        code: "ORG_CONTEXT_MISSING",
        message: "Organization not found or access denied.",
        retryable: false,
        category: "not_found",
      },
    });

    const result = await updateTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, title: "Updated" },
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ORG_CONTEXT_MISSING");
    }
  });

  it("passes selected organization ID to adapter for membership verification", async () => {
    mocks.reassignTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });

    await reassignTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, assigneeMemberId: MEMBER_ID },
    });

    expect(mocks.reassignTaskRpc).toHaveBeenCalledWith({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, assigneeMemberId: MEMBER_ID },
    });
  });
});

describe("task mutation adapter invocation", () => {
  const successCases = [
    {
      name: "createTaskMutation",
      run: () =>
        createTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID },
        }),
      mock: () => mocks.createTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.createTaskRpc,
    },
    {
      name: "updateTaskMutation",
      run: () =>
        updateTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, title: "Updated title" },
        }),
      mock: () => mocks.updateTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.updateTaskRpc,
    },
    {
      name: "reassignTaskMutation",
      run: () =>
        reassignTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, assigneeMemberId: MEMBER_ID },
        }),
      mock: () => mocks.reassignTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.reassignTaskRpc,
    },
    {
      name: "rescheduleTaskMutation",
      run: () =>
        rescheduleTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, dueAt: "2026-07-20T10:00:00.000Z" },
        }),
      mock: () => mocks.rescheduleTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.rescheduleTaskRpc,
    },
    {
      name: "completeTaskMutation",
      run: () =>
        completeTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, completionNote: "Done" },
        }),
      mock: () => mocks.completeTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.completeTaskRpc,
    },
    {
      name: "cancelTaskMutation",
      run: () =>
        cancelTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, cancelReason: "No longer needed" },
        }),
      mock: () => mocks.cancelTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.cancelTaskRpc,
    },
    {
      name: "archiveTaskMutation",
      run: () =>
        archiveTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID },
        }),
      mock: () => mocks.archiveTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.archiveTaskRpc,
    },
    {
      name: "restoreTaskMutation",
      run: () =>
        restoreTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID },
        }),
      mock: () => mocks.restoreTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
      adapter: mocks.restoreTaskRpc,
    },
  ] as const;

  it.each(successCases)("calls the correct adapter once for $name", async ({ run, mock, adapter }) => {
    mock();
    await run();
    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter).toHaveBeenCalledWith(
      expect.objectContaining({ supabase, organizationId: ORG_ID }),
    );
  });

  it.each(successCases)("refetches authoritative task model for $name", async ({ run, mock }) => {
    mock();
    const result = await run();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(mocks.getTaskById).toHaveBeenCalledWith({
        supabase,
        organizationId: ORG_ID,
        taskId: TASK_ID,
      });
      expect(result.task).toEqual(sampleTask);
    }
  });
});

describe("task mutation error mapping", () => {
  const errorCases: Array<{
    adapter: (typeof mocks)[keyof typeof mocks];
    run: (context: {
      supabase: SupabaseClient<Database>;
      organizationId: string;
      input: unknown;
    }) => Promise<TaskMutationResult>;
    input: Record<string, unknown>;
    message: string;
    code: TaskApplicationError["code"];
    refresh?: boolean;
  }> = [
    { adapter: mocks.createTaskRpc, run: createTaskMutation, input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID }, message: "insufficient role", code: "INSUFFICIENT_ROLE" },
    { adapter: mocks.updateTaskRpc, run: updateTaskMutation, input: { taskId: TASK_ID, title: "Updated" }, message: "task not found", code: "TASK_NOT_FOUND", refresh: true },
    { adapter: mocks.reassignTaskRpc, run: reassignTaskMutation, input: { taskId: TASK_ID }, message: "invalid member assignment for organization", code: "INVALID_ASSIGNEE" },
    { adapter: mocks.rescheduleTaskRpc, run: rescheduleTaskMutation, input: { taskId: TASK_ID, dueAt: "2026-07-20T10:00:00.000Z" }, message: "linked lead not found or archived", code: "LINKED_ENTITY_ARCHIVED" },
    { adapter: mocks.completeTaskRpc, run: completeTaskMutation, input: { taskId: TASK_ID }, message: "only open tasks can be completed", code: "INVALID_STATE_TRANSITION", refresh: true },
    { adapter: mocks.cancelTaskRpc, run: cancelTaskMutation, input: { taskId: TASK_ID, cancelReason: "Stop" }, message: "archived tasks cannot be cancelled", code: "INVALID_STATE_TRANSITION", refresh: true },
    { adapter: mocks.archiveTaskRpc, run: archiveTaskMutation, input: { taskId: TASK_ID }, message: "only terminal tasks can be archived", code: "INVALID_STATE_TRANSITION", refresh: true },
    { adapter: mocks.restoreTaskRpc, run: restoreTaskMutation, input: { taskId: TASK_ID }, message: "only terminal tasks can be restored", code: "INVALID_STATE_TRANSITION", refresh: true },
    { adapter: mocks.createTaskRpc, run: createTaskMutation, input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID }, message: "idempotency payload conflict", code: "IDEMPOTENCY_CONFLICT" },
    { adapter: mocks.createTaskRpc, run: createTaskMutation, input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID }, message: "invalid task type", code: "VALIDATION_ERROR" },
    { adapter: mocks.updateTaskRpc, run: updateTaskMutation, input: { taskId: TASK_ID, title: "Updated" }, message: "invalid task priority", code: "VALIDATION_ERROR" },
    { adapter: mocks.createTaskRpc, run: createTaskMutation, input: { title: "System", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID, source: "system", idempotencyKey: "key-1" }, message: "system idempotency key is required", code: "VALIDATION_ERROR" },
    { adapter: mocks.createTaskRpc, run: createTaskMutation, input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID }, message: "fetch failed", code: "NETWORK_ERROR" },
    { adapter: mocks.updateTaskRpc, run: updateTaskMutation, input: { taskId: TASK_ID, title: "Updated" }, message: "upstream timeout", code: "UNEXPECTED_ERROR" },
  ];

  it.each(errorCases)(
    "maps $message to $code",
    async ({ adapter, run, input, message, code, refresh }) => {
      adapter.mockResolvedValue({
        ok: false,
        error: adapterError(message, code as TaskApplicationError["code"]),
      });

      const result = await run({ supabase, organizationId: ORG_ID, input });

      expect(result.ok).toBe(false);
      if (!result.ok && !result.committed) {
        expect(result.error.code).toBe(code);
        if (refresh) {
          expect(result.error.refreshRequired).toBe(true);
        }
        expect(mocks.getTaskById).not.toHaveBeenCalled();
      }
    },
  );
});

describe("task mutation lifecycle separation", () => {
  it("complete calls only complete adapter", async () => {
    mocks.completeTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });
    await completeTaskMutation({ supabase, organizationId: ORG_ID, input: { taskId: TASK_ID } });
    expect(mocks.completeTaskRpc).toHaveBeenCalledTimes(1);
    expect(mocks.cancelTaskRpc).not.toHaveBeenCalled();
    expect(mocks.archiveTaskRpc).not.toHaveBeenCalled();
    expect(mocks.restoreTaskRpc).not.toHaveBeenCalled();
  });

  it("cancel calls only cancel adapter", async () => {
    mocks.cancelTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });
    await cancelTaskMutation({
      supabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, cancelReason: "Done" },
    });
    expect(mocks.cancelTaskRpc).toHaveBeenCalledTimes(1);
    expect(mocks.completeTaskRpc).not.toHaveBeenCalled();
  });

  it("archive calls only archive adapter", async () => {
    mocks.archiveTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });
    await archiveTaskMutation({ supabase, organizationId: ORG_ID, input: { taskId: TASK_ID } });
    expect(mocks.archiveTaskRpc).toHaveBeenCalledTimes(1);
    expect(mocks.restoreTaskRpc).not.toHaveBeenCalled();
  });

  it("restore returns refetched task without reopening in service code", async () => {
    mocks.restoreTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID });
    mocks.getTaskById.mockResolvedValue({
      ok: true,
      data: {
        ...sampleTask,
        status: "completed",
        archivedAt: null,
        derived: { ...sampleTask.derived, terminal: true, archived: false, dueState: "none" },
      },
    });

    const result = await restoreTaskMutation({ supabase, organizationId: ORG_ID, input: { taskId: TASK_ID } });

    expect(mocks.restoreTaskRpc).toHaveBeenCalledTimes(1);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.task.status).toBe("completed");
      expect(result.refreshHints).toEqual(MUTATION_REFRESH_HINTS.restore);
    }
  });
});

describe("task mutation refresh hints", () => {
  const refreshCases = [
    {
      name: "createTaskMutation",
      hints: MUTATION_REFRESH_HINTS.create,
      run: () =>
        createTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { title: "Follow up", dueAt: "2026-07-15T10:00:00.000Z", leadId: LEAD_ID },
        }),
      mock: () => mocks.createTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
    {
      name: "updateTaskMutation",
      hints: MUTATION_REFRESH_HINTS.update,
      run: () =>
        updateTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, title: "Updated" },
        }),
      mock: () => mocks.updateTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
    {
      name: "reassignTaskMutation",
      hints: MUTATION_REFRESH_HINTS.reassign,
      run: () =>
        reassignTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, assigneeMemberId: MEMBER_ID },
        }),
      mock: () => mocks.reassignTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
    {
      name: "rescheduleTaskMutation",
      hints: MUTATION_REFRESH_HINTS.reschedule,
      run: () =>
        rescheduleTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, dueAt: "2026-07-20T10:00:00.000Z" },
        }),
      mock: () => mocks.rescheduleTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
    {
      name: "completeTaskMutation",
      hints: MUTATION_REFRESH_HINTS.complete,
      run: () =>
        completeTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID },
        }),
      mock: () => mocks.completeTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
    {
      name: "cancelTaskMutation",
      hints: MUTATION_REFRESH_HINTS.cancel,
      run: () =>
        cancelTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID, cancelReason: "Stop" },
        }),
      mock: () => mocks.cancelTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
    {
      name: "archiveTaskMutation",
      hints: MUTATION_REFRESH_HINTS.archive,
      run: () =>
        archiveTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID },
        }),
      mock: () => mocks.archiveTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
    {
      name: "restoreTaskMutation",
      hints: MUTATION_REFRESH_HINTS.restore,
      run: () =>
        restoreTaskMutation({
          supabase,
          organizationId: ORG_ID,
          input: { taskId: TASK_ID },
        }),
      mock: () => mocks.restoreTaskRpc.mockResolvedValue({ ok: true, taskId: TASK_ID }),
    },
  ] as const;

  it.each(refreshCases)("assigns refresh hints on success for $name", async ({ run, mock, hints }) => {
    mock();
    const result = await run();

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.refreshHints).toEqual(hints);
      expect(result.refreshHints).not.toHaveProperty("revalidatePath");
      expect(result.refreshHints).not.toHaveProperty("revalidateTag");
    }
  });

  it.each(refreshCases)(
    "preserves operation-specific refresh hints on committed refetch failure for $name",
    async ({ run, mock, hints }) => {
      mock();
      mocks.getTaskById.mockResolvedValue({
        ok: false,
        error: {
          code: "NETWORK_ERROR",
          message: "Connection problem.",
          retryable: true,
          category: "network",
        },
      });

      const result = await run();

      expect(result.ok).toBe(false);
      if (!result.ok && result.committed) {
        expect(result.refreshHints).toEqual(hints);
      }
    },
  );
});
