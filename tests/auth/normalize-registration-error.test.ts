import { describe, expect, it } from "vitest";
import {
  normalizeProvisioningError,
  normalizeRegistrationAuthError,
  registrationErrorMessage,
} from "@/features/auth/server/normalize-registration-error";

describe("normalizeRegistrationAuthError", () => {
  it("maps duplicate email without leaking provider text", () => {
    const code = normalizeRegistrationAuthError({
      message: "User already registered [raw-secret]",
      code: "user_already_exists",
    });
    expect(code).toBe("email_unavailable");
    expect(registrationErrorMessage(code)).not.toMatch(/raw-secret/i);
    expect(registrationErrorMessage(code).toLowerCase()).not.toContain("already registered");
  });

  it("maps weak password and rate limits", () => {
    expect(
      normalizeRegistrationAuthError({ code: "weak_password", message: "Password is too weak" }),
    ).toBe("weak_password");
    expect(
      normalizeRegistrationAuthError({ status: 429, message: "rate limit exceeded" }),
    ).toBe("rate_limited");
  });

  it("maps expired verification tokens", () => {
    expect(
      normalizeRegistrationAuthError({
        message: "Email link is invalid or has expired",
        code: "otp_expired",
      }),
    ).toBe("verification_expired");
  });
});

describe("normalizeProvisioningError", () => {
  it("maps slug collisions and missing intent safely", () => {
    expect(
      normalizeProvisioningError({ message: "organization slug already exists" }),
    ).toBe("organization_creation_failed");
    expect(
      normalizeProvisioningError({ message: "registration intent required" }),
    ).toBe("provisioning_incomplete");
  });
});
