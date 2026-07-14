import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TaskReadModel } from "@/features/tasks/domain/read-types";
import type { TaskMutationResult } from "@/features/tasks/domain/types";
import type { Database } from "@/types/database";
import * as editableTaskActions from "@/features/tasks/actions/editable-task-actions";
import * as taskMutations from "@/features/tasks/server/task-mutations";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const createRefreshHints = { task: true as const, taskLists: true as const, taskHistory: true };

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

const successResult: TaskMutationResult = {
  ok: true,
  taskId: TASK_ID,
  task: sampleTask,
  committed: true,
  refreshRequired: false,
  refreshHints: createRefreshHints,
};

const committedRefreshFailure: TaskMutationResult = {
  ok: false,
  committed: true,
  taskId: TASK_ID,
  refreshHints: createRefreshHints,
  error: {
    code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
    message: "Your change was saved. Refresh to see the latest task.",
    retryable: false,
    category: "server",
    refreshRequired: true,
  },
};

const serviceFailure: TaskMutationResult = {
  ok: false,
  committed: false,
  error: {
    code: "INSUFFICIENT_ROLE",
    message: "You don't have permission for this action.",
    retryable: false,
    category: "permission",
  },
};

const mockSupabase = { auth: { getUser: vi.fn() } } as unknown as SupabaseClient<Database>;

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

vi.mock("@/features/tasks/server/task-mutations", () => ({
  createTaskMutation: vi.fn(),
  updateTaskMutation: vi.fn(),
  reassignTaskMutation: vi.fn(),
  rescheduleTaskMutation: vi.fn(),
}));

const serverClientMock = vi.mocked(createSupabaseServerClient);
const mutationMocks = {
  createTaskMutation: vi.mocked(taskMutations.createTaskMutation),
  updateTaskMutation: vi.mocked(taskMutations.updateTaskMutation),
  reassignTaskMutation: vi.mocked(taskMutations.reassignTaskMutation),
  rescheduleTaskMutation: vi.mocked(taskMutations.rescheduleTaskMutation),
};

beforeEach(() => {
  vi.clearAllMocks();
  serverClientMock.mockResolvedValue(mockSupabase);
  mutationMocks.createTaskMutation.mockResolvedValue(successResult);
  mutationMocks.updateTaskMutation.mockResolvedValue(successResult);
  mutationMocks.reassignTaskMutation.mockResolvedValue(successResult);
  mutationMocks.rescheduleTaskMutation.mockResolvedValue(successResult);
});

describe("editable task action module inventory", () => {
  it("exports exactly four editable-field actions", () => {
    expect(Object.keys(editableTaskActions).sort()).toEqual([
      "createTaskAction",
      "reassignTaskAction",
      "rescheduleTaskAction",
      "updateTaskAction",
    ]);
  });

  it("does not export lifecycle or archive actions", () => {
    expect(editableTaskActions).not.toHaveProperty("completeTaskAction");
    expect(editableTaskActions).not.toHaveProperty("cancelTaskAction");
    expect(editableTaskActions).not.toHaveProperty("archiveTaskAction");
    expect(editableTaskActions).not.toHaveProperty("restoreTaskAction");
    expect(editableTaskActions).not.toHaveProperty("taskMutationAction");
  });
});

