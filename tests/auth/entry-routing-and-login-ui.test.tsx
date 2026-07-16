import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import path from "node:path";

const redirectMock = vi.hoisted(() => vi.fn());
const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const listMembershipsMock = vi.hoisted(() => vi.fn());

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
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    listMembershipsMock.mockReset();
    redirectMock.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`);
    });
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
  });

  it("redirects logged-out root visits to /login", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/login");
  });

  it("redirects single-organization users to organization-scoped leads", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [{ organizationId: ORG_A, role: "owner" }],
    });
    await expect(HomePage()).rejects.toThrow(`NEXT_REDIRECT:/leads?org=${ORG_A}`);
  });

  it("redirects multi-organization and zero-organization users to /leads", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
    listMembershipsMock.mockResolvedValue({
      ok: true,
      memberships: [
        { organizationId: ORG_A, role: "owner" },
        { organizationId: ORG_B, role: "staff" },
      ],
    });
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/leads");

    listMembershipsMock.mockResolvedValue({ ok: true, memberships: [] });
    await expect(HomePage()).rejects.toThrow("NEXT_REDIRECT:/leads");
  });
});

describe("login page session-expired messaging", () => {
  beforeEach(() => {
    redirectMock.mockReset();
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    createServerClientMock.mockResolvedValue({
      auth: { getUser: getUserMock },
    });
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });
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
  });
});

describe("login form pending and accessibility contract", () => {
  it("exposes labelled fields and pending copy in static markup", () => {
    const html = renderToStaticMarkup(
      <LoginForm nextPath="/leads" sessionExpired sessionExpiredMessage={getSessionExpiredMessage()} />,
    );
    expect(html).toContain('id="login-email"');
    expect(html).toContain('id="login-password"');
    expect(html).toContain('type="email"');
    expect(html).toContain('type="password"');
    expect(html).toContain(getSessionExpiredMessage());
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
  });
});

describe("AppShell logout accessibility", () => {
  it("renders an accessible Log out control", () => {
    const html = renderToStaticMarkup(
      <AppShell activeNav="leads">
        <h1>Leads</h1>
      </AppShell>,
    );
    expect(html).toContain(">Log out<");
    expect(html).toContain('type="submit"');
    expect(html.match(/<main\b/g)?.length).toBe(1);
  });
});
