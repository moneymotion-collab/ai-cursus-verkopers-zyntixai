import { describe, expect, it } from "vitest";
import { normalizeProgramError } from "@/features/programs/server/normalize-program-error";

describe("normalizeProgramError", () => {
  it("maps known RPC messages to stable codes", () => {
    expect(normalizeProgramError(new Error("not authenticated")).code).toBe(
      "AUTH_REQUIRED",
    );
    expect(
      normalizeProgramError(new Error("insufficient role to create programs")).code,
    ).toBe("INSUFFICIENT_ROLE");
    expect(
      normalizeProgramError(
        new Error("program name already exists in organization"),
      ).code,
    ).toBe("DUPLICATE_PROGRAM");
    expect(
      normalizeProgramError(
        new Error("cannot archive program with open enrollments"),
      ).code,
    ).toBe("ARCHIVE_BLOCKED_OPEN_ENROLLMENTS");
    expect(
      normalizeProgramError(new Error("status transition not allowed")).code,
    ).toBe("TRANSITION_NOT_ALLOWED");
    expect(
      normalizeProgramError(new Error("program not found or not archived")).code,
    ).toBe("NOT_ARCHIVED");
    expect(normalizeProgramError(new Error("invalid delivery_mode")).code).toBe(
      "INVALID_DELIVERY_MODE",
    );
  });

  it("fails safely for unknown errors without leaking internals", () => {
    const mapped = normalizeProgramError(new Error("relation programs does not exist"));
    expect(mapped.code).toBe("UNEXPECTED_ERROR");
    expect(mapped.message).toBe("Something went wrong. Try again.");
    expect(mapped.message.toLowerCase()).not.toContain("relation");
  });
});
