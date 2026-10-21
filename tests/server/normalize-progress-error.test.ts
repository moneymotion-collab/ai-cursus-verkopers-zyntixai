import { describe, expect, it } from "vitest";
import {
  normalizeProgressError,
  progressFactUnavailableError,
  insufficientRoleError,
} from "@/features/progress/server/normalize-progress-error";

describe("normalizeProgressError", () => {
  it("maps proven RPC messages to safe application errors", () => {
    expect(normalizeProgressError(new Error("insufficient role")).code).toBe(
      "INSUFFICIENT_ROLE",
    );
    expect(normalizeProgressError(new Error("invalid fact type")).code).toBe(
      "INVALID_FACT_TYPE",
    );
    expect(
      normalizeProgressError(new Error("enrollment status does not allow progress"))
        .code,
    ).toBe("ENROLLMENT_STATUS_BLOCKS_PROGRESS");
    expect(normalizeProgressError(new Error("progress fact not found")).code).toBe(
      "PROGRESS_FACT_UNAVAILABLE",
    );
    expect(
      normalizeProgressError(new Error("idempotency key already consumed")).code,
    ).toBe("IDEMPOTENCY_CONFLICT");
  });

  it("does not leak raw messages into user-facing text for unknown errors", () => {
    const error = normalizeProgressError(
      new Error("secret org 11111111-1111-4111-8111-111111111111"),
    );
    expect(error.message).toBe("Something went wrong. Try again.");
    expect(error.message).not.toContain("11111111");
    expect(error.cause).toContain("secret org");
  });

  it("exposes safe factory helpers", () => {
    expect(progressFactUnavailableError().category).toBe("not_found");
    expect(insufficientRoleError().category).toBe("permission");
  });
});
