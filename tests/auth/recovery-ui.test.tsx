import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/features/auth/actions/auth-actions", () => ({
  requestPasswordResetAction: vi.fn(),
  updatePasswordAction: vi.fn(),
}));

import { ForgotPasswordForm } from "@/features/auth/ui/forgot-password-form";
import { ResetPasswordForm } from "@/features/auth/ui/reset-password-form";
import { LoginForm } from "@/features/auth/ui/login-form";
import {
  getRecoveryExpiredMessage,
  getPasswordResetSuccessMessage,
} from "@/features/auth/server/normalize-auth-error";

describe("password recovery UI", () => {
  it("renders forgot-password fields and accessibility contract", () => {
    const html = renderToStaticMarkup(<ForgotPasswordForm />);
    expect(html).toContain("Reset password");
    expect(html).toMatch(/method="post"/i);
    expect(html).toContain('id="forgot-email"');
    expect(html).toContain('for="forgot-email"');
    expect(html).toContain('type="email"');
    expect(html).toContain('href="/login"');
    expect(html).toContain("Send reset link");
  });

  it("renders recovery-expired notice on the request form", () => {
    const html = renderToStaticMarkup(<ForgotPasswordForm recoveryExpired />);
    expect(html).toContain(getRecoveryExpiredMessage());
  });

  it("renders expired reset state without a recovery session", () => {
    const html = renderToStaticMarkup(
      <ResetPasswordForm hasRecoverySession={false} />,
    );
    expect(html).toContain("Reset link expired");
    expect(html).toContain(getRecoveryExpiredMessage());
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain('href="/login"');
  });

  it("renders reset form fields when a recovery session exists", () => {
    const html = renderToStaticMarkup(
      <ResetPasswordForm hasRecoverySession />,
    );
    expect(html).toContain("Choose a new password");
    expect(html).toMatch(/method="post"/i);
    expect(html).toContain('id="reset-password"');
    expect(html).toContain('id="reset-confirm-password"');
    expect(html).toMatch(/autoComplete="new-password"|autocomplete="new-password"/);
    expect(html).toContain("Update password");
  });

  it("exposes forgot-password and optional registration links on login", () => {
    const withRegister = renderToStaticMarkup(
      <LoginForm showRegistrationLink passwordResetSuccessMessage={getPasswordResetSuccessMessage()} />,
    );
    expect(withRegister).toContain('href="/forgot-password"');
    expect(withRegister).toContain('href="/register"');
    expect(withRegister).toContain(getPasswordResetSuccessMessage());

    const withoutRegister = renderToStaticMarkup(
      <LoginForm showRegistrationLink={false} />,
    );
    expect(withoutRegister).toContain('href="/forgot-password"');
    expect(withoutRegister).not.toContain('href="/register"');
  });
});
