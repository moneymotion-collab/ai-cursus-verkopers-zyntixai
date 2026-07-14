import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { TaskMutationResult } from "@/features/tasks/domain/types";
import type { Database } from "@/types/database";
import * as lifecycleTaskActions from "@/features/tasks/actions/lifecycle-task-actions";
import * as taskMutations from "@/features/tasks/server/task-mutations";
import { MUTATION_REFRESH_HINTS } from "@/features/tasks/server/task-mutations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";
const MEMBER_ID = "44444444-4444-4444-8444-444444444444";

const completedTask: TaskReadModel = {
  id: TASK_ID,
  organizationId: ORG_ID,
  title: "Follow up",
  description: null,
  status: "completed",
  taskType: "general",
  priority: "normal",
  source: "manual",
  dueAt: "2026-07-15T10:00:00.000Z",
  assigneeMemberId: MEMBER_ID,
  createdByMemberId: MEMBER_ID,
  linkedContext: { kind: "lead", leadId: "33333333-3333-4333-8333-333333333333" },
  predecessorTaskId: null,
  archivedAt: null,
  completedAt: "2026-07-10T10:00:00.000Z",
  cancelledAt: null,
  createdAt: "2026-07-01T10:00:00.000Z",
  updatedAt: "2026-07-10T10:00:00.000Z",
  derived: {
    terminal: true,
    archived: false,
    overdue: false,
    dueToday: false,
    upcoming: false,
    dueState: "none",
  },
};

const completeSuccess: TaskMutationResult = {
  ok: true,
  taskId: TASK_ID,
  task: completedTask,
  committed: true,
  refreshRequired: false,
  refreshHints: MUTATION_REFRESH_HINTS.complete,
};

const cancelSuccess: TaskMutationResult = {
  ...completeSuccess,
  task: { ...completedTask, status: "cancelled", completedAt: null, cancelledAt: "2026-07-10T10:00:00.000Z" },
  refreshHints: MUTATION_REFRESH_HINTS.cancel,
};

const archiveSuccess: TaskMutationResult = {
  ...completeSuccess,
  task: {
    ...completedTask,
    archivedAt: "2026-07-11T10:00:00.000Z",
    derived: { ...completedTask.derived, archived: true },
  },
  refreshHints: MUTATION_REFRESH_HINTS.archive,
};

const restoreSuccess: TaskMutationResult = {
  ...completeSuccess,
  refreshHints: MUTATION_REFRESH_HINTS.restore,
};

const committedRefreshFailure = (
  hints: (typeof MUTATION_REFRESH_HINTS)[keyof typeof MUTATION_REFRESH_HINTS],
): TaskMutationResult => ({
  ok: false,
  committed: true,
  taskId: TASK_ID,
  refreshHints: hints,
  error: {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest task.",
    retryable: false,
    category: "server",
    refreshRequired: true,
  },
});

const invalidStateFailure: TaskMutationResult = {
  ok: false,
  committed: false,
  error: {
    code: "INVALID_STATE_TRANSITION",
    message: "This task can no longer be changed that way.",
    retryable: false,
    category: "conflict",
    refreshRequired: true,
  },
};

