import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const redirectMock = vi.hoisted(() => vi.fn());
const listMembershipsMock = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

import { loginAction, logoutAction } from "@/features/auth/actions/auth-actions";
import { getInvalidCredentialsMessage } from "@/features/auth/server/normalize-auth-error";

const ORG_A = "11111111-1111-4111-8111-111111111111";

describe("loginAction", () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    createServerClientMock.mockReset();
    listMembershipsMock.mockReset();
    redirectMock.mockReset();

    createServerClientMock.mockResolvedValue({
      auth: {
        signInWithPassword: signInWithPasswordMock,
        signOut: signOutMock,
        getUser: getUserMock,
      },
      from() {
        return {
          select() {
            return {
              eq() {
                return {
                  maybeSingle: async () => ({
                    data: { onboarding_completed_at: "2026-07-01T00:00:00.000Z" },
                    error: null,
                  }),
                };
              },
            };
          },
        };
      },
    });

    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });

    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
  });

  it("delegates valid credentials to signInWithPassword and returns a sanitized destination", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: null });

    const result = await loginAction({
      email: "owner@example.com",
      password: "correct-horse",
      next: "/tasks",
    });

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "correct-horse",
    });
    expect(result).toEqual({ ok: true, redirectTo: "/tasks" });
  });

  it("does not call Supabase for invalid input", async () => {
    const result = await loginAction({
      email: "not-an-email",
      password: "",
    });

    expect(signInWithPasswordMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.email?.length).toBeGreaterThan(0);
      expect(result.fieldErrors?.password?.length).toBeGreaterThan(0);
    }
  });

  it("normalizes invalid credentials without exposing provider errors", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {},
      error: {
        message: "Invalid login credentials [raw-provider-secret-xyz]",
        status: 400,
        code: "invalid_credentials",
      },
    });

    const result = await loginAction({
      email: "owner@example.com",
      password: "wrong",
    });

    expect(result).toEqual({
      ok: false,
      message: getInvalidCredentialsMessage(),
    });
    expect(JSON.stringify(result)).not.toMatch(/raw-provider-secret/i);
  });

  it("rejects unsafe return paths and lands on organization-scoped leads", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: {}, error: null });

    const result = await loginAction({
      email: "owner@example.com",
      password: "correct-horse",
      next: "https://evil.example/phish",
    });

    expect(result).toEqual({ ok: true, redirectTo: `/leads?org=${ORG_A}` });
  });
});

describe("logoutAction", () => {
  beforeEach(() => {
    signOutMock.mockReset();
    createServerClientMock.mockReset();
    redirectMock.mockReset();
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });

    createServerClientMock.mockResolvedValue({
      auth: {
        signInWithPassword: signInWithPasswordMock,
        signOut: signOutMock,
        getUser: getUserMock,
      },
    });
  });

  it("signs out through the server Supabase boundary and redirects to /login", async () => {
    signOutMock.mockResolvedValue({ error: null });

    await expect(logoutAction()).rejects.toThrow("NEXT_REDIRECT:/login");
    expect(signOutMock).toHaveBeenCalledTimes(1);
    expect(redirectMock).toHaveBeenCalledWith("/login");
  });
});
