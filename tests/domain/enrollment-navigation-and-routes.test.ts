import { describe, expect, it } from "vitest";
import {
  ENROLLMENTS_NAV_VISIBLE,
  ENROLLMENTS_ROUTE,
  buildEnrollmentCreateHref,
  buildEnrollmentDetailHref,
  buildEnrollmentEditHref,
  buildEnrollmentsListHref,
  isEnrollmentsPathname,
} from "@/features/enrollments/domain/enrollments-navigation";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";

describe("enrollments navigation groundwork", () => {
  it("registers the canonical route but keeps the nav link hidden in B1.5.4", () => {
    expect(ENROLLMENTS_ROUTE).toBe("/enrollments");
    expect(ENROLLMENTS_NAV_VISIBLE).toBe(false);
  });

  it("identifies enrollments pathnames including nested routes", () => {
    expect(isEnrollmentsPathname("/enrollments")).toBe(true);
    expect(isEnrollmentsPathname("/enrollments/new")).toBe(true);
    expect(isEnrollmentsPathname("/enrollments/abc/edit")).toBe(true);
    expect(isEnrollmentsPathname("/enrollment")).toBe(false);
    expect(isEnrollmentsPathname("/enrollments-evil")).toBe(false);
  });

  it("builds org-scoped href helpers", () => {
    const orgId = "11111111-1111-4111-8111-111111111111";
    const enrollmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

    expect(buildEnrollmentsListHref(orgId)).toBe(
      `/enrollments?org=${encodeURIComponent(orgId)}`,
    );
    expect(buildEnrollmentsListHref()).toBe("/enrollments");

    expect(buildEnrollmentCreateHref(orgId)).toBe(
      `/enrollments/new?org=${encodeURIComponent(orgId)}`,
    );
    expect(buildEnrollmentCreateHref()).toBe("/enrollments/new");

    expect(buildEnrollmentDetailHref(enrollmentId, orgId)).toBe(
      `/enrollments/${enrollmentId}?org=${encodeURIComponent(orgId)}`,
    );
    expect(buildEnrollmentDetailHref(enrollmentId)).toBe(`/enrollments/${enrollmentId}`);

    expect(buildEnrollmentEditHref(enrollmentId, orgId)).toBe(
      `/enrollments/${enrollmentId}/edit?org=${encodeURIComponent(orgId)}`,
    );
    expect(buildEnrollmentEditHref(enrollmentId)).toBe(
      `/enrollments/${enrollmentId}/edit`,
    );
  });
});

describe("enrollments protected routes and safe return paths", () => {
  it("protects enrollments routes like other CRM workspaces", () => {
    expect(isProtectedApplicationPath("/enrollments")).toBe(true);
    expect(isProtectedApplicationPath("/enrollments/new")).toBe(true);
    expect(isProtectedApplicationPath("/enrollments/abc/edit")).toBe(true);
    expect(isProtectedApplicationPath("/enrollment")).toBe(false);
  });

  it("allowlists enrollments return paths and rejects open redirects", () => {
    expect(resolveSafeReturnPath("/enrollments")).toBe("/enrollments");
    expect(resolveSafeReturnPath("/enrollments/new?org=x")).toBe(
      "/enrollments/new?org=x",
    );
    expect(resolveSafeReturnPath("https://evil.example/enrollments")).toBe("/");
    expect(resolveSafeReturnPath("//evil.example")).toBe("/");
    expect(resolveSafeReturnPath("/enrollments-evil")).toBe("/");
  });

  it("leaves existing protected routes unaffected", () => {
    expect(isProtectedApplicationPath("/programs")).toBe(true);
    expect(isProtectedApplicationPath("/leads")).toBe(true);
    expect(isProtectedApplicationPath("/customers")).toBe(true);
    expect(isProtectedApplicationPath("/tasks/1/edit")).toBe(true);
    expect(isProtectedApplicationPath("/onboarding")).toBe(true);
    expect(isProtectedApplicationPath("/login")).toBe(false);
  });
});
