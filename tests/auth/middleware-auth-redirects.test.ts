import { beforeEach, describe, expect, it, vi } from "vitest";
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
  beforeEach(() => {
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
});
