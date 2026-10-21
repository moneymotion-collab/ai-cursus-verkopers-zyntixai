import { describe, expect, it } from "vitest";
import {
  isMissingAuthSessionError,
  normalizeTaskError,
  resolveAuthAccessError,
} from "@/features/tasks/server/normalize-task-error";

function createMissingSessionError() {
  const error = new Error("Auth session missing!");
  error.name = "AuthSessionMissingError";
  return error;
}

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

  it("maps read query validation style errors via fallback", () => {
    const error = normalizeTaskError({ message: "column tasks.secret does not exist" });
    expect(error.code).toBe("UNEXPECTED_ERROR");
    expect(error.message).not.toMatch(/column/i);
  });

  it("maps terminal-only archive restriction", () => {
    const error = normalizeTaskError({ message: "only terminal tasks can be archived" });
    expect(error.code).toBe("INVALID_STATE_TRANSITION");
    expect(error.message).not.toMatch(/terminal/i);
  });

  it("maps terminal-only restore restriction", () => {
    const error = normalizeTaskError({ message: "only terminal tasks can be restored" });
    expect(error.code).toBe("INVALID_STATE_TRANSITION");
    expect(error.message).not.toMatch(/terminal/i);
  });

  it("maps invalid task type", () => {
    const error = normalizeTaskError({ message: "invalid task type" });
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid task type.");
  });

  it("maps invalid task priority", () => {
    const error = normalizeTaskError({ message: "invalid task priority" });
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).toBe("Invalid task priority.");
  });

  it("maps missing system idempotency key", () => {
    const error = normalizeTaskError({ message: "system idempotency key is required" });
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.message).not.toMatch(/idempotency key is required/i);
  });
});

describe("isMissingAuthSessionError", () => {
  it("recognizes AuthSessionMissingError shape", () => {
    expect(isMissingAuthSessionError(createMissingSessionError())).toBe(true);
  });

  it("recognizes compatibility message", () => {
    expect(isMissingAuthSessionError({ message: "Auth session missing!" })).toBe(true);
  });

  it("rejects unrelated auth errors", () => {
    expect(isMissingAuthSessionError(new Error("Invalid JWT"))).toBe(false);
  });
});

describe("resolveAuthAccessError", () => {
  it("maps missing session to AUTH_REQUIRED without leaking raw message", () => {
    const error = resolveAuthAccessError(createMissingSessionError());
    expect(error.code).toBe("AUTH_REQUIRED");
    expect(error.message).toBe("Please sign in to continue.");
    expect(error.message).not.toMatch(/Auth session missing/i);
  });

  it("maps network failures to NETWORK_ERROR", () => {
    const error = resolveAuthAccessError(new Error("fetch failed"));
    expect(error.code).toBe("NETWORK_ERROR");
    expect(error.message).not.toMatch(/fetch failed/i);
  });

  it("maps unknown values to UNEXPECTED_ERROR", () => {
    const error = resolveAuthAccessError({ message: "some unknown database glitch" });
    expect(error.code).toBe("UNEXPECTED_ERROR");
  });
});
