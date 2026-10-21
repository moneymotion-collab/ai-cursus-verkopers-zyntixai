import { describe, expect, it } from "vitest";
import { normalizeAttentionError } from "@/features/attention/server/normalize-attention-error";

describe("normalizeAttentionError RPC mapping", () => {
  it("maps B1.7.3 raise messages to Attention application codes", () => {
    expect(normalizeAttentionError(new Error("not authenticated")).code).toBe(
      "AUTH_REQUIRED",
    );
    expect(
      normalizeAttentionError(new Error("insufficient role")).code,
    ).toBe("INSUFFICIENT_ROLE");
    expect(
      normalizeAttentionError(new Error("attention item not found")).code,
    ).toBe("ATTENTION_ITEM_UNAVAILABLE");
    expect(normalizeAttentionError(new Error("enrollment not found")).code).toBe(
      "ENROLLMENT_UNAVAILABLE",
    );
    expect(
      normalizeAttentionError(new Error("invalid attention status transition"))
        .code,
    ).toBe("INVALID_STATE");
    expect(
      normalizeAttentionError(new Error("attention item is terminal")).code,
    ).toBe("INVALID_STATE");
    expect(
      normalizeAttentionError(new Error("attention item already archived")).code,
    ).toBe("CONFLICT");
    expect(
      normalizeAttentionError(
        new Error("attention item already open for dedupe key"),
      ).code,
    ).toBe("CONFLICT");
    expect(
      normalizeAttentionError(new Error("resolution reason required")).code,
    ).toBe("INVALID_INPUT");
  });

  it("keeps unknown errors fail-closed without inventing success", () => {
    const result = normalizeAttentionError(new Error("totally unknown boom"));
    expect(result.code).toBe("UNEXPECTED_ERROR");
    expect(result.retryable).toBe(true);
    expect(result.cause).toBe("totally unknown boom");
  });

  it("does not leak distinct cross-tenant existence via item-not-found mapping", () => {
    const missing = normalizeAttentionError(new Error("attention item not found"));
    expect(missing.message).toBe("Attention item not found or access denied.");
    expect(missing.category).toBe("not_found");
  });
});
