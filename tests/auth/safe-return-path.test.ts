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

  it("accepts Leads, Customers, Tasks, Programs, and Enrollments paths including nested routes", () => {
    expect(resolveSafeReturnPath("/home")).toBe("/home");
    expect(
      resolveSafeReturnPath("/home?org=11111111-1111-4111-8111-111111111111"),
    ).toBe("/home?org=11111111-1111-4111-8111-111111111111");
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
    expect(resolveSafeReturnPath("/programs")).toBe("/programs");
    expect(resolveSafeReturnPath("/programs/new")).toBe("/programs/new");
    expect(resolveSafeReturnPath("/enrollments")).toBe("/enrollments");
    expect(resolveSafeReturnPath("/enrollments/new")).toBe("/enrollments/new");
    expect(
      resolveSafeReturnPath("/enrollments/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit"),
    ).toBe("/enrollments/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa/edit");
    expect(resolveSafeReturnPath("/progress")).toBe("/progress");
    expect(resolveSafeReturnPath("/progress/new")).toBe("/progress/new");
    expect(
      resolveSafeReturnPath("/progress/55555555-5555-4555-8555-555555555555/void"),
    ).toBe("/progress/55555555-5555-4555-8555-555555555555/void");
    expect(resolveSafeReturnPath("/attention")).toBe("/attention");
    expect(
      resolveSafeReturnPath("/attention/55555555-5555-4555-8555-555555555555"),
    ).toBe("/attention/55555555-5555-4555-8555-555555555555");
    expect(
      resolveSafeReturnPath(
        "/attention?org=11111111-1111-4111-8111-111111111111&status=open",
      ),
    ).toBe("/attention?org=11111111-1111-4111-8111-111111111111&status=open");
    expect(resolveSafeReturnPath("/settings/members")).toBe("/settings/members");
    expect(
      resolveSafeReturnPath(
        "/settings/members?org=11111111-1111-4111-8111-111111111111",
      ),
    ).toBe("/settings/members?org=11111111-1111-4111-8111-111111111111");
  });

  it("accepts the onboarding path with a safe organization query", () => {
    expect(resolveSafeReturnPath("/onboarding")).toBe("/onboarding");
    expect(
      resolveSafeReturnPath("/onboarding?org=11111111-1111-4111-8111-111111111111"),
    ).toBe("/onboarding?org=11111111-1111-4111-8111-111111111111");
    expect(
      resolveSafeReturnPath(
        "/onboarding/operating-model?org=11111111-1111-4111-8111-111111111111",
      ),
    ).toBe(
      "/onboarding/operating-model?org=11111111-1111-4111-8111-111111111111",
    );
  });

  it("accepts exact Invitation continuation path and rejects /invite wildcards", () => {
    expect(resolveSafeReturnPath("/invite/accept")).toBe("/invite/accept");
    expect(resolveSafeReturnPath("/invite/accept?x=1")).toBe("/invite/accept?x=1");
    expect(resolveSafeReturnPath("/invite/accept/exchange")).toBe("/");
    expect(resolveSafeReturnPath("/invite")).toBe("/");
    expect(resolveSafeReturnPath("/invite/accept-evil")).toBe("/");
    expect(resolveSafeReturnPath("/invite/other")).toBe("/");
  });

  it("preserves safe query strings on allowlisted paths", () => {
    expect(resolveSafeReturnPath("/leads?org=11111111-1111-4111-8111-111111111111")).toBe(
      "/leads?org=11111111-1111-4111-8111-111111111111",
    );
    expect(resolveSafeReturnPath("/tasks?status=open&page=2")).toBe(
      "/tasks?status=open&page=2",
    );
  });

  it("accepts Enrollment Customer/Program contextual navigation query params (B1.5.9)", () => {
    expect(
      resolveSafeReturnPath(
        "/enrollments?customerId=11111111-1111-4111-8111-111111111111&org=22222222-2222-4222-8222-222222222222",
      ),
    ).toBe(
      "/enrollments?customerId=11111111-1111-4111-8111-111111111111&org=22222222-2222-4222-8222-222222222222",
    );
    expect(
      resolveSafeReturnPath("/enrollments/new?programId=22222222-2222-4222-8222-222222222222"),
    ).toBe("/enrollments/new?programId=22222222-2222-4222-8222-222222222222");
  });

  it("rejects protocol-relative and external absolute URLs even with contextual query params (B1.5.9)", () => {
    expect(
      resolveSafeReturnPath("//evil?customerId=11111111-1111-4111-8111-111111111111"),
    ).toBe("/");
    expect(
      resolveSafeReturnPath(
        "https://evil?customerId=11111111-1111-4111-8111-111111111111",
      ),
    ).toBe("/");
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
    expect(resolveSafeReturnPath("/attention-evil")).toBe("/");
    expect(resolveSafeReturnPath("/attentions")).toBe("/");
    expect(resolveSafeReturnPath("/settings/members-evil")).toBe("/");
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
  it("accepts registration recovery paths", () => {
    expect(resolveSafeReturnPath("/register")).toBe("/register");
    expect(resolveSafeReturnPath("/register/check-email")).toBe("/register/check-email");
    expect(resolveSafeReturnPath("/register/complete")).toBe("/register/complete");
    expect(resolveSafeReturnPath("/register/evil")).toBe("/");
  });

  it("accepts password-recovery paths and required allowlisted shapes", () => {
    expect(resolveSafeReturnPath("/forgot-password")).toBe("/forgot-password");
    expect(resolveSafeReturnPath("/reset-password")).toBe("/reset-password");
    expect(resolveSafeReturnPath("/leads")).toBe("/leads");
    expect(resolveSafeReturnPath("/customers?status=active")).toBe(
      "/customers?status=active",
    );
  });

  it("rejects unsafe redirect shapes required by B1.1", () => {
    expect(resolveSafeReturnPath("https://evil.example")).toBe("/");
    expect(resolveSafeReturnPath("//evil.example")).toBe("/");
    expect(resolveSafeReturnPath("javascript:alert(1)")).toBe("/");
    expect(resolveSafeReturnPath("data:text/html,test")).toBe("/");
    expect(resolveSafeReturnPath("")).toBe("/");
    expect(resolveSafeReturnPath("   ")).toBe("/");
    expect(resolveSafeReturnPath("/%zz")).toBe("/");
  });
});

