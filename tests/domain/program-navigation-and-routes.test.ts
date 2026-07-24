import { describe, expect, it } from "vitest";
import {
  PROGRAMS_NAV_VISIBLE,
  PROGRAMS_ROUTE,
  buildProgramCreateHref,
  buildProgramDetailHref,
  buildProgramsListHref,
  isProgramsPathname,
} from "@/features/programs/domain/programs-navigation";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";

describe("programs navigation groundwork", () => {
  it("registers canonical routes without exposing a visible dead link", () => {
    expect(PROGRAMS_ROUTE).toBe("/programs");
    expect(PROGRAMS_NAV_VISIBLE).toBe(false);
    expect(isProgramsPathname("/programs")).toBe(true);
    expect(isProgramsPathname("/programs/new")).toBe(true);
    expect(isProgramsPathname("/programmes")).toBe(false);
  });

  it("builds org-scoped href helpers", () => {
    const orgId = "11111111-1111-4111-8111-111111111111";
    expect(buildProgramsListHref(orgId)).toContain(`org=${encodeURIComponent(orgId)}`);
    expect(buildProgramCreateHref(orgId)).toContain("/programs/new");
    expect(buildProgramDetailHref("22222222-2222-4222-8222-222222222222", orgId)).toContain(
      "/programs/",
    );
  });
});

describe("programs protected routes and safe return paths", () => {
  it("protects programs routes like other CRM workspaces", () => {
    expect(isProtectedApplicationPath("/programs")).toBe(true);
    expect(isProtectedApplicationPath("/programs/new")).toBe(true);
    expect(isProtectedApplicationPath("/programs/abc/edit")).toBe(true);
    expect(isProtectedApplicationPath("/programmes")).toBe(false);
  });

  it("allowlists programs return paths and rejects open redirects", () => {
    expect(resolveSafeReturnPath("/programs")).toBe("/programs");
    expect(resolveSafeReturnPath("/programs/new?org=x")).toBe("/programs/new?org=x");
    expect(resolveSafeReturnPath("https://evil.example/programs")).toBe("/");
    expect(resolveSafeReturnPath("//evil.example")).toBe("/");
  });

  it("leaves existing protected routes unaffected", () => {
    expect(isProtectedApplicationPath("/leads")).toBe(true);
    expect(isProtectedApplicationPath("/customers")).toBe(true);
    expect(isProtectedApplicationPath("/tasks/1/edit")).toBe(true);
    expect(isProtectedApplicationPath("/onboarding")).toBe(true);
    expect(isProtectedApplicationPath("/login")).toBe(false);
  });
});
