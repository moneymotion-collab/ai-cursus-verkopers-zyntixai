import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";

const redirectMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const listMembershipsMock = vi.hoisted(() => vi.fn());
const cookiesGetMock = vi.hoisted(() => vi.fn());

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: cookiesGetMock,
  }),
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  useRouter: () => ({
    replace: vi.fn(),
    refresh: vi.fn(),
    push: vi.fn(),
  }),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createServerClientMock,
}));

vi.mock("@/features/organizations/server/resolve-organization-context", () => ({
  listActiveOrganizationMemberships: listMembershipsMock,
}));

import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import { LoginForm } from "@/features/auth/ui/login-form";
import { AppShell } from "@/components/app-shell";
import { getSessionExpiredMessage } from "@/features/auth/server/normalize-auth-error";

const ORG_A = "11111111-1111-4111-8111-111111111111";
const ORG_B = "22222222-2222-4222-8222-222222222222";

describe("root entry redirects", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    redirectMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    listMembershipsMock.mockReset();
    cookiesGetMock.mockReset();
    cookiesGetMock.mockReturnValue(undefined);
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
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
  });

  afterEach(() => {
    if (originalRegistrationFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = originalRegistrationFlag;
    }
  });

  it("redirects logged-out root visits to /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects single-organization users to organization-scoped leads", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    await expect(HomePage()).rejects.toThrow(`NEXT_REDIRECT:/leads?org=${ORG_A}`);
  });

  it("redirects multi-organization users to /leads and zero-org users to recovery", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "u1", email_confirmed_at: "2026-01-01T00:00:00Z" } },
      error: null,
    });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_A, role: "owner" },
        { organizationId: ORG_B, role: "staff" },
      ],
    });
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/leads");

    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/register/complete");
  });
});

describe("login page session-expired messaging", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    redirectMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
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

  it("renders the session-expired message when reason is present", async () => {
    const element = await LoginPage({
      searchParams: Promise.resolve({ reason: "session_expired", next: "/leads" }),
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain(getSessionExpiredMessage());
    expect(html).toContain('for="login-email"');
    expect(html).toContain('for="login-password"');
    expect(html).toMatch(/autoComplete="email"|autocomplete="email"/);
    expect(html).toMatch(/autoComplete="current-password"|autocomplete="current-password"/);
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain('href="/register"');
  });

  it("hides the registration link when public registration is disabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    const element = await LoginPage({
      searchParams: Promise.resolve({}),
    });
    const html = renderToStaticMarkup(element);
    expect(html).not.toContain('href="/register"');
    expect(html).toContain('href="/forgot-password"');
    expect(html).toContain("Sign in");
    expect(html).toContain('for="login-email"');
  });

  it("shows a neutral notice for registration=disabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    const element = await LoginPage({
      searchParams: Promise.resolve({ registration: "disabled" }),
    });
    const html = renderToStaticMarkup(element);
    expect(html).toContain("Public registration is currently unavailable.");
    expect(html).not.toContain('href="/register"');
    expect(html).not.toMatch(/PUBLIC_REGISTRATION_ENABLED|SMTP|environment/i);
  });
});

describe("login form pending and accessibility contract", () => {
  it("exposes labelled fields and pending copy in static markup", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        nextPath="/leads"
        sessionExpired
        sessionExpiredMessage={getSessionExpiredMessage()}
        showRegistrationLink
      />,
    );
    expect(html).toContain('id="login-email"');
    expect(html).toContain('id="login-password"');
    expect(html).toMatch(/method="post"/i);
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain(getSessionExpiredMessage());
    expect(html).toContain("Sign in");
    expect(html).toContain('href="/register"');
  });

  it("hides the registration link when showRegistrationLink is false", () => {
    const html = renderToStaticMarkup(
      <LoginForm
        showRegistrationLink={false}
        registrationUnavailableMessage="Public registration is currently unavailable."
      />,
    );
    expect(html).not.toContain('href="/register"');
    expect(html).toContain("Public registration is currently unavailable.");
    expect(html).toContain("Sign in");
  });

  it("uses a pending ref pattern to prevent duplicate submission", () => {
    const source = readFileSync(
      path.join(process.cwd(), "src/features/auth/ui/login-form.tsx"),
      "utf8",
    );
    expect(source).toContain("pendingRef");
    expect(source).toContain("disabled={isPending}");
    expect(source).toContain('aria-busy={isPending}');
    expect(source).toContain('method="post"');
    expect(source).toContain("event.preventDefault()");
    expect(source).not.toContain("process.env");
  });
});

describe("AppShell logout accessibility", () => {
  it("renders an accessible Log out control", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="leads" membersNavVisible={false}>
        <h1>Leads</h1>
      </AppShell>,
    );
    expect(html).toContain(">Log out<");
    expect(html).toContain('type="submit"');
    expect(html.match(/<main\b/g)?.length).toBe(1);
  });
});