describe("password recovery path helpers", () => {
  it("identifies recovery and reset destinations", async () => {
    const {
      isPasswordRecoveryPath,
      isPasswordResetDestination,
    } = await import("@/features/auth/server/safe-return-path");
    expect(isPasswordRecoveryPath("/forgot-password")).toBe(true);
    expect(isPasswordRecoveryPath("/reset-password")).toBe(true);
    expect(isPasswordRecoveryPath("/login")).toBe(false);
    expect(isPasswordResetDestination("/reset-password")).toBe(true);
    expect(isPasswordResetDestination("/reset-password?x=1")).toBe(true);
    expect(isPasswordResetDestination("/forgot-password")).toBe(false);
  });
});

describe("isProtectedApplicationPath", () => {
  it("marks product workspace routes as protected", () => {
    expect(isProtectedApplicationPath("/home")).toBe(true);
    expect(isProtectedApplicationPath("/home/")).toBe(true);
    expect(isProtectedApplicationPath("/leads")).toBe(true);
    expect(isProtectedApplicationPath("/leads/new")).toBe(true);
    expect(isProtectedApplicationPath("/customers")).toBe(true);
    expect(isProtectedApplicationPath("/tasks/1/edit")).toBe(true);
    expect(isProtectedApplicationPath("/programs")).toBe(true);
    expect(isProtectedApplicationPath("/programs/abc/edit")).toBe(true);
    expect(isProtectedApplicationPath("/enrollments")).toBe(true);
    expect(isProtectedApplicationPath("/enrollments/abc/edit")).toBe(true);
    expect(isProtectedApplicationPath("/progress")).toBe(true);
    expect(isProtectedApplicationPath("/progress/abc/correct")).toBe(true);
    expect(isProtectedApplicationPath("/attention")).toBe(true);
    expect(isProtectedApplicationPath("/attention/abc")).toBe(true);
    expect(isProtectedApplicationPath("/attention-evil")).toBe(false);
    expect(isProtectedApplicationPath("/settings/members")).toBe(true);
    expect(isProtectedApplicationPath("/settings/members-evil")).toBe(false);
    expect(isProtectedApplicationPath("/onboarding")).toBe(true);
    expect(isProtectedApplicationPath("/")).toBe(false);
    expect(isProtectedApplicationPath("/login")).toBe(false);
    expect(isProtectedApplicationPath("/register")).toBe(false);
  });
});
