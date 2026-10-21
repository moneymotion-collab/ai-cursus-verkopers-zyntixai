import { describe, expect, it } from "vitest";
import {
  parseForgotPasswordInput,
  parseResetPasswordInput,
} from "@/features/auth/server/recovery-schema";

describe("parseForgotPasswordInput", () => {
  it("accepts and normalizes email", () => {
    const result = parseForgotPasswordInput({ email: " Owner@Example.COM " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("owner@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = parseForgotPasswordInput({ email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("parseResetPasswordInput", () => {
  it("accepts matching passwords of sufficient length", () => {
    const result = parseResetPasswordInput({
      password: "correct-horse",
      confirmPassword: "correct-horse",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = parseResetPasswordInput({
      password: "short",
      confirmPassword: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = parseResetPasswordInput({
      password: "correct-horse",
      confirmPassword: "correct-horse-2",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.path[0] === "confirmPassword")).toBe(
        true,
      );
    }
  });
});
