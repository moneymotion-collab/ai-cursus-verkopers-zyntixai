import { describe, expect, it } from "vitest";
import type { TaskMutationResult } from "@/features/tasks/domain/types";
import { interpretTaskMutationResult } from "@/features/tasks/ui/task-form-state";

const taskId = "11111111-1111-4111-8111-111111111111";

describe("interpretTaskMutationResult", () => {
  it("maps success with refresh hints", () => {
    const result = interpretTaskMutationResult({
      ok: true,
      taskId,
      task: {} as TaskMutationResult extends { ok: true; task: infer T } ? T : never,
      committed: true,
      refreshRequired: false,
      refreshHints: { task: true, taskLists: true, taskHistory: true },
    });
    expect(result).toEqual({
      kind: "success",
      taskId,
      refreshLists: true,
      refreshHistory: true,
    });
  });

  it("maps validation failures without raw errors", () => {
    const result = interpretTaskMutationResult({
      ok: false,
      committed: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "raw zod path title required",
        retryable: false,
        category: "validation",
        fieldErrors: { title: "Title is required" },
      },
    });
    expect(result.kind).toBe("field_error");
    if (result.kind === "field_error") {
      expect(result.fieldErrors.title).toEqual(["Title is required"]);
      expect(result.message).not.toContain("zod");
    }
  });

  it("maps committed refresh failure as reload required", () => {
    const result = interpretTaskMutationResult({
      ok: false,
      committed: true,
      taskId,
      refreshHints: { task: true, taskLists: true, taskHistory: true },
      error: {
        code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
        message: "raw postgres failure",
        retryable: false,
        category: "server",
        refreshRequired: true,
      },
    });
    expect(result).toMatchObject({
      kind: "reload_required",
      committed: true,
      taskId,
    });
    if (result.kind === "reload_required") {
      expect(result.message).not.toContain("postgres");
      expect(result.message).not.toContain("failed");
    }
  });

  it("uses lifecycle-specific committed refresh messages", () => {
    const complete = interpretTaskMutationResult(
      {
        ok: false,
        committed: true,
        taskId,
        refreshHints: { task: true, taskLists: true, taskHistory: true },
        error: {
          code: "MUTATION_COMMITTED_REFRESH_REQUIRED",
          message: "raw",
          retryable: false,
          category: "server",
          refreshRequired: true,
        },
      },
      { lifecycleOperation: "complete" },
    );
    if (complete.kind === "reload_required") {
      expect(complete.message).toContain("was completed");
    }
  });

  it("maps role denial and task unavailable states", () => {
    expect(
      interpretTaskMutationResult({
        ok: false,
        committed: false,
        error: {
          code: "INSUFFICIENT_ROLE",
          message: "raw",
          retryable: false,
          category: "permission",
        },
      }).kind,
    ).toBe("error");

    expect(
      interpretTaskMutationResult({
        ok: false,
        committed: false,
        error: {
          code: "TASK_NOT_FOUND",
          message: "raw",
          retryable: false,
          category: "not_found",
        },
      }).kind,
    ).toBe("error");
  });

  it("maps invalid assignee to field errors", () => {
    const result = interpretTaskMutationResult({
      ok: false,
      committed: false,
      error: {
        code: "INVALID_ASSIGNEE",
        message: "raw",
        retryable: false,
        category: "validation",
      },
    });
    expect(result.kind).toBe("field_error");
  });

  it("marks retryable transport failures explicitly", () => {
    const result = interpretTaskMutationResult({
      ok: false,
      committed: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: "raw",
        retryable: true,
        category: "server",
      },
    });
    expect(result).toMatchObject({ kind: "error", retryable: true });
  });
});
