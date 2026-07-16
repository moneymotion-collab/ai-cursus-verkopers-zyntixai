import { describe, expect, it } from "vitest";
import {
  getInvalidCredentialsMessage,
  getSessionExpiredMessage,
  normalizeLoginError,
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
