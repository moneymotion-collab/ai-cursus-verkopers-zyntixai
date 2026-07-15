import { describe, expect, it } from "vitest";
import {
  customerUnavailableError,
  insufficientRoleError,
  invalidInputError,
  mapOrganizationContextError,
  normalizeCustomerError,
} from "@/features/customers/server/normalize-customer-error";

describe("normalizeCustomerError", () => {
  it("maps authentication errors safely", () => {
    const result = normalizeCustomerError({ message: "not authenticated" });
    expect(result.code).toBe("AUTH_REQUIRED");
    expect(result.message).not.toContain("not authenticated");
  });

  it("maps transport failures without leaking internals", () => {
    const result = normalizeCustomerError({ message: "fetch failed", status: 503 });
    expect(result.code).toBe("NETWORK_ERROR");
    expect(result.retryable).toBe(true);
    expect(result.message).not.toContain("fetch failed");
  });

  it("maps organization context task errors", () => {
    const result = mapOrganizationContextError({
      code: "ORG_CONTEXT_MISSING",
      message: "internal",
      retryable: false,
      category: "not_found",
    });
    expect(result.code).toBe("ORG_CONTEXT_MISSING");
  });

  it("maps mutation role failures", () => {
    const result = normalizeCustomerError({ message: "insufficient role to archive customers" });
    expect(result.code).toBe("INSUFFICIENT_ROLE");
    expect(result.message).not.toContain("insufficient role");
  });

  it("maps duplicate customer email", () => {
    const result = normalizeCustomerError({
      message: "customer email already exists in organization",
    });
    expect(result.code).toBe("DUPLICATE_CUSTOMER");
    expect(result.retryable).toBe(false);
  });

  it("maps unique constraint violations", () => {
    const result = normalizeCustomerError({ message: "duplicate key", code: "23505" });
    expect(result.code).toBe("DUPLICATE_CUSTOMER");
  });

  it("maps invalid owner", () => {
    const result = normalizeCustomerError({
      message: "invalid owner_member_id for organization",
    });
    expect(result.code).toBe("INVALID_OWNER");
  });

  it("maps archived transition failures", () => {
    const result = normalizeCustomerError({
      message: "archived customers cannot transition status",
    });
    expect(result.code).toBe("ARCHIVED_RECORD");
  });

  it("maps no-op transitions to invalid state", () => {
    const result = normalizeCustomerError({ message: "status transition is a no-op" });
    expect(result.code).toBe("INVALID_STATE");
  });

  it("maps prohibited transitions", () => {
    const result = normalizeCustomerError({ message: "status transition not allowed" });
    expect(result.code).toBe("TRANSITION_NOT_ALLOWED");
  });
});

describe("customer read error helpers", () => {
  it("uses indistinguishable unavailable messaging", () => {
    const error = customerUnavailableError();
    expect(error.code).toBe("CUSTOMER_UNAVAILABLE");
    expect(error.message).toBe("Customer not found or access denied.");
  });

  it("returns invalid input with field errors", () => {
    const error = invalidInputError({ page: "invalid" });
    expect(error.code).toBe("INVALID_INPUT");
    expect(error.fieldErrors?.page).toBe("invalid");
  });

  it("returns insufficient role helper", () => {
    const error = insufficientRoleError();
    expect(error.code).toBe("INSUFFICIENT_ROLE");
    expect(error.retryable).toBe(false);
  });
});
