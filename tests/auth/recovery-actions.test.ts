import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordForEmailMock = vi.hoisted(() => vi.fn());
const updateUserMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));

vi.mock("@/lib/env/site-origin", () => ({
  resolveSiteOrigin: () => "https://app.example.com",
  buildAuthCallbackUrl: (origin: string, next?: string) =>
    next
      ? `${origin}/auth/callback?next=${encodeURIComponent(next)}`
      : `${origin}/auth/callback`,
}));

import {
  requestPasswordResetAction,
  updatePasswordAction,
} from "@/features/auth/actions/auth-actions";
import {
  getRecoveryGenericSuccessMessage,
  getRecoveryExpiredMessage,
} from "@/features/auth/server/normalize-auth-error";

describe("requestPasswordResetAction", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    resetPasswordForEmailMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockResolvedValue({
      auth: {
        resetPasswordForEmail: resetPasswordForEmailMock,
        updateUser: updateUserMock,
        signOut: signOutMock,
        getUser: getUserMock,
      },
    });
  });

  afterEach(() => {
    if (originalRegistrationFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = originalRegistrationFlag;
    }
  });

  it("requests recovery with the reset-password callback destination", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ data: {}, error: null });

    const result = await requestPasswordResetAction({
      email: "owner@example.com",
    });

    expect(resetPasswordForEmailMock).toHaveBeenCalledWith("owner@example.com", {
      redirectTo: "https://app.example.com/auth/callback?next=%2Freset-password",
    });
    expect(result).toEqual({
      ok: true,
      message: getRecoveryGenericSuccessMessage(),
    });
  });

  it("remains available when public registration is disabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    resetPasswordForEmailMock.mockResolvedValue({ data: {}, error: null });

    const result = await requestPasswordResetAction({
      email: "owner@example.com",
    });

    expect(result.ok).toBe(true);
    expect(resetPasswordForEmailMock).toHaveBeenCalled();
  });

  it("returns enumeration-safe success for most provider failures", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      data: {},
      error: { message: "User not found raw-secret", status: 400 },
    });

    const result = await requestPasswordResetAction({
      email: "unknown@example.com",
    });

    expect(result).toEqual({
      ok: true,
      message: getRecoveryGenericSuccessMessage(),
    });
    expect(JSON.stringify(result)).not.toMatch(/raw-secret/i);
  });

  it("surfaces rate limiting without revealing account existence", async () => {
    resetPasswordForEmailMock.mockResolvedValue({
      data: {},
      error: { code: "over_email_send_rate_limit", message: "rate limit" },
    });

    const result = await requestPasswordResetAction({
      email: "owner@example.com",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/Too many attempts/i);
    }
  });
});

describe("updatePasswordAction", () => {
  beforeEach(() => {
    updateUserMock.mockReset();
    signOutMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockResolvedValue({
      auth: {
        resetPasswordForEmail: resetPasswordForEmailMock,
        updateUser: updateUserMock,
        signOut: signOutMock,
        getUser: getUserMock,
      },
    });
  });

  it("updates password, signs out, and returns login success destination", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });
    updateUserMock.mockResolvedValue({ data: {}, error: null });
    signOutMock.mockResolvedValue({ error: null });

    const result = await updatePasswordAction({
      password: "correct-horse",
      confirmPassword: "correct-horse",
    });

    expect(updateUserMock).toHaveBeenCalledWith({ password: "correct-horse" });
    expect(signOutMock).toHaveBeenCalled();
    expect(result).toEqual({ ok: true, redirectTo: "/login?reset=success" });
  });

  it("rejects missing recovery session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const result = await updatePasswordAction({
      password: "correct-horse",
      confirmPassword: "correct-horse",
    });

    expect(updateUserMock).not.toHaveBeenCalled();
    expect(result).toEqual({
      ok: false,
      message: getRecoveryExpiredMessage(),
      redirectTo: "/forgot-password?reason=recovery_expired",
    });
  });

  it("rejects mismatched passwords without calling Auth", async () => {
    const result = await updatePasswordAction({
      password: "correct-horse",
      confirmPassword: "different-horse",
    });

    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.confirmPassword?.length).toBeGreaterThan(0);
    }
  });
});
