import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextRequest } from "next/server";
import {
  buildInvitationContinuationCookieOptions,
  clearInvitationContinuationCookie,
  INVITE_CONTINUATION_CLEARED_QUERY,
  INVITE_CONTINUATION_CLEARED_VALUE,
  INVITE_CONTINUATION_COOKIE_NAME,
  INVITE_CONTINUATION_SECRET_MIN_LENGTH,
  INVITE_CONTINUATION_TTL_SECONDS,
  sealInvitationContinuation,
  unsealInvitationContinuation,
} from "@/features/invitations/server/continuation";
import { NextResponse } from "next/server";

const TEST_SECRET = "c".repeat(INVITE_CONTINUATION_SECRET_MIN_LENGTH);
const VALID_TOKEN = "cd".repeat(32);

const exchangeSource = readFileSync(
  join(process.cwd(), "src/app/invite/accept/exchange/route.ts"),
  "utf8",
);
const acceptPageSource = readFileSync(
  join(process.cwd(), "src/app/invite/accept/page.tsx"),
  "utf8",
);

describe("invite accept exchange route", () => {
  const previousSecret = process.env.INVITE_CONTINUATION_SECRET;

  beforeEach(() => {
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    if (previousSecret === undefined) {
      delete process.env.INVITE_CONTINUATION_SECRET;
    } else {
      process.env.INVITE_CONTINUATION_SECRET = previousSecret;
    }
  });

  async function loadGet() {
    return (await import("@/app/invite/accept/exchange/route")).GET;
  }

  it("valid GET seals encrypted HttpOnly continuation and 303-redirects token-free", async () => {
    const GET = await loadGet();
    const response = await GET(
      new NextRequest(
        `http://localhost:3000/invite/accept/exchange?token=${VALID_TOKEN}&next=https://evil.example`,
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/invite/accept",
    );
    expect(response.headers.get("location")).not.toContain(VALID_TOKEN);
    expect(response.headers.get("location")).not.toContain("token=");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    expect(response.headers.get("cache-control")).toBe("no-store, private");
    expect(response.headers.get("pragma")).toBe("no-cache");

    const setCookie = response.cookies.get(INVITE_CONTINUATION_COOKIE_NAME);
    expect(setCookie).toBeDefined();
    expect(setCookie?.value).toBeTruthy();
    expect(setCookie?.value).not.toContain(VALID_TOKEN);
    expect(setCookie?.httpOnly).toBe(true);
    expect(setCookie?.sameSite).toBe("lax");
    expect(setCookie?.path).toBe("/");
    expect(setCookie?.maxAge).toBe(INVITE_CONTINUATION_TTL_SECONDS);

    const unsealed = unsealInvitationContinuation(setCookie?.value, {
      secret: TEST_SECRET,
    });
    expect(unsealed.ok).toBe(true);
    if (unsealed.ok) {
      expect(unsealed.rawToken).toBe(VALID_TOKEN);
    }

    const body = await response.text();
    expect(body).not.toContain(VALID_TOKEN);
  });

  it("replaces a previous continuation when a new valid token is exchanged", async () => {
    const prior = sealInvitationContinuation("ef".repeat(32), {
      secret: TEST_SECRET,
    });
    expect(prior.ok).toBe(true);
    if (!prior.ok) {
      return;
    }

    const GET = await loadGet();
    const response = await GET(
      new NextRequest(
        `http://localhost:3000/invite/accept/exchange?token=${VALID_TOKEN}`,
        {
          headers: {
            cookie: `${INVITE_CONTINUATION_COOKIE_NAME}=${prior.cookieValue}`,
          },
        },
      ),
    );

    const setCookie = response.cookies.get(INVITE_CONTINUATION_COOKIE_NAME);
    expect(setCookie?.value).toBeTruthy();
    expect(setCookie?.value).not.toBe(prior.cookieValue);
    expect(setCookie?.path).toBe("/");
    const unsealed = unsealInvitationContinuation(setCookie?.value, {
      secret: TEST_SECRET,
    });
    expect(unsealed.ok && unsealed.rawToken).toBe(VALID_TOKEN);
  });

  it("malformed GET clears continuation with Path=/ and redirects token-free", async () => {
    const prior = sealInvitationContinuation(VALID_TOKEN, {
      secret: TEST_SECRET,
    });
    expect(prior.ok).toBe(true);
    if (!prior.ok) {
      return;
    }

    const GET = await loadGet();
    const malformed = "NOT_A_TOKEN";
    const response = await GET(
      new NextRequest(
        `http://localhost:3000/invite/accept/exchange?token=${malformed}`,
        {
          headers: {
            cookie: `${INVITE_CONTINUATION_COOKIE_NAME}=${prior.cookieValue}`,
          },
        },
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `http://localhost:3000/invite/accept?${INVITE_CONTINUATION_CLEARED_QUERY}=${INVITE_CONTINUATION_CLEARED_VALUE}`,
    );
    expect(response.headers.get("location")).not.toContain(malformed);
    expect(response.headers.get("cache-control")).toBe("no-store, private");

    const setCookie = response.cookies.get(INVITE_CONTINUATION_COOKIE_NAME);
    expect(setCookie?.value).toBe("");
    expect(setCookie?.maxAge).toBe(0);
    expect(setCookie?.path).toBe("/");
    expect(setCookie?.httpOnly).toBe(true);
    expect(setCookie?.sameSite).toBe("lax");

    const body = await response.text();
    expect(body).not.toContain(malformed);
    expect(body).not.toContain(VALID_TOKEN);
  });

  it("fails closed without setting a usable continuation when secret is missing", async () => {
    delete process.env.INVITE_CONTINUATION_SECRET;
    vi.resetModules();
    const { GET } = await import("@/app/invite/accept/exchange/route");
    const response = await GET(
      new NextRequest(
        `http://localhost:3000/invite/accept/exchange?token=${VALID_TOKEN}`,
      ),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      `http://localhost:3000/invite/accept?${INVITE_CONTINUATION_CLEARED_QUERY}=${INVITE_CONTINUATION_CLEARED_VALUE}`,
    );
    const setCookie = response.cookies.get(INVITE_CONTINUATION_COOKIE_NAME);
    expect(setCookie?.value).toBe("");
    expect(setCookie?.maxAge).toBe(0);
    expect(setCookie?.path).toBe("/");
  });

  it("ignores client-controlled redirect parameters", async () => {
    const GET = await loadGet();
    const response = await GET(
      new NextRequest(
        `http://localhost:3000/invite/accept/exchange?token=${VALID_TOKEN}&returnTo=https://evil.example&redirect=/admin&callback=//evil`,
      ),
    );
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/invite/accept",
    );
  });

  it("cookie clear helper matches set identity Path=/ and expires epoch", () => {
    const response = NextResponse.redirect("http://localhost:3000/invite/accept", 303);
    clearInvitationContinuationCookie(response, true);
    const setCookie = response.cookies.get(INVITE_CONTINUATION_COOKIE_NAME);
    expect(setCookie?.path).toBe("/");
    expect(setCookie?.maxAge).toBe(0);
    expect(setCookie?.value).toBe("");
    expect(setCookie?.httpOnly).toBe(true);
    expect(setCookie?.sameSite).toBe("lax");

    const options = buildInvitationContinuationCookieOptions(0, true);
    expect(options.path).toBe("/");
    expect(options.expires?.getTime()).toBe(0);
  });
});

describe("invite accept exchange scanner, cache, and loop boundaries", () => {
  it("GET entry source never invokes Acceptance or Supabase", () => {
    expect(exchangeSource).not.toMatch(/\.rpc\s*\(/);
    expect(exchangeSource).not.toMatch(/createSupabase|@\/lib\/supabase|service_role|@supabase/i);
    expect(exchangeSource).not.toMatch(/from\(["']organization_invitations/);
    expect(exchangeSource).not.toMatch(/localStorage|sessionStorage/);
    expect(exchangeSource).toContain("303");
    expect(exchangeSource).toContain('Cache-Control", "no-store, private"');
    expect(exchangeSource).not.toMatch(
      /supabase\.|acceptOrganizationInvitation|grantMembership/i,
    );
  });

  it("token-free page is dynamic, no-referrer, and terminates cleared loops", () => {
    expect(acceptPageSource).toContain('referrer: "no-referrer"');
    expect(acceptPageSource).toContain('dynamic = "force-dynamic"');
    expect(acceptPageSource).toContain("revalidate = 0");
    expect(acceptPageSource).toContain("cookies()");
    expect(acceptPageSource).toContain("hasValidInvitationContinuation");
    expect(acceptPageSource).toContain("INVITE_CONTINUATION_CLEARED");
    expect(acceptPageSource).not.toMatch(/organizationId|targetRole|inviter/i);
    expect(acceptPageSource).not.toMatch(/accept_organization_invitation/);
    expect(acceptPageSource).not.toMatch(/localStorage|sessionStorage/);
    expect(acceptPageSource).not.toContain("unsealInvitationContinuation");
    expect(acceptPageSource).not.toContain("NEXT_PUBLIC_INVITE_CONTINUATION_SECRET");
  });

  it("scanner-safe GET proves no membership mutation at application boundary", async () => {
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
    const rpcSpy = vi.fn();
    const GET = (await import("@/app/invite/accept/exchange/route")).GET;
    const response = await GET(
      new NextRequest(
        `http://localhost:3000/invite/accept/exchange?token=${VALID_TOKEN}`,
      ),
    );

    expect(response.status).toBe(303);
    expect(rpcSpy).not.toHaveBeenCalled();
    expect(exchangeSource).not.toMatch(/\.rpc\s*\(|@\/lib\/supabase|@supabase/);
  });

  it("tampered/missing-secret clear path terminates via cleared query (no loop)", async () => {
    process.env.INVITE_CONTINUATION_SECRET = TEST_SECRET;
    const GET = (await import("@/app/invite/accept/exchange/route")).GET;

    const noToken = await GET(
      new NextRequest("http://localhost:3000/invite/accept/exchange"),
    );
    expect(noToken.status).toBe(303);
    expect(noToken.headers.get("location")).toBe(
      `http://localhost:3000/invite/accept?${INVITE_CONTINUATION_CLEARED_QUERY}=${INVITE_CONTINUATION_CLEARED_VALUE}`,
    );

    // Page source: with ?cleared=1 and still-invalid cookie, show unavailable (no second redirect).
    expect(acceptPageSource).toMatch(/clearedAttempt[\s\S]*UnavailableState/);
    expect(acceptPageSource).toContain('redirect("/invite/accept/exchange")');
  });
});
