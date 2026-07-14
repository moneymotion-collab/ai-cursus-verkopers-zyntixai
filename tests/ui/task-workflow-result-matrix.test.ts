import { describe, expect, it } from "vitest";
import {
  formIsLocked,
  interpretTaskMutationResult,
  type LifecycleOperation,
} from "@/features/tasks/ui/task-form-state";

const taskId = "11111111-1111-4111-8111-111111111111";

const REFRESH_MATRIX: Record<
  string,
  { task: boolean; taskLists: boolean; taskHistory: boolean; lifecycle?: LifecycleOperation }
> = {
  create: { task: true, taskLists: true, taskHistory: true },
  update: { task: true, taskLists: true, taskHistory: false },
  reassign: { task: true, taskLists: true, taskHistory: false },
  reschedule: { task: true, taskLists: true, taskHistory: false },
  complete: { task: true, taskLists: true, taskHistory: true, lifecycle: "complete" },
  cancel: { task: true, taskLists: true, taskHistory: true, lifecycle: "cancel" },
  archive: { task: true, taskLists: true, taskHistory: false, lifecycle: "archive" },
  restore: { task: true, taskLists: true, taskHistory: false, lifecycle: "restore" },
};

describe("task workflow result and refresh matrix", () => {
  for (const [operation, hints] of Object.entries(REFRESH_MATRIX)) {
    it(`maps ${operation} success refresh hints`, () => {
      const result = interpretTaskMutationResult({
        ok: true,
        taskId,
        task: {} as never,
        committed: true,
        refreshRequired: false,
        refreshHints: {
          task: true,
          taskLists: hints.taskLists,
          taskHistory: hints.taskHistory,
        },
      } as import("@/features/tasks/domain/types").TaskMutationResult);
      expect(result).toEqual({
        kind: "success",
        taskId,
        refreshLists: hints.taskLists,
        refreshHistory: hints.taskHistory,
      });
    });
  }

  it("locks forms after committed refresh failure for lifecycle operations", () => {
    for (const operation of ["complete", "cancel", "archive", "restore"] as const) {
      const state = interpretTaskMutationResult(
        {
          ok: false,
          committed: true,
          taskId,
          refreshHints: { task: true, taskLists: true, taskHistory: operation === "complete" || operation === "cancel" },
          error: {
            code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
            message: "raw",
            retryable: false,
            category: "server",
            refreshRequired: true,
          },
        },
        { lifecycleOperation: operation },
      );
      expect(formIsLocked(state)).toBe(true);
      if (state.kind === "reload_required") {
        expect(state.message.toLowerCase()).not.toContain("failed");
      }
    }
  });

  it("maps validation, role, unavailable, and linked-record failures safely", () => {
    expect(
      interpretTaskMutationResult({
        ok: false,
        committed: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "zod path",
          retryable: false,
          category: "validation",
          fieldErrors: { title: "Required" },
        },
      }).kind,
    ).toBe("field_error");

    expect(
      interpretTaskMutationResult({
        ok: false,
        committed: false,
        error: {
          code: "INSUFFICIENT_ROLE",
          message: "policy",
          retryable: false,
          category: "permission",
        },
      }),
    ).toMatchObject({ kind: "error", message: expect.stringContaining("permission") });

    expect(
      interpretTaskMutationResult({
        ok: false,
        committed: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: "uuid leak",
          retryable: false,
          category: "not_found",
        },
      }),
    ).toMatchObject({ kind: "error" });

    expect(
      interpretTaskMutationResult(
        {
          ok: false,
          committed: false,
          error: {
            code: "LINKED_ENTITY_ARCHIVED",
            message: "internal",
            retryable: false,
            category: "validation",
          },
        },
        { lifecycleOperation: "restore" },
      ),
    ).toMatchObject({
      kind: "error",
      message: expect.stringContaining("linked record"),
    });
  });
});