describe("createTaskAction", () => {
  const validInput = {
    organizationId: ORG_ID,
    title: "Follow up",
    dueAt: "2026-07-15T10:00:00.000Z",
    leadId: LEAD_ID,
  };

  it("creates server client and calls createTaskMutation once with manual source", async () => {
    const result = await editableTaskActions.createTaskAction(validInput);

    expect(serverClientMock).toHaveBeenCalledTimes(1);
    expect(mutationMocks.createTaskMutation).toHaveBeenCalledTimes(1);
    expect(mutationMocks.createTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: {
        title: "Follow up",
        dueAt: "2026-07-15T10:00:00.000Z",
        leadId: LEAD_ID,
        taskType: "general",
        priority: "normal",
        source: "manual",
        idempotencyKey: null,
      },
    });
    expect(result).toEqual(successResult);
  });

  it("rejects client source system without calling service or server client", async () => {
    const result = await editableTaskActions.createTaskAction({
      ...validInput,
      source: "system",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(serverClientMock).not.toHaveBeenCalled();
    expect(mutationMocks.createTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects client idempotency key without calling service", async () => {
    const result = await editableTaskActions.createTaskAction({
      ...validInput,
      idempotencyKey: "client-key",
    });

    expect(result.ok).toBe(false);
    expect(serverClientMock).not.toHaveBeenCalled();
    expect(mutationMocks.createTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects actor fields without forwarding them", async () => {
    const result = await editableTaskActions.createTaskAction({
      ...validInput,
      createdByMemberId: MEMBER_ID,
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.createTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects malformed linked context without calling service", async () => {
    const result = await editableTaskActions.createTaskAction({
      organizationId: ORG_ID,
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
    expect(mutationMocks.createTaskMutation).not.toHaveBeenCalled();
  });

  it("returns committed refresh failure unchanged without retrying", async () => {
    mutationMocks.createTaskMutation.mockResolvedValue(committedRefreshFailure);

    const result = await editableTaskActions.createTaskAction(validInput);

    expect(result).toEqual(committedRefreshFailure);
    expect(mutationMocks.createTaskMutation).toHaveBeenCalledTimes(1);
  });

  it("returns service errors unchanged", async () => {
    mutationMocks.createTaskMutation.mockResolvedValue(serviceFailure);

    const result = await editableTaskActions.createTaskAction(validInput);

    expect(result).toEqual(serviceFailure);
  });
});

describe("updateTaskAction", () => {
  const validInput = {
    organizationId: ORG_ID,
    taskId: TASK_ID,
    title: "Updated title",
  };

  it("forwards only update-authorized fields", async () => {
    await editableTaskActions.updateTaskAction(validInput);

    expect(mutationMocks.updateTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: {
        taskId: TASK_ID,
        title: "Updated title",
        taskType: "general",
        priority: "normal",
      },
    });
  });

  it("rejects due date changes through update action", async () => {
    const result = await editableTaskActions.updateTaskAction({
      ...validInput,
      dueAt: "2026-07-20T10:00:00.000Z",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.updateTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects assignee changes through update action", async () => {
    const result = await editableTaskActions.updateTaskAction({
      ...validInput,
      assigneeMemberId: MEMBER_ID,
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.updateTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects lifecycle fields", async () => {
    const result = await editableTaskActions.updateTaskAction({
      ...validInput,
      status: "completed",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.updateTaskMutation).not.toHaveBeenCalled();
  });

  it("preserves committed refresh failure", async () => {
    mutationMocks.updateTaskMutation.mockResolvedValue(committedRefreshFailure);
    const result = await editableTaskActions.updateTaskAction(validInput);
    expect(result).toEqual(committedRefreshFailure);
    expect(mutationMocks.updateTaskMutation).toHaveBeenCalledTimes(1);
  });
});

describe("reassignTaskAction", () => {
  it("forwards valid assignee UUID", async () => {
    await editableTaskActions.reassignTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      assigneeMemberId: MEMBER_ID,
    });

    expect(mutationMocks.reassignTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, assigneeMemberId: MEMBER_ID },
    });
  });

  it("forwards null unassign", async () => {
    await editableTaskActions.reassignTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      assigneeMemberId: null,
    });

    expect(mutationMocks.reassignTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, assigneeMemberId: null },
    });
  });

  it("rejects malformed assignee", async () => {
    const result = await editableTaskActions.reassignTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      assigneeMemberId: "not-a-uuid",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.reassignTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects unrelated fields", async () => {
    const result = await editableTaskActions.reassignTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      title: "Should not pass",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.reassignTaskMutation).not.toHaveBeenCalled();
  });
});

describe("rescheduleTaskAction", () => {
  it("forwards valid due timestamp", async () => {
    await editableTaskActions.rescheduleTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      dueAt: "2026-07-20T10:00:00.000Z",
    });

    expect(mutationMocks.rescheduleTaskMutation).toHaveBeenCalledWith({
      supabase: mockSupabase,
      organizationId: ORG_ID,
      input: { taskId: TASK_ID, dueAt: "2026-07-20T10:00:00.000Z" },
    });
  });

  it("rejects malformed timestamp", async () => {
    const result = await editableTaskActions.rescheduleTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      dueAt: "not-a-date",
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.rescheduleTaskMutation).not.toHaveBeenCalled();
  });

  it("rejects unrelated fields", async () => {
    const result = await editableTaskActions.rescheduleTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      dueAt: "2026-07-20T10:00:00.000Z",
      assigneeMemberId: MEMBER_ID,
    });

    expect(result.ok).toBe(false);
    expect(mutationMocks.rescheduleTaskMutation).not.toHaveBeenCalled();
  });
});

