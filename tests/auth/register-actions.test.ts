import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const signUpMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const resendMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const listMembershipsMock = vi.hoisted(() => vi.fn());
const ensureIntentMock = vi.hoisted(() => vi.fn());
const tryProvisionMock = vi.hoisted(() => vi.fn());
const cookiesGetMock = vi.hoisted(() => vi.fn());
const cookiesSetMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: cookiesGetMock,
    set: cookiesSetMock,
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

vi.mock("@/features/auth/server/complete-owner-provisioning", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/auth/server/complete-owner-provisioning")
  >("@/features/auth/server/complete-owner-provisioning");
  return {
    ...actual,
    ensureRegistrationIntent: ensureIntentMock,
  };
});

vi.mock("@/features/auth/server/resolve-registration-destination", async () => {
  const actual = await vi.importActual<
    typeof import("@/features/auth/server/resolve-registration-destination")
  >("@/features/auth/server/resolve-registration-destination");
  return {
    ...actual,
    tryProvisionAndLand: tryProvisionMock,
  };
});

import {
  completeRegistrationAction,
  registerAction,
  resendVerificationAction,
} from "@/features/auth/actions/auth-actions";
import { registrationErrorMessage } from "@/features/auth/server/normalize-registration-error";

const ORG_A = "11111111-1111-4111-8111-111111111111";

describe("registerAction", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    signUpMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    listMembershipsMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesSetMock.mockReset();
    cookiesGetMock.mockReturnValue(undefined);

    createServerClientMock.mockResolvedValue({
      auth: {
        signUp: signUpMock,
        getUser: getUserMock,
        resend: resendMock,
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
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
  });

  afterEach(() => {
    if (originalRegistrationFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = originalRegistrationFlag;
    }
  });

  it("rejects when public registration is disabled without contacting Auth", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";

    const result = await registerAction({
      name: "Ada",
      email: "ada@example.com",
      password: "correct-horse",
      companyName: "Acme",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("registration_disabled");
      expect(result.message).toBe(registrationErrorMessage("registration_disabled"));
      expect(result.redirectTo).toBe("/login?registration=disabled");
    }
    expect(createServerClientMock).not.toHaveBeenCalled();
    expect(signUpMock).not.toHaveBeenCalled();
    expect(listMembershipsMock).not.toHaveBeenCalled();
    expect(ensureIntentMock).not.toHaveBeenCalled();
    expect(tryProvisionMock).not.toHaveBeenCalled();
  });

  it("signs up with only non-privileged metadata and returns verification required", async () => {
    signUpMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });

    const result = await registerAction({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
      companyName: "Analytical Engines",
      role: "admin",
      organizationId: ORG_A,
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("invalid_input");
    }
    expect(signUpMock).not.toHaveBeenCalled();

    const accepted = await registerAction({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "correct-horse",
      companyName: "Analytical Engines",
    });

    expect(signUpMock).toHaveBeenCalledWith({
      email: "ada@example.com",
      password: "correct-horse",
      options: {
        emailRedirectTo: expect.stringContaining("/auth/callback"),
        data: {
          display_name: "Ada Lovelace",
          company_name: "Analytical Engines",
        },
      },
    });
    expect(accepted).toEqual({
      ok: true,
      status: "verification_required",
      redirectTo: "/register/check-email",
    });
  });

  it("maps duplicate email to enumeration-safe email_unavailable", async () => {
    signUpMock.mockResolvedValue({
      data: { user: null },
      error: {
        message: "User already registered [provider-secret]",
        code: "user_already_exists",
      },
    });

    const result = await registerAction({
      name: "Ada",
      email: "ada@example.com",
      password: "correct-horse",
      companyName: "Acme",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("email_unavailable");
      expect(result.message).toBe(registrationErrorMessage("email_unavailable"));
      expect(JSON.stringify(result)).not.toMatch(/provider-secret/i);
    }
  });

  it("blocks authenticated users who already have memberships", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email_confirmed_at: "2026-01-01" } },
      error: null,
    });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });

    const result = await registerAction({
      name: "Ada",
      email: "ada@example.com",
      password: "correct-horse",
      companyName: "Acme",
    });

    expect(signUpMock).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("authenticated_user_cannot_self_register");
      expect(result.redirectTo).toBe(`/home?org=${ORG_A}`);
    }
  });

  it("sends incomplete authenticated users to recovery", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email_confirmed_at: "2026-01-01" } },
      error: null,
    });
    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });

    const result = await registerAction({
      name: "Ada",
      email: "ada@example.com",
      password: "correct-horse",
      companyName: "Acme",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("provisioning_incomplete");
      expect(result.redirectTo).toBe("/register/complete");
    }
  });
});

describe("resendVerificationAction", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    resendMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockResolvedValue({
      auth: {
        getUser: getUserMock,
        resend: resendMock,
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

  it("returns enumeration-safe messaging without email or session", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    const result = await resendVerificationAction();
    expect(result.ok).toBe(true);
    expect(result.message.toLowerCase()).toContain("verification");
    expect(resendMock).not.toHaveBeenCalled();
  });

  it("calls provider resend with email when no session exists", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    resendMock.mockResolvedValue({ data: {}, error: null });

    const result = await resendVerificationAction({
      email: "Ada@Example.COM",
    });

    expect(result.ok).toBe(true);
    expect(resendMock).toHaveBeenCalledWith({
      type: "signup",
      email: "ada@example.com",
      options: {
        emailRedirectTo: expect.stringContaining("/auth/callback"),
      },
    });
  });

  it("maps provider rate limits to a safe user message", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    resendMock.mockResolvedValue({
      data: {},
      error: { message: "email rate limit exceeded", status: 429 },
    });

    const result = await resendVerificationAction({
      email: "ada@example.com",
    });

    expect(result.ok).toBe(false);
    expect(result.message).toBe(registrationErrorMessage("rate_limited"));
  });

  it("returns enumeration-safe messaging for unknown accounts", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    resendMock.mockResolvedValue({
      data: {},
      error: { message: "User not found", status: 404 },
    });

    const result = await resendVerificationAction({
      email: "missing@example.com",
    });

    expect(result.ok).toBe(true);
    expect(result.message.toLowerCase()).toContain("verification");
  });
});

describe("completeRegistrationAction", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    getUserMock.mockReset();
    ensureIntentMock.mockReset();
    tryProvisionMock.mockReset();
    createServerClientMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesGetMock.mockReturnValue(undefined);
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
  });

  afterEach(() => {
    if (originalRegistrationFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = originalRegistrationFlag;
    }
  });

  it("provisions and returns product landing when public registration is enabled", async () => {
    getUserMock.mockResolvedValue({
      data: {
        user: {
          id: "u1",
          email_confirmed_at: "2026-01-01",
          user_metadata: { display_name: "Ada", company_name: "Acme" },
        },
      },
      error: null,
    });
    ensureIntentMock.mockResolvedValue({
      ok: true,
      displayName: "Ada",
      companyName: "Acme",
    });
    tryProvisionMock.mockResolvedValue({
      ok: true,
      path: `/home?org=${ORG_A}`,
    });

    const result = await completeRegistrationAction();
    expect(result).toEqual({ ok: true, redirectTo: `/home?org=${ORG_A}` });
  });

  it("denies owner completion when public registration is disabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    const result = await completeRegistrationAction();
    expect(result.ok).toBe(false);
    expect(result.redirectTo).toBe("/register/complete");
    expect(tryProvisionMock).not.toHaveBeenCalled();
    expect(createServerClientMock).not.toHaveBeenCalled();
  });
});
