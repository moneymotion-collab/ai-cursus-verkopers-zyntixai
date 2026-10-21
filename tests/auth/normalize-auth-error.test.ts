import { describe, expect, it } from "vitest";
import {
  getInvalidCredentialsMessage,
  getRecoveryExpiredMessage,
  getRecoveryGenericSuccessMessage,
  getSessionExpiredMessage,
  normalizeLoginError,
  normalizePasswordUpdateError,
  normalizeRecoveryRequestError,
  recoveryErrorMessage,
} from "@/features/auth/server/normalize-auth-error";

describe("normalizeLoginError", () => {
  it("maps invalid credentials to the product message", () => {
    expect(
      normalizeLoginError({
        message: "Invalid login credentials",
        status: 400,
      }),
    ).toBe(getInvalidCredentialsMessage());
  });

  it("does not treat every HTTP 400 as invalid credentials", () => {
    expect(
      normalizeLoginError({
        message: "Unexpected auth configuration fault",
        status: 400,
      }),
    ).toBe("Unable to sign in. Please try again.");
  });

  it("never returns raw provider error text", () => {
    const message = normalizeLoginError({
      message: "JWT secret leak abcdef",
      status: 500,
    });
    expect(message).not.toMatch(/JWT secret leak/i);
    expect(message).toBe("Unable to sign in. Please try again.");
  });

  it("exposes the session-expired product message", () => {
    expect(getSessionExpiredMessage()).toBe("Your session expired. Sign in again.");
  });
});

describe("recovery error mapping", () => {
  it("maps rate limits and expired recovery sessions safely", () => {
    expect(normalizeRecoveryRequestError({ code: "over_email_send_rate_limit" })).toBe(
      "rate_limited",
    );
    expect(normalizePasswordUpdateError({ status: 401, message: "session missing" })).toBe(
      "recovery_expired",
    );
    expect(recoveryErrorMessage("recovery_expired")).toBe(getRecoveryExpiredMessage());
    expect(getRecoveryGenericSuccessMessage()).toMatch(/If an account exists/i);
  });
});
