import { describe, expect, it } from "vitest";
import {
  DEFAULT_RETURN_PATH,
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";

describe("resolveSafeReturnPath", () => {
  it("accepts the default root path", () => {
    expect(resolveSafeReturnPath("/")).toBe("/");
    expect(resolveSafeReturnPath(undefined)).toBe(DEFAULT_RETURN_PATH);
    expect(resolveSafeReturnPath("")).toBe(DEFAULT_RETURN_PATH);
  });

  it("accepts Leads, Customers, and Tasks paths including nested routes", () => {
    expect(resolveSafeReturnPath("/leads")).toBe("/leads");
    expect(resolveSafeReturnPath("/leads/11111111-1111-4111-8111-111111111111/edit")).toBe(
      "/leads/11111111-1111-4111-8111-111111111111/edit",
    );
    expect(resolveSafeReturnPath("/customers")).toBe("/customers");
    expect(resolveSafeReturnPath("/customers/new")).toBe("/customers/new");
    expect(resolveSafeReturnPath("/tasks")).toBe("/tasks");
    expect(resolveSafeReturnPath("/tasks/22222222-2222-4222-8222-222222222222")).toBe(
      "/tasks/22222222-2222-4222-8222-222222222222",
    );
  });

  it("preserves safe query strings on allowlisted paths", () => {
    expect(resolveSafeReturnPath("/leads?org=11111111-1111-4111-8111-111111111111")).toBe(
      "/leads?org=11111111-1111-4111-8111-111111111111",
    );
    expect(resolveSafeReturnPath("/tasks?status=open&page=2")).toBe(
      "/tasks?status=open&page=2",
    );
  });

  it("rejects external absolute URLs", () => {
    expect(resolveSafeReturnPath("https://evil.example/phish")).toBe("/");
    expect(resolveSafeReturnPath("http://evil.example")).toBe("/");
  });

  it("rejects protocol-relative URLs", () => {
    expect(resolveSafeReturnPath("//evil.example/phish")).toBe("/");
  });

  it("rejects schemes, backslash tricks, encoded bypasses, and non-allowlisted routes", () => {
    expect(resolveSafeReturnPath("javascript:alert(1)")).toBe("/");
    expect(resolveSafeReturnPath("/\\evil")).toBe("/");
    expect(resolveSafeReturnPath("/%2F%2Fevil.example")).toBe("/");
    expect(resolveSafeReturnPath("/admin")).toBe("/");
    expect(resolveSafeReturnPath("/login")).toBe("/");
    expect(resolveSafeReturnPath("/settings")).toBe("/");
    expect(resolveSafeReturnPath("leads")).toBe("/");
    expect(resolveSafeReturnPath({ path: "/leads" })).toBe("/");
  });

  it("rejects similar-looking and prefix-adjacent route names", () => {
    expect(resolveSafeReturnPath("/lead")).toBe("/");
    expect(resolveSafeReturnPath("/leads-evil")).toBe("/");
    expect(resolveSafeReturnPath("/leads.evil")).toBe("/");
    expect(resolveSafeReturnPath("/customers-evil")).toBe("/");
    expect(resolveSafeReturnPath("/tasks-evil")).toBe("/");
    expect(resolveSafeReturnPath("/Leads")).toBe("/");
  });

  it("rejects path traversal that escapes allowlisted families", () => {
    expect(resolveSafeReturnPath("/leads/../../admin")).toBe("/");
    expect(resolveSafeReturnPath("/leads/%2e%2e/%2e%2e/admin")).toBe("/");
    expect(resolveSafeReturnPath("/leads/foo/../../admin")).toBe("/");
  });

  it("rejects encoded control characters, CRLF, and malformed percent encoding", () => {
    expect(resolveSafeReturnPath("/leads/%00extra")).toBe("/");
    expect(resolveSafeReturnPath("/leads%0d%0aLocation:%20https://evil.com")).toBe("/");
    expect(resolveSafeReturnPath("/leads%0a")).toBe("/");
    expect(resolveSafeReturnPath("/%09leads")).toBe("/");
    expect(resolveSafeReturnPath("/%zz")).toBe("/");
  });

  it("normalizes allowlisted traversal only onto other allowlisted destinations", () => {
    expect(resolveSafeReturnPath("/leads/../customers")).toBe("/customers");
    expect(resolveSafeReturnPath("/customers/%2e%2e/../leads")).toBe("/leads");
  });
});

describe("isProtectedApplicationPath", () => {
  it("marks product workspace routes as protected", () => {
    expect(isProtectedApplicationPath("/leads")).toBe(true);
    expect(isProtectedApplicationPath("/leads/new")).toBe(true);
    expect(isProtectedApplicationPath("/customers")).toBe(true);
    expect(isProtectedApplicationPath("/tasks/1/edit")).toBe(true);
    expect(isProtectedApplicationPath("/")).toBe(false);
    expect(isProtectedApplicationPath("/login")).toBe(false);
  });
});
