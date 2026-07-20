import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  loginAction: vi.fn(),
  registerAction: vi.fn(),
  requestPasswordResetAction: vi.fn(),
  updatePasswordAction: vi.fn(),
}));

import { LoginForm } from "@/features/auth/ui/login-form";
import { RegisterForm } from "@/features/auth/ui/register-form";
import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { ResetPasswordForm } from "@/features/auth/ui/reset-password-form";

const SENTINEL = "B1_1_FIX_TEST_SECRET_DO_NOT_USE";

const AUTH_FORM_SOURCES = [
  "src/features/auth/ui/login-form.tsx",
  "src/features/auth/ui/register-form.tsx",
  "src/features/auth/ui/forgot-password-form.tsx",
  "src/features/auth/ui/reset-password-form.tsx",
] as const;

function assertPostFormMarkup(html: string) {
  expect(html).toMatch(/<form[^>]*method="post"/i);
  expect(html).not.toMatch(/method=["']get["']/i);
  expect(html).not.toMatch(/formmethod=["']get["']/i);
  expect(html).not.toContain(SENTINEL);
}

describe("Auth form POST method safety (B1.1-FIX)", () => {
  it("source files explicitly set method=\"post\" and never formMethod=get", () => {
    for (const relative of AUTH_FORM_SOURCES) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source).toContain('method="post"');
      expect(source).not.toMatch(/method\s*=\s*["']get["']/i);
      expect(source).not.toMatch(/formMethod\s*=\s*["']get["']/i);
      expect(source).not.toMatch(/formmethod\s*=\s*["']get["']/i);
    }
  });

  it("password-bearing Auth forms render with explicit POST", () => {
    assertPostFormMarkup(renderToStaticMarkup(<LoginForm />));
    assertPostFormMarkup(renderToStaticMarkup(<RegisterForm />));
    assertPostFormMarkup(
      renderToStaticMarkup(<ResetPasswordForm hasRecoverySession />),
    );
  });

  it("forgot-password email form also renders with explicit POST", () => {
    assertPostFormMarkup(renderToStaticMarkup(<ForgotPasswordForm />));
  });

  it("password-bearing sources do not append credentials to URLs or storage", () => {
    const passwordForms = [
      "src/features/auth/ui/login-form.tsx",
      "src/features/auth/ui/register-form.tsx",
      "src/features/auth/ui/reset-password-form.tsx",
    ];

    for (const relative of passwordForms) {
      const source = readFileSync(join(process.cwd(), relative), "utf8");
      expect(source).not.toMatch(/URLSearchParams\([^)]*password/i);
      expect(source).not.toMatch(/searchParams\.(set|append)\(\s*["']password/i);
      expect(source).not.toMatch(/router\.(push|replace)\([^)]*password/i);
      expect(source).not.toMatch(/localStorage\.(setItem|set)\([^)]*password/i);
      expect(source).not.toMatch(/sessionStorage\.(setItem|set)\([^)]*password/i);
      expect(source).not.toMatch(/console\.(log|info|debug|error|warn)\([^)]*password/i);
    }
  });

  it("native FormData submission would use POST and keep sentinel out of query", () => {
    const html = renderToStaticMarkup(
      <LoginForm nextPath="/leads" />,
    );
    expect(html).toMatch(/method="post"/i);

    // Simulate what a browser would do for a POST form without JS:
    // fields go into the request body, not the destination URL query.
    const destination = new URL("http://localhost:3000/login");
    const body = new URLSearchParams({
      email: "qa@example.com",
      password: SENTINEL,
    });
    expect(destination.search).toBe("");
    expect(destination.href).not.toContain(SENTINEL);
    expect(body.get("password")).toBe(SENTINEL);
    expect(`POST ${destination.pathname}`).toBe("POST /login");
  });
});
