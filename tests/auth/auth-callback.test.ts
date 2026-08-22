import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const exchangeCodeForSessionMock = vi.hoisted(() => vi.fn());
const verifyOtpMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const getPublicSupabaseEnvMock = vi.hoisted(() => vi.fn());
const resolvePostAuthDestinationMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@/lib/env/public", () => ({
  getPublicSupabaseEnv: getPublicSupabaseEnvMock,
}));

vi.mock("@/features/auth/server/resolve-registration-destination", () => ({
  resolvePostAuthDestination: resolvePostAuthDestinationMock,
}));

import { GET } from "@/app/auth/callback/route";

describe("auth callback route", () => {
  beforeEach(() => {
    exchangeCodeForSessionMock.mockReset();
    verifyOtpMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    getPublicSupabaseEnvMock.mockReset();
    resolvePostAuthDestinationMock.mockReset();
    getPublicSupabaseEnvMock.mockReturnValue({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key",
    });
    createServerClientMock.mockImplementation(() => ({
      auth: {
        exchangeCodeForSession: exchangeCodeForSessionMock,
        verifyOtp: verifyOtpMock,
        getUser: getUserMock,
      },
    }));
  });

  it("rejects missing code for signup verification", async () => {
    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback"),
    );
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/register/check-email?reason=verification_expired",
    );
  });

  it("rejects provider errors for recovery destinations", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?error=access_denied&error_code=otp_expired&next=/reset-password",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/forgot-password?reason=recovery_expired",
    );
    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
  });

  it("lands recovery sessions on reset-password without post-auth destination", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=recovery-code&next=/reset-password",
      ),
    );

    expect(exchangeCodeForSessionMock).toHaveBeenCalledWith("recovery-code");
    expect(resolvePostAuthDestinationMock).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/reset-password",
    );
  });

  it("rejects unsafe next destinations and uses resolvePostAuthDestination path", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    resolvePostAuthDestinationMock.mockResolvedValue({
      kind: "product",
      path: "/leads?org=11111111-1111-4111-8111-111111111111",
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?code=signup-code&next=https://evil.example",
      ),
    );

    expect(resolvePostAuthDestinationMock).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/leads?org=11111111-1111-4111-8111-111111111111",
    );
  });

  it("accepts safe product next destinations after membership landing", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    resolvePostAuthDestinationMock.mockResolvedValue({
      kind: "product",
      path: "/leads?org=11111111-1111-4111-8111-111111111111",
    });

    const response = await GET(
      new NextRequest(
        `http://localhost:3000/auth/callback?code=signup-code&next=${encodeURIComponent("/customers?status=active")}`,
      ),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/customers?status=active",
    );
  });

  it("routes zero-membership verified users to complete without provisioning", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    resolvePostAuthDestinationMock.mockResolvedValue({
      kind: "complete_registration",
      path: "/register/complete",
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=signup-code"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/register/complete",
    );
  });

  it("exchanges email token_hash+type via verifyOtp and routes invite accept", async () => {
    verifyOtpMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    resolvePostAuthDestinationMock.mockResolvedValue({
      kind: "invite_accept",
      path: "/invite/accept",
    });

    const response = await GET(
      new NextRequest(
        "http://localhost:3000/auth/callback?token_hash=abc&type=signup&next=%2Finvite%2Faccept",
      ),
    );

    expect(exchangeCodeForSessionMock).not.toHaveBeenCalled();
    expect(verifyOtpMock).toHaveBeenCalledWith({
      type: "signup",
      token_hash: "abc",
    });
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/invite/accept",
    );
  });

  it("does not trap verified invite users on check-email after successful session", async () => {
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    resolvePostAuthDestinationMock.mockResolvedValue({
      kind: "invite_accept",
      path: "/invite/accept",
    });

    const response = await GET(
      new NextRequest("http://localhost:3000/auth/callback?code=signup-code"),
    );

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/invite/accept",
    );
    expect(response.headers.get("location")).not.toContain("check-email");
  });

  it("does not keep invite/auth redirects on a Vercel alias when SITE_URL is canonical", async () => {
    const previousSite = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://www.zyntixai.com";
    exchangeCodeForSessionMock.mockResolvedValue({ error: null });
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    resolvePostAuthDestinationMock.mockResolvedValue({
      kind: "invite_accept",
      path: "/invite/accept",
    });

    try {
      const response = await GET(
        new NextRequest(
          "https://zyntixai.vercel.app/auth/callback?code=signup-code&next=%2Finvite%2Faccept",
        ),
      );

      expect(response.headers.get("location")).toBe(
        "https://www.zyntixai.com/invite/accept",
      );
      expect(response.headers.get("location")).not.toContain("vercel.app");
      expect(response.headers.get("location")).not.toContain(
        "/register/complete",
      );
    } finally {
      if (previousSite === undefined) {
        delete process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        process.env.NEXT_PUBLIC_SITE_URL = previousSite;
      }
    }
  });
});
