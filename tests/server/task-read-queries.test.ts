import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TaskStatusHistoryRow } from "@/features/tasks/domain/types";
import type { TaskListRow } from "@/features/tasks/server/map-task-read-model";
import {
  consumeTaskReadSummary,
  getTaskById,
  getTaskStatusHistory,
  listTasks,
  listTasksForLead,
  listTasksForProject,
} from "@/features/tasks/server/task-read-queries";

const ORG_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";
const LEAD_ID = "33333333-3333-4333-8333-333333333333";
const MEMBER_ID = "44444444-4444-4444-8444-444444444444";
const USER_ID = "55555555-5555-4555-8555-555555555555";
const PROJECT_ID = "66666666-6666-4666-8666-666666666666";

type QueryResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

function createChainableQuery(result: QueryResult, options?: { thenable?: boolean }) {
  const builder: Record<string, unknown> = {};
  const chain = vi.fn(() => builder);
  builder.eq = chain;
  builder.is = chain;
  builder.in = chain;
  builder.lt = chain;
  builder.gt = chain;
  builder.gte = chain;
  builder.lte = chain;
  builder.ilike = chain;
  builder.order = chain;
  builder.range = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);

  if (options?.thenable) {
    const promise = Promise.resolve(result);
    builder.then = promise.then.bind(promise);
    builder.catch = promise.catch.bind(promise);
    builder.finally = promise.finally.bind(promise);
  }

  return builder;
}

function createReadMockSupabase(options: {
  user?: { id: string } | null;
  authError?: Error | { message: string; name?: string } | null;
  role?: string;
  timezone?: string | null;
  tasksList?: QueryResult;
  taskDetail?: QueryResult;
  taskExists?: QueryResult;
  history?: QueryResult;
  membershipError?: { message: string } | null;
}) {
  const activeMembershipQuery = vi.fn().mockResolvedValue({
    data: options.user
      ? [
          {
            id: MEMBER_ID,
            organization_id: ORG_ID,
            role: options.role ?? "staff",
            status: "active",
            user_id: options.user.id,
          },
        ]
      : [],
    error: options.membershipError ?? null,
  });
  const userEq = vi.fn().mockReturnValue({ eq: activeMembershipQuery });

  const from = vi.fn((table: string) => {
    if (table === "organization_members") {
      return {
        select: vi.fn().mockReturnValue({
          eq: userEq,
        }),
      };
    }

    if (table === "organizations") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { timezone: options.timezone ?? "UTC" },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === "tasks") {
      return {
        select: vi.fn((columns: string, opts?: { count?: string }) => {
          if (opts?.count === "exact") {
            return createChainableQuery(
              options.tasksList ?? { data: [], count: 0, error: null },
            );
          }

          if (columns === "id") {
            return {
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(
                  options.taskExists ?? { data: { id: TASK_ID }, error: null },
                ),
              }),
            };
          }

          return {
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue(
                options.taskDetail ?? { data: null, error: null },
              ),
            }),
          };
        }),
      };
    }

    if (table === "task_status_history") {
      return {
        select: vi.fn().mockReturnValue(
          createChainableQuery(options.history ?? { data: [], error: null }, { thenable: true }),
        ),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.authError ?? null,
      }),
    },
    from,
  } as unknown as SupabaseClient<Database>;
}

function createMissingSessionError() {
  const error = new Error("Auth session missing!");
  error.name = "AuthSessionMissingError";
  return error;
}

const sampleListRow: TaskListRow = {
  id: TASK_ID,
  organization_id: ORG_ID,
  title: "Follow up",
  status: "open",
  task_type: "follow_up",
  priority: "normal",
  source: "manual",
  due_at: "2026-07-15T10:00:00.000Z",
  assignee_member_id: MEMBER_ID,
  lead_id: LEAD_ID,
  customer_id: null,
  enrollment_id: null,
  program_id: null,
  project_id: null,
  archived_at: null,
  created_at: "2026-07-01T10:00:00.000Z",
};

