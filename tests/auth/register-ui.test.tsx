import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const redirectMock = vi.hoisted(() => vi.fn());
const cookiesGetMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: cookiesGetMock,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
  redirect: redirectMock,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("a", { href, className }, children),
}));

import RegisterPage from "@/app/register/page";
import { RegisterForm } from "@/features/auth/ui/register-form";
import {
  CheckEmailPanel,
  CompleteRegistrationPanel,
} from "@/features/auth/ui/register-status";

describe("register UI contracts", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    cookiesGetMock.mockReset();
    cookiesGetMock.mockReturnValue(undefined);
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
  });

  afterEach(() => {
    if (originalRegistrationFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = originalRegistrationFlag;
    }
  });

  it("renders accessible register fields and login link", () => {
    const html = renderToStaticMarkup(<RegisterForm />);
    expect(html).toMatch(/method="post"/i);
    expect(html).toContain('id="register-name"');
    expect(html).toContain('id="register-email"');
    expect(html).toContain('id="register-password"');
    expect(html).toContain('id="register-company"');
    expect(html).toContain('for="register-name"');
    expect(html).toContain('autoComplete="new-password"');
    expect(html).toContain('href="/login"');
    expect(html).toContain("Create your account");
  });

  it("renders verification and recovery panels", () => {
    const checkEmail = renderToStaticMarkup(<CheckEmailPanel />);
    expect(checkEmail).toContain("Verify your email");
    expect(checkEmail).toContain("Already verified? Sign in");
    expect(checkEmail).toContain('href="/login"');

    const expired = renderToStaticMarkup(
      <CheckEmailPanel reason="verification_expired" />,
    );
    expect(expired).toContain("Sign in to continue");
    expect(expired.toLowerCase()).toContain("already verified");
    expect(checkEmail).toContain('id="resend-email"');
    expect(checkEmail).toContain("Resend verification email");
    expect(renderToStaticMarkup(<CompleteRegistrationPanel />)).toContain(
      "Finish account setup",
    );
  });

  it("exposes register routes in the app router", () => {
    const registerPage = readFileSync(
      join(process.cwd(), "src/app/register/page.tsx"),
      "utf8",
    );
    const checkEmail = readFileSync(
      join(process.cwd(), "src/app/register/check-email/page.tsx"),
      "utf8",
    );
    const complete = readFileSync(
      join(process.cwd(), "src/app/register/complete/page.tsx"),
      "utf8",
    );
    const callback = readFileSync(
      join(process.cwd(), "src/app/auth/callback/route.ts"),
      "utf8",
    );

    expect(registerPage).toContain("RegisterForm");
    expect(registerPage).toContain("isPublicRegistrationEnabled");
    expect(checkEmail).toContain("CheckEmailPanel");
    expect(complete).toContain("CompleteRegistrationPanel");
    expect(callback).toContain("exchangeCodeForSession");
    expect(callback).toContain("resolveSafeReturnPath");
  });

  it("uses pendingRef duplicate-submit guard in register form source", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/auth/ui/register-form.tsx"),
      "utf8",
    );
    expect(source).toContain("pendingRef");
    expect(source).toContain("aria-busy");
  });

  it("redirects /register to login when public registration is disabled without invite", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    await expect(RegisterPage()).rejects.toThrow(
      "NEXT_REDIRECT:/login?registration=disabled",
    );
  });

  it("renders the registration form when public registration is enabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    const element = await RegisterPage();
    const html = renderToStaticMarkup(element);
    expect(html).toContain('id="register-name"');
    expect(html).toContain("Create your account");
    expect(html).toContain('id="register-company"');
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
