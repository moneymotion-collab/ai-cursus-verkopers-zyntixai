import { afterEach, describe, expect, it } from "vitest";
import {
  isPublicRegistrationEnabled,
  isPublicRegistrationEntryPath,
  parsePublicRegistrationEnabled,
} from "@/features/auth/server/public-registration";

describe("parsePublicRegistrationEnabled", () => {
  it.each([
    [undefined, false],
    ["", false],
    ["false", false],
    ["FALSE", false],
    ["0", false],
    ["1", false],
    ["yes", false],
    ["on", false],
    ["true", true],
    ["TRUE", true],
    ["true ", true],
    [" TRUE ", true],
    ["unexpected", false],
    ["   ", false],
  ] as const)("parses %j as enabled=%s", (input, expected) => {
    expect(parsePublicRegistrationEnabled(input)).toBe(expected);
  });
});

describe("isPublicRegistrationEnabled", () => {
  const original = process.env.PUBLIC_REGISTRATION_ENABLED;

  afterEach(() => {
    if (original === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = original;
    }
  });

  it("reads process.env fail-closed and does not leak between cases", () => {
    delete process.env.PUBLIC_REGISTRATION_ENABLED;
    expect(isPublicRegistrationEnabled()).toBe(false);

    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    expect(isPublicRegistrationEnabled()).toBe(true);

    process.env.PUBLIC_REGISTRATION_ENABLED = "yes";
    expect(isPublicRegistrationEnabled()).toBe(false);
  });
});

describe("isPublicRegistrationEntryPath", () => {
  it("matches only the exact registration initiation path", () => {
    expect(isPublicRegistrationEntryPath("/register")).toBe(true);
    expect(isPublicRegistrationEntryPath("/register/check-email")).toBe(false);
    expect(isPublicRegistrationEntryPath("/register/complete")).toBe(false);
    expect(isPublicRegistrationEntryPath("/auth/callback")).toBe(false);
  });
});