const roleFailure: TaskMutationResult = {
  ok: false,
  committed: false,
  error: {
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
};

const linkedEntityFailure: TaskMutationResult = {
  ok: false,
  committed: false,
  error: {
    code: "LINKED_ENTITY_ARCHIVED",
    message: "Linked record is archived.",
    retryable: false,
    category: "validation",
  },
};

const mockSupabase = { auth: { getUser: vi.fn() } } as unknown as SupabaseClient<Database>;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/tasks/server/task-mutations", () => ({
  completeTaskMutation: vi.fn(),
  cancelTaskMutation: vi.fn(),
  archiveTaskMutation: vi.fn(),
  restoreTaskMutation: vi.fn(),
  MUTATION_REFRESH_HINTS: {
    complete: { task: true, taskLists: true, taskHistory: true },
    cancel: { task: true, taskLists: true, taskHistory: true },
    archive: { task: true, taskLists: true, taskHistory: false },
    restore: { task: true, taskLists: true, taskHistory: false },
  },
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const mutationMocks = {
  completeTaskMutation: vi.mocked(taskMutations.completeTaskMutation),
  cancelTaskMutation: vi.mocked(taskMutations.cancelTaskMutation),
  archiveTaskMutation: vi.mocked(taskMutations.archiveTaskMutation),
  restoreTaskMutation: vi.mocked(taskMutations.restoreTaskMutation),
};

beforeEach(() => {
  vi.clearAllMocks();
  serverClientMock.mockResolvedValue(mockSupabase);
  mutationMocks.completeTaskMutation.mockResolvedValue(completeSuccess);
  mutationMocks.cancelTaskMutation.mockResolvedValue(cancelSuccess);
  mutationMocks.archiveTaskMutation.mockResolvedValue(archiveSuccess);
  mutationMocks.restoreTaskMutation.mockResolvedValue(restoreSuccess);
});

describe("lifecycle task action module inventory", () => {
  it("exports exactly four lifecycle/archive actions", () => {
    expect(Object.keys(lifecycleTaskActions).sort()).toEqual([
      "archiveTaskAction",
      "cancelTaskAction",
      "completeTaskAction",
      "restoreTaskAction",
    ]);
  });

  it("does not export reopen or generic dispatcher actions", () => {
    expect(lifecycleTaskActions).not.toHaveProperty("reopenTaskAction");
    expect(lifecycleTaskActions).not.toHaveProperty("taskMutationAction");
    expect(lifecycleTaskActions).not.toHaveProperty("createTaskAction");
  });
});

describe("completeTaskAction", () => {
  it("creates server client and delegates with forwarded fields", async () => {
    const result = await lifecycleTaskActions.completeTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      completionNote: "Done",
    });

    expect(serverClientMock).toHaveBeenCalledTimes(1);
    expect(mutationMocks.completeTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, completionNote: "Done" },
    });
    expect(result).toEqual(completeSuccess);
    if (result.ok) {
      expect(result.refreshHints.taskHistory).toBe(true);
    }
  });

  it("accepts null completion note", async () => {
    await lifecycleTaskActions.completeTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      completionNote: null,
    });

    expect(mutationMocks.completeTaskMutation).toHaveBeenCalledWith(
      expect.objectContaining({
        input: { taskId: TASK_ID, completionNote: null },
      }),
    );
  });

  it("rejects lifecycle-managed fields before client creation", async () => {
    const result = await lifecycleTaskActions.completeTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      status: "completed",
    });

    expect(result.ok).toBe(false);
    expect(serverClientMock).not.toHaveBeenCalled();
    expect(mutationMocks.completeTaskMutation).not.toHaveBeenCalled();
  });

  it("passes invalid-state failure unchanged", async () => {
    mutationMocks.completeTaskMutation.mockResolvedValue(invalidStateFailure);

    const result = await lifecycleTaskActions.completeTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result).toEqual(invalidStateFailure);
  });

  it("preserves committed refresh failure without retry", async () => {
    const failure = committedRefreshFailure(MUTATION_REFRESH_HINTS.complete);
    mutationMocks.completeTaskMutation.mockResolvedValue(failure);

    const result = await lifecycleTaskActions.completeTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result).toEqual(failure);
    expect(mutationMocks.completeTaskMutation).toHaveBeenCalledTimes(1);
  });
});

describe("cancelTaskAction", () => {
  it("forwards valid cancel reason", async () => {
    const result = await lifecycleTaskActions.cancelTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      cancelReason: "No longer needed",
    });

    expect(mutationMocks.cancelTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, cancelReason: "No longer needed" },
    });
    expect(result).toEqual(cancelSuccess);
    if (result.ok) {
      expect(result.refreshHints.taskHistory).toBe(true);
    }
  });

  it("rejects empty cancel reason", async () => {
    const result = await lifecycleTaskActions.cancelTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      cancelReason: "   ",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.cancelTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects missing cancel reason", async () => {
    const result = await lifecycleTaskActions.cancelTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.cancelTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects completion and archive fields", async () => {
    const result = await lifecycleTaskActions.cancelTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      cancelReason: "Stop",
      completionNote: "Nope",
      archivedAt: "2026-07-11T10:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.cancelTaskMutation).not.toHaveBeenCalled();
  });
});

