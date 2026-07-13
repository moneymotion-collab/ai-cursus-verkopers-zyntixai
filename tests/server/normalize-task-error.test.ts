import { describe, expect, it } from "vitest";
import { normalizeTaskError } from "@/features/tasks/server/normalize-task-error";

describe("normalizeTaskError", () => {
  it("maps insufficient role without leaking org details", () => {
    const error = normalizeTaskError({ message: "insufficient role" });
    expect(error.code).toBe("INSUFFICIENT_ROLE");
    expect(error.message).not.toMatch(/organization/i);
  });

  it("sanitizes cross-org task not found", () => {
    const error = normalizeTaskError({ message: "task not found" });
    expect(error.code).toBe("TASK_NOT_FOUND");
    expect(error.message).toBe("Task not found or access denied.");
  });

  it("maps idempotency conflict", () => {
    const error = normalizeTaskError({ message: "idempotency payload conflict" });
    expect(error.code).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("falls back to unexpected error", () => {
    const error = normalizeTaskError({ message: "some unknown database glitch" });
    expect(error.code).toBe("UNEXPECTED_ERROR");
    expect(error.retryable).toBe(true);
  });
});