describe("task read queries", () => {
  it("returns AUTH_REQUIRED for missing session on listTasks", async () => {
    const supabase = createReadMockSupabase({
      user: null,
      authError: createMissingSessionError(),
    });

    const result = await listTasks({ supabase, organizationId: ORG_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
      expect(result.error.message).not.toMatch(/Auth session missing/i);
    }
  });

  it("returns AUTH_REQUIRED for missing session on getTaskById", async () => {
    const supabase = createReadMockSupabase({
      user: null,
      authError: createMissingSessionError(),
    });

    const result = await getTaskById({
      supabase,
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("returns AUTH_REQUIRED for missing session on getTaskStatusHistory", async () => {
    const supabase = createReadMockSupabase({
      user: null,
      authError: createMissingSessionError(),
    });

    const result = await getTaskStatusHistory({
      supabase,
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("lists tasks with derived due-state mapping", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-14T10:00:00.000Z"));

    try {
      const supabase = createReadMockSupabase({
        user: { id: USER_ID },
        tasksList: { data: [sampleListRow], count: 1, error: null },
      });

      const result = await listTasks({
        supabase,
        organizationId: ORG_ID,
        pagination: { page: 1, pageSize: 25 },
      });

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].derived.upcoming).toBe(true);
        expect(result.data.pagination.totalCount).toBe(1);
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("delegates lead contextual query to listTasks", async () => {
    const supabase = createReadMockSupabase({
      user: { id: USER_ID },
      tasksList: { data: [sampleListRow], count: 1, error: null },
    });

    const result = await listTasksForLead({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items[0].linkedContext).toEqual({ kind: "lead", leadId: LEAD_ID });
    }
  });

  it("filters and maps tasks for a project context", async () => {
    const supabase = createReadMockSupabase({
      user: { id: USER_ID },
      tasksList: {
        data: [{ ...sampleListRow, lead_id: null, project_id: PROJECT_ID }],
        count: 1,
        error: null,
      },
    });

    const result = await listTasksForProject({
      supabase,
      organizationId: ORG_ID,
      projectId: PROJECT_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.items[0].linkedContext).toEqual({
        kind: "project",
        projectId: PROJECT_ID,
      });
    }

    const fromMock = vi.mocked(supabase.from);
    const taskCallIndex = fromMock.mock.calls.findIndex(([table]) => table === "tasks");
    const taskTable = fromMock.mock.results[taskCallIndex]?.value as {
      select: ReturnType<typeof vi.fn>;
    };
    const query = taskTable.select.mock.results[0]?.value as {
      eq: ReturnType<typeof vi.fn>;
    };
    expect(query.eq).toHaveBeenCalledWith("project_id", PROJECT_ID);
  });

  it("returns safe not-found for missing task", async () => {
    const supabase = createReadMockSupabase({
      user: { id: USER_ID },
      taskDetail: { data: null, error: null },
    });

    const result = await getTaskById({
      supabase,
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("TASK_NOT_FOUND");
      expect(result.error.message).toBe("Task not found or access denied.");
    }
  });

  it("maps task status history deterministically", async () => {
    const historyRow: TaskStatusHistoryRow = {
      id: "66666666-6666-4666-8666-666666666666",
      organization_id: ORG_ID,
      task_id: TASK_ID,
      from_status: "open",
      to_status: "completed",
      changed_by_member_id: MEMBER_ID,
      reason: null,
      source: "manual",
      created_at: "2026-07-02T10:00:00.000Z",
    };

    const supabase = createReadMockSupabase({
      user: { id: USER_ID },
      history: { data: [historyRow], error: null },
    });

    const result = await getTaskStatusHistory({
      supabase,
      organizationId: ORG_ID,
      taskId: TASK_ID,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data[0].toStatus).toBe("completed");
    }
  });

  it("rejects malformed query input", async () => {
    const supabase = createReadMockSupabase({ user: { id: USER_ID } });

    const result = await listTasks({
      supabase,
      organizationId: "not-a-uuid",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("VALIDATION_ERROR");
    }
  });

  it("sanitizes database errors", async () => {
    const supabase = createReadMockSupabase({
      user: { id: USER_ID },
      tasksList: { data: null, error: new Error("fetch failed"), count: null },
    });

    const result = await listTasks({ supabase, organizationId: ORG_ID });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("NETWORK_ERROR");
      expect(result.error.message).not.toMatch(/fetch failed/i);
    }
  });

  it("integration consumer returns typed summary", async () => {
    const supabase = createReadMockSupabase({
      user: { id: USER_ID },
      tasksList: { data: [sampleListRow], count: 3, error: null },
    });

    const result = await consumeTaskReadSummary(supabase, ORG_ID);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.openTaskCount).toBe(3);
      expect(result.data.sampleTaskId).toBe(TASK_ID);
    }
  });
});