describe("archiveTaskAction", () => {
  it("forwards only organization and task IDs", async () => {
    const result = await lifecycleTaskActions.archiveTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(mutationMocks.archiveTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID },
    });
    expect(result).toEqual(archiveSuccess);
    if (result.ok) {
      expect(result.refreshHints.taskHistory).toBe(false);
    }
  });

  it("rejects client role and archive timestamp fields", async () => {
    const result = await lifecycleTaskActions.archiveTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      role: "admin",
      archivedAt: "2026-07-11T10:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.archiveTaskMutation).not.toHaveBeenCalled();
  });

  it("passes role denial unchanged", async () => {
    mutationMocks.archiveTaskMutation.mockResolvedValue(roleFailure);

    const result = await lifecycleTaskActions.archiveTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result).toEqual(roleFailure);
  });

  it("preserves committed refresh failure", async () => {
    const failure = committedRefreshFailure(MUTATION_REFRESH_HINTS.archive);
    mutationMocks.archiveTaskMutation.mockResolvedValue(failure);

    const result = await lifecycleTaskActions.archiveTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result).toEqual(failure);
    expect(mutationMocks.archiveTaskMutation).toHaveBeenCalledTimes(1);
  });
});

describe("restoreTaskAction", () => {
  it("forwards only organization and task IDs", async () => {
    const result = await lifecycleTaskActions.restoreTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(mutationMocks.restoreTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID },
    });
    expect(result).toEqual(restoreSuccess);
    if (result.ok) {
      expect(result.task.status).toBe("completed");
      expect(result.refreshHints.taskHistory).toBe(false);
    }
  });

  it("rejects reopen and status override fields", async () => {
    const result = await lifecycleTaskActions.restoreTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      status: "open",
      reopen: true,
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.restoreTaskMutation).not.toHaveBeenCalled();
  });

  it("passes linked-entity-archived failure unchanged", async () => {
    mutationMocks.restoreTaskMutation.mockResolvedValue(linkedEntityFailure);

    const result = await lifecycleTaskActions.restoreTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result).toEqual(linkedEntityFailure);
  });

  it("does not fabricate open status", async () => {
    const result = await lifecycleTaskActions.restoreTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.task.status).not.toBe("open");
    }
  });
});

describe("lifecycle task action client wiring", () => {
  const cases = [
    {
      name: "completeTaskAction",
      run: () =>
        lifecycleTaskActions.completeTaskAction({ organizationId: ORG_ID, taskId: TASK_ID }),
      service: mutationMocks.completeTaskMutation,
    },
    {
      name: "cancelTaskAction",
      run: () =>
        lifecycleTaskActions.cancelTaskAction({
          organizationId: ORG_ID,
          taskId: TASK_ID,
          cancelReason: "Stop",
        }),
      service: mutationMocks.cancelTaskMutation,
    },
    {
      name: "archiveTaskAction",
      run: () => lifecycleTaskActions.archiveTaskAction({ organizationId: ORG_ID, taskId: TASK_ID }),
      service: mutationMocks.archiveTaskMutation,
    },
    {
      name: "restoreTaskAction",
      run: () => lifecycleTaskActions.restoreTaskAction({ organizationId: ORG_ID, taskId: TASK_ID }),
      service: mutationMocks.restoreTaskMutation,
    },
  ] as const;

  it.each(cases)("uses internal server client for $name", async ({ run, service }) => {
    await run();
    expect(serverClientMock).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenCalledWith(expect.objectContaining({ supabase: mockSupabase }));
  });
});

describe("lifecycle task action unexpected exceptions", () => {
  it("sanitizes server-client factory failure for complete", async () => {
    serverClientMock.mockRejectedValue(new Error("cookie failure"));

    const result = await lifecycleTaskActions.completeTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("UNEXPECTED_ERROR");
      expect(result.error.message).not.toMatch(/cookie/i);
    }
  });

  it("sanitizes unexpected service throw for archive", async () => {
    mutationMocks.archiveTaskMutation.mockRejectedValue(new Error("boom"));

    const result = await lifecycleTaskActions.archiveTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("UNEXPECTED_ERROR");
      expect(result.error.message).not.toMatch(/boom/i);
    }
  });
});

describe("lifecycle task action single invocation", () => {
  it("invokes cancel service exactly once without retry after failure", async () => {
    mutationMocks.cancelTaskMutation.mockResolvedValue(invalidStateFailure);

    await lifecycleTaskActions.cancelTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      cancelReason: "Stop",
    });

    expect(mutationMocks.cancelTaskMutation).toHaveBeenCalledTimes(1);
    expect(mutationMocks.completeTaskMutation).not.toHaveBeenCalled();
    expect(mutationMocks.archiveTaskMutation).not.toHaveBeenCalled();
  });
});
