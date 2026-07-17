import { describe, expect, it } from "vitest";
import { parseRegisterInput } from "@/features/auth/server/register-schema";

describe("parseRegisterInput", () => {
  it("accepts valid registration input and normalizes email", () => {
    const parsed = parseRegisterInput({
      name: "  Ada Lovelace  ",
      email: "  Ada@Example.COM ",
      password: "correct-horse-battery",
      companyName: "  Analytical Engines  ",
    });

    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "correct-horse-battery",
        companyName: "Analytical Engines",
      });
    }
  });

  it("rejects missing and whitespace-only name", () => {
    expect(parseRegisterInput({
      name: "   ",
      email: "a@example.com",
      password: "correct-horse",
      companyName: "Acme",
    }).success).toBe(false);

    expect(parseRegisterInput({
      email: "a@example.com",
      password: "correct-horse",
      companyName: "Acme",
    }).success).toBe(false);
  });

  it("rejects invalid email and weak password", () => {
    const invalidEmail = parseRegisterInput({
      name: "Ada",
      email: "not-an-email",
      password: "correct-horse",
      companyName: "Acme",
    });
    expect(invalidEmail.success).toBe(false);

    const weak = parseRegisterInput({
      name: "Ada",
      email: "a@example.com",
      password: "short",
      companyName: "Acme",
    });
    expect(weak.success).toBe(false);
  });

  it("rejects whitespace-only password and missing company", () => {
    expect(parseRegisterInput({
      name: "Ada",
      email: "a@example.com",
      password: "        ",
      companyName: "Acme",
    }).success).toBe(false);

    expect(parseRegisterInput({
      name: "Ada",
      email: "a@example.com",
      password: "correct-horse",
      companyName: " ",
    }).success).toBe(false);
  });

  it("rejects oversized fields and privilege injection fields", () => {
    const longName = parseRegisterInput({
      name: "x".repeat(81),
      email: "a@example.com",
      password: "correct-horse",
      companyName: "Acme",
    });
    expect(longName.success).toBe(false);

    const withRole = parseRegisterInput({
      name: "Ada",
      email: "a@example.com",
      password: "correct-horse",
      companyName: "Acme",
      role: "admin",
      organizationId: "11111111-1111-4111-8111-111111111111",
    });
    expect(withRole.success).toBe(false);
  });

  it("accepts unicode company and name values", () => {
    const parsed = parseRegisterInput({
      name: "Zoë",
      email: "zoe@example.com",
      password: "correct-horse",
      companyName: "Café Zürich",
    });
    expect(parsed.success).toBe(true);
  });
});
