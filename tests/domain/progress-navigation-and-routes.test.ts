import { describe, expect, it } from "vitest";
import {
  buildProgressCreateHref,
  buildProgressDetailHref,
  buildProgressListHref,
  isProgressPathname,
  PROGRESS_NAV_VISIBLE,
  PROGRESS_ROUTE,
} from "@/features/progress/domain/progress-navigation";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";

describe("progress navigation and routes", () => {
  it("shows Progress nav when list/detail routes exist", () => {
    expect(PROGRESS_NAV_VISIBLE).toBe(true);
    expect(PROGRESS_ROUTE).toBe("/progress");
  });

  it("builds list/detail/create hrefs with optional org and enrollment prefills", () => {
    expect(buildProgressListHref()).toBe("/progress");
    expect(buildProgressListHref("11111111-1111-4111-8111-111111111111")).toBe(
      "/progress?org=11111111-1111-4111-8111-111111111111",
    );
    expect(
      buildProgressDetailHref("55555555-5555-4555-8555-555555555555"),
    ).toBe("/progress/55555555-5555-4555-8555-555555555555");
    expect(
      buildProgressCreateHref({
        organizationId: "11111111-1111-4111-8111-111111111111",
        enrollmentId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      }),
    ).toBe(
      "/progress/new?org=11111111-1111-4111-8111-111111111111&enrollmentId=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    );
    expect(isProgressPathname("/progress/new")).toBe(true);
  });

  it("allowlists and protects /progress paths for safe return", () => {
    expect(resolveSafeReturnPath("/progress")).toBe("/progress");
    expect(resolveSafeReturnPath("/progress/new")).toBe("/progress/new");
    expect(
      resolveSafeReturnPath("/progress/55555555-5555-4555-8555-555555555555"),
    ).toBe("/progress/55555555-5555-4555-8555-555555555555");
    expect(
      resolveSafeReturnPath("/progress/55555555-5555-4555-8555-555555555555/void"),
    ).toBe("/progress/55555555-5555-4555-8555-555555555555/void");
    expect(isProtectedApplicationPath("/progress")).toBe(true);
    expect(isProtectedApplicationPath("/progress/abc/correct")).toBe(true);
  });
});
