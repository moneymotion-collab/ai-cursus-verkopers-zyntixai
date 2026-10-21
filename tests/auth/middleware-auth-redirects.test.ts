import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const getUserMock = vi.hoisted(() => vi.fn());
const createServerClientMock = vi.hoisted(() => vi.fn());
const getPublicSupabaseEnvMock = vi.hoisted(() => vi.fn());

vi.mock("@supabase/ssr", () => ({
  createServerClient: createServerClientMock,
}));

vi.mock("@/lib/env/public", () => ({
  getPublicSupabaseEnv: getPublicSupabaseEnvMock,
}));

import { updateSession } from "@/lib/supabase/middleware";

describe("updateSession protected-route redirects", () => {
  const originalRegistrationFlag = process.env.PUBLIC_REGISTRATION_ENABLED;

  beforeEach(() => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    getUserMock.mockReset();
    createServerClientMock.mockReset();
    getPublicSupabaseEnvMock.mockReset();
    getPublicSupabaseEnvMock.mockReturnValue({
      url: "https://example.supabase.co",
      publishableKey: "publishable-key",
    });
    createServerClientMock.mockImplementation(() => ({
      auth: { getUser: getUserMock },
    }));
  });

  afterEach(() => {
    if (originalRegistrationFlag === undefined) {
      delete process.env.PUBLIC_REGISTRATION_ENABLED;
    } else {
      process.env.PUBLIC_REGISTRATION_ENABLED = originalRegistrationFlag;
    }
  });

  it("redirects logged-out protected routes to login with a safe return destination", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/leads?org=11111111-1111-4111-8111-111111111111");
    const response = await updateSession(request);

    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe(
      "/leads?org=11111111-1111-4111-8111-111111111111",
    );
  });

  it("marks expired-looking sessions with reason=session_expired", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/tasks", {
      headers: {
        cookie: "sb-example-auth-token=stale",
      },
    });
    const response = await updateSession(request);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.searchParams.get("reason")).toBe("session_expired");
  });

  it("redirects authenticated login visits to the root entry resolver", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/login?next=/tasks");
    const response = await updateSession(request);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/");
    expect(location.search).toBe("");
  });

  it("redirects authenticated /register visitors away from the form", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: "2026-01-01" } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/register");
    const response = await updateSession(request);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/");
  });

  it("blocks unverified users from protected product routes", async () => {
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email_confirmed_at: null } },
      error: null,
    });

    const request = new NextRequest("http://localhost:3000/leads");
    const response = await updateSession(request);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/register/check-email");
  });

  it("allows anonymous /register when public registration is disabled so page can enforce invite gate", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/register");
    const response = await updateSession(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not redirect logged-out visitors away from public /", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/");
    const response = await updateSession(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-document-language")).toBe(
      "nl",
    );
  });

  it("overwrites spoofed document-language metadata using the pathname allowlist", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const spoofedHome = new NextRequest("http://localhost:3000/?lang=en", {
      headers: { "x-document-language": "en" },
    });
    const homeResponse = await updateSession(spoofedHome);
    expect(homeResponse.status).toBe(200);
    expect(homeResponse.headers.get("x-middleware-request-x-document-language")).toBe(
      "nl",
    );

    const spoofedLogin = new NextRequest("http://localhost:3000/login", {
      headers: { "x-document-language": "nl" },
    });
    const loginResponse = await updateSession(spoofedLogin);
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers.get("location")).toBeNull();
    expect(loginResponse.headers.get("x-middleware-request-x-document-language")).toBe(
      "en",
    );

    const spoofedHomeProtected = new NextRequest("http://localhost:3000/home", {
      headers: { "x-document-language": "fr" },
    });
    const homeProtected = await updateSession(spoofedHomeProtected);
    expect(homeProtected.status).toBe(307);
    expect(new URL(homeProtected.headers.get("location") ?? "").pathname).toBe(
      "/login",
    );
  });

  it("still redirects logged-out /home visits to login with a safe return path", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/home");
    const response = await updateSession(request);
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/home");
  });

  it("redirects logged-out TG2–TG4 and Creating/Ready routes to login with a safe next path", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const paths = [
      "/projects?org=11111111-1111-4111-8111-111111111111",
      "/sites",
      "/work-orders/new",
      "/dispatch",
      "/products",
      "/orders/new",
      "/inventory",
      "/fulfillment",
      "/onboarding/creating?org=11111111-1111-4111-8111-111111111111",
      "/onboarding/ready?org=11111111-1111-4111-8111-111111111111",
    ];

    for (const path of paths) {
      const request = new NextRequest(`http://localhost:3000${path}`);
      const response = await updateSession(request);
      expect(response.status).toBe(307);
      const location = new URL(response.headers.get("location") ?? "");
      expect(location.pathname).toBe("/login");
      expect(location.searchParams.get("next")).toBe(path);
    }
  });

  it("does not treat prefix-adjacent TG workspace names as protected", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    for (const path of ["/projects-evil", "/sites-evil", "/orders-evil", "/onboarding/creating-evil"]) {
      const request = new NextRequest(`http://localhost:3000${path}`);
      const response = await updateSession(request);
      expect(response.headers.get("location")).toBeNull();
      expect(response.status).toBe(200);
    }
  });

  it("marks expired-looking TG workspace sessions with reason=session_expired", async () => {
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/projects", {
      headers: {
        cookie: "sb-example-auth-token=stale",
      },
    });
    const response = await updateSession(request);
    const location = new URL(response.headers.get("location") ?? "");
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("next")).toBe("/projects");
    expect(location.searchParams.get("reason")).toBe("session_expired");
  });

  it("allows anonymous /register when public registration is enabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "true";
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    const request = new NextRequest("http://localhost:3000/register");
    const response = await updateSession(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not block recovery or callback paths when registration is disabled", async () => {
    process.env.PUBLIC_REGISTRATION_ENABLED = "false";
    getUserMock.mockResolvedValue({ data: { user: null }, error: null });

    for (const path of [
      "/register/check-email",
      "/register/complete",
      "/auth/callback",
      "/forgot-password",
      "/reset-password",
    ]) {
      const request = new NextRequest(`http://localhost:3000${path}`);
      const response = await updateSession(request);
      expect(response.headers.get("location")).toBeNull();
      expect(response.status).toBe(200);
    }
  });
});
