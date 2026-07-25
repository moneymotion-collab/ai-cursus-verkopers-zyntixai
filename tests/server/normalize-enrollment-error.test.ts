import { describe, expect, it } from "vitest";
import {
  archivedRecordError,
  authRequiredError,
  enrollmentUnavailableError,
  insufficientRoleError,
  invalidInputError,
  mutationCommittedRefreshRequiredError,
  normalizeEnrollmentError,
  orgContextMissingError,
  permissionDeniedError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/enrollments/server/normalize-enrollment-error";

describe("normalizeEnrollmentError", () => {
  it("maps known RPC messages to stable codes with user-safe messages", () => {
    expect(normalizeEnrollmentError(new Error("not authenticated")).code).toBe(
      "AUTH_REQUIRED",
    );
    expect(
      normalizeEnrollmentError(new Error("active organization membership required"))
        .code,
    ).toBe("ORG_CONTEXT_MISSING");
    expect(
      normalizeEnrollmentError(new Error("insufficient role to create enrollments"))
        .code,
    ).toBe("INSUFFICIENT_ROLE");
    expect(
      normalizeEnrollmentError(
        new Error("insufficient role to transition enrollment status"),
      ).code,
    ).toBe("INSUFFICIENT_ROLE");
    expect(
      normalizeEnrollmentError(new Error("insufficient role to archive enrollments"))
        .code,
    ).toBe("INSUFFICIENT_ROLE");
    expect(
      normalizeEnrollmentError(new Error("insufficient role to restore enrollments"))
        .code,
    ).toBe("INSUFFICIENT_ROLE");
    expect(normalizeEnrollmentError(new Error("invalid initial status")).code).toBe(
      "INVALID_STATUS",
    );
    expect(normalizeEnrollmentError(new Error("invalid enrollment source")).code).toBe(
      "INVALID_SOURCE",
    );
    expect(normalizeEnrollmentError(new Error("invalid source")).code).toBe(
      "INVALID_SOURCE",
    );
    expect(normalizeEnrollmentError(new Error("customer not found")).code).toBe(
      "CUSTOMER_UNAVAILABLE",
    );
    expect(
      normalizeEnrollmentError(
        new Error("archived customers cannot receive enrollments"),
      ).code,
    ).toBe("CUSTOMER_NOT_ELIGIBLE");
    expect(
      normalizeEnrollmentError(new Error("customer status does not allow enrollment"))
        .code,
    ).toBe("CUSTOMER_NOT_ELIGIBLE");
    expect(normalizeEnrollmentError(new Error("program not found")).code).toBe(
      "PROGRAM_UNAVAILABLE",
    );
    expect(
      normalizeEnrollmentError(
        new Error("archived programs cannot receive enrollments"),
      ).code,
    ).toBe("PROGRAM_NOT_ELIGIBLE");
    expect(normalizeEnrollmentError(new Error("program is not active")).code).toBe(
      "PROGRAM_NOT_ELIGIBLE",
    );
    expect(
      normalizeEnrollmentError(new Error("invalid owner_member_id for organization"))
        .code,
    ).toBe("INVALID_OWNER");
    expect(
      normalizeEnrollmentError(
        new Error("open enrollment already exists for customer and program"),
      ).code,
    ).toBe("DUPLICATE_OPEN_ENROLLMENT");
    expect(normalizeEnrollmentError(new Error("enrollment not found")).code).toBe(
      "ENROLLMENT_UNAVAILABLE",
    );
    expect(
      normalizeEnrollmentError(new Error("enrollment not found or already archived"))
        .code,
    ).toBe("ENROLLMENT_UNAVAILABLE");
    expect(
      normalizeEnrollmentError(new Error("enrollment not found or not archived")).code,
    ).toBe("NOT_ARCHIVED");
    expect(
      normalizeEnrollmentError(
        new Error("archived enrollments cannot transition status"),
      ).code,
    ).toBe("ARCHIVED_RECORD");
    expect(normalizeEnrollmentError(new Error("status transition is a no-op")).code).toBe(
      "INVALID_STATE",
    );
    expect(
      normalizeEnrollmentError(new Error("status transition not allowed")).code,
    ).toBe("TRANSITION_NOT_ALLOWED");
    expect(
      normalizeEnrollmentError(new Error("only terminal enrollments can be archived"))
        .code,
    ).toBe("ARCHIVE_REQUIRES_TERMINAL");
    expect(
      normalizeEnrollmentError(new Error("only terminal enrollments can be restored"))
        .code,
    ).toBe("ARCHIVE_REQUIRES_TERMINAL");
  });

  it("maps postgres 23505 unique violations to DUPLICATE_OPEN_ENROLLMENT", () => {
    const mapped = normalizeEnrollmentError({
      code: "23505",
      message: "duplicate key value violates unique constraint",
    });
    expect(mapped.code).toBe("DUPLICATE_OPEN_ENROLLMENT");
    expect(mapped.message).not.toMatch(/constraint/i);
  });

  it("fails safely for unknown errors without leaking internals", () => {
    const mapped = normalizeEnrollmentError(
      new Error("relation enrollments does not exist"),
    );
    expect(mapped.code).toBe("UNEXPECTED_ERROR");
    expect(mapped.message).toBe("Something went wrong. Try again.");
    expect(mapped.message.toLowerCase()).not.toContain("relation");
  });

  it("never leaks raw SQL text in the user-facing message for any mapped rule", () => {
    const messages = [
      "not authenticated",
      "insufficient role to create enrollments",
      "open enrollment already exists for customer and program",
      "enrollment not found or not archived",
    ];

    for (const raw of messages) {
      const mapped = normalizeEnrollmentError(new Error(raw));
      expect(mapped.message).not.toContain("SELECT");
      expect(mapped.message).not.toContain("relation");
      expect(mapped.message.length).toBeGreaterThan(0);
    }
  });

  it("classifies network and server transport errors", () => {
    expect(normalizeEnrollmentError(new Error("fetch failed")).code).toBe(
      "NETWORK_ERROR",
    );
    expect(
      normalizeEnrollmentError({ code: "PGRST301", message: "jwt expired" }).code,
    ).toBe("AUTH_REQUIRED");
    expect(normalizeEnrollmentError({ status: 429, message: "too many" }).code).toBe(
      "RATE_LIMITED",
    );
    expect(normalizeEnrollmentError({ status: 503, message: "down" }).code).toBe(
      "DATABASE_UNAVAILABLE",
    );
  });

  it("uses the provided fallback code for unmapped non-object errors", () => {
    const mapped = normalizeEnrollmentError("weird string error", {
      fallbackCode: "ENROLLMENT_UNAVAILABLE",
    });
    expect(mapped.code).toBe("ENROLLMENT_UNAVAILABLE");
  });
});

describe("enrollment error factories", () => {
  it("produce stable codes, categories, and messages", () => {
    expect(insufficientRoleError().code).toBe("INSUFFICIENT_ROLE");
    expect(archivedRecordError().code).toBe("ARCHIVED_RECORD");
    expect(permissionDeniedError().code).toBe("PERMISSION_DENIED");
    expect(orgContextMissingError().code).toBe("ORG_CONTEXT_MISSING");
    expect(authRequiredError().code).toBe("AUTH_REQUIRED");
    expect(enrollmentUnavailableError().code).toBe("ENROLLMENT_UNAVAILABLE");

    const refreshError = mutationCommittedRefreshRequiredError();
    expect(refreshError.code).toBe("MUTATION_COMMITTED_REFRESH_REQUIRED");
    expect(refreshError.refreshRequired).toBe(true);

    const invalidInput = invalidInputError({ customerId: "Required" });
    expect(invalidInput.code).toBe("INVALID_INPUT");
    expect(invalidInput.fieldErrors).toEqual({ customerId: "Required" });
  });

  it("maps zod field errors into a flat field map", () => {
    const fieldErrors = { enrollmentId: "Invalid uuid" };
    const mapped = validationErrorFromZod(fieldErrors);
    expect(mapped.code).toBe("INVALID_INPUT");
    expect(mapped.fieldErrors).toEqual(fieldErrors);
  });

  it("collapses zod issues to the first message per path, defaulting to form", () => {
    const zodError = {
      issues: [
        { path: ["customerId"], message: "Invalid uuid" },
        { path: ["customerId"], message: "Second issue ignored" },
        { path: [], message: "Top-level issue" },
      ],
    } as unknown as import("zod").ZodError;

    const fieldMap = zodErrorToFieldMap(zodError);
    expect(fieldMap.customerId).toBe("Invalid uuid");
    expect(fieldMap.form).toBe("Top-level issue");
  });
});