describe("editable task action client wiring", () => {
  const actionCases = [
    {
      name: "createTaskAction",
      run: () =>
        editableTaskActions.createTaskAction({
          organizationId: ORG_ID,
          title: "Follow up",
          dueAt: "2026-07-15T10:00:00.000Z",
          leadId: LEAD_ID,
        }),
      service: mutationMocks.createTaskMutation,
    },
    {
      name: "updateTaskAction",
      run: () =>
        editableTaskActions.updateTaskAction({
          organizationId: ORG_ID,
          taskId: TASK_ID,
          title: "Updated",
        }),
      service: mutationMocks.updateTaskMutation,
    },
    {
      name: "reassignTaskAction",
      run: () =>
        editableTaskActions.reassignTaskAction({
          organizationId: ORG_ID,
          taskId: TASK_ID,
          assigneeMemberId: MEMBER_ID,
        }),
      service: mutationMocks.reassignTaskMutation,
    },
    {
      name: "rescheduleTaskAction",
      run: () =>
        editableTaskActions.rescheduleTaskAction({
          organizationId: ORG_ID,
          taskId: TASK_ID,
          dueAt: "2026-07-20T10:00:00.000Z",
        }),
      service: mutationMocks.rescheduleTaskMutation,
    },
  ] as const;

  it.each(actionCases)("uses createSupabaseServerClient for $name", async ({ run, service }) => {
    await run();
    expect(serverClientMock).toHaveBeenCalledTimes(1);
    expect(service).toHaveBeenCalledWith(
      expect.objectContaining({ supabase: mockSupabase }),
    );
  });

  it.each(actionCases)("invokes service exactly once for $name", async ({ run, service }) => {
    await run();
    expect(service).toHaveBeenCalledTimes(1);
  });
});

describe("editable task action unexpected exceptions", () => {
  it("sanitizes server-client factory failure", async () => {
    serverClientMock.mockRejectedValue(new Error("cookie store unavailable"));

    const result = await editableTaskActions.createTaskAction({
      organizationId: ORG_ID,
      title: "Follow up",
      dueAt: "2026-07-15T10:00:00.000Z",
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("UNEXPECTED_ERROR");
      expect(result.error.message).toBe("Something went wrong. Please try again.");
      expect(result.error.message).not.toMatch(/cookie/i);
    }
    expect(mutationMocks.createTaskMutation).not.toHaveBeenCalled();
  });

  it("sanitizes unexpected service throw", async () => {
    mutationMocks.updateTaskMutation.mockRejectedValue(new Error("module exploded"));

    const result = await editableTaskActions.updateTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      title: "Updated",
    });

    expect(result.ok).toBe(false);
    if (!result.ok && !result.committed) {
      expect(result.error.code).toBe("UNEXPECTED_ERROR");
      expect(result.error.message).not.toMatch(/exploded/i);
    }
  });
});

describe("editable task action duplicate invocation", () => {
  it("does not retry after typed service failure", async () => {
    mutationMocks.rescheduleTaskMutation.mockResolvedValue(serviceFailure);

    await editableTaskActions.rescheduleTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      dueAt: "2026-07-20T10:00:00.000Z",
    });

    expect(mutationMocks.rescheduleTaskMutation).toHaveBeenCalledTimes(1);
  });

  it("does not retry after committed refresh failure", async () => {
    mutationMocks.reassignTaskMutation.mockResolvedValue(committedRefreshFailure);

    await editableTaskActions.reassignTaskAction({
      organizationId: ORG_ID,
      taskId: TASK_ID,
      assigneeMemberId: MEMBER_ID,
    });

    expect(mutationMocks.reassignTaskMutation).toHaveBeenCalledTimes(1);
  });
});
