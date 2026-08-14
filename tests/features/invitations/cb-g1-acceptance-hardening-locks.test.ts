import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  ACCEPT_INVITATION_MESSAGES,
  toAcceptInvitationUiResult,
} from "@/features/invitations/server/accept-invitation-result";
import { isInvitationRawTokenShape } from "@/features/invitations/domain/raw-token-shape";
import {
  INVITATION_ACCEPTANCE_EXCHANGE_PATH,
  INVITATION_ACCEPTANCE_TOKEN_QUERY,
  buildInvitationAcceptanceUrl,
} from "@/features/invitations/server/delivery/acceptance-url";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";

const root = process.cwd();

function readSrc(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

/**
 * CB-G1 architecture locks — acceptance gate hardening matrix.
 * Complements existing invite-accept / feature-gate / RPC security suites.
 */
describe("CB-G1 acceptance hardening locks", () => {
  it("GET exchange never mutates membership and is gate-aware", () => {
    const exchange = readSrc("src/app/invite/accept/exchange/route.ts");
    expect(exchange).toContain("export async function GET");
    expect(exchange).not.toMatch(/export async function POST/);
    expect(exchange).toContain("isInvitationsFeatureEnabled");
    expect(exchange).toContain("sealInvitationContinuation");
    expect(exchange).not.toContain("accept_organization_invitation");
    expect(exchange).not.toContain("acceptOrganizationInvitation");
    expect(exchange).not.toContain("createSupabase");
    expect(exchange).toContain("Client-controlled redirect parameters are ignored");
  });

  it("token-free accept page never calls Accept RPC on GET", () => {
    const page = readSrc("src/app/invite/accept/page.tsx");
    expect(page).toContain('export const dynamic = "force-dynamic"');
    expect(page).toContain("FeatureDisabledState");
    expect(page).toContain("isInvitationsFeatureEnabled");
    expect(page).not.toContain("acceptOrganizationInvitation");
    expect(page).not.toContain("accept_organization_invitation");
    expect(page).toContain("InviteAcceptControls");
  });

  it("irreversible accept is an argument-free server action with gate first", () => {
    const action = readSrc(
      "src/features/invitations/actions/accept-invitation-action.ts",
    );
    expect(action).toContain('"use server"');
    expect(action).toMatch(
      /export async function acceptInvitationAction\(\s*\):\s*Promise/,
    );
    expect(action).not.toMatch(
      /acceptInvitationAction\(\s*[^)]*(organization|role|email|token)/i,
    );
    const fnStart = action.indexOf("export async function acceptInvitationAction");
    const body = action.slice(fnStart);
    const gateCall = body.indexOf("if (!isInvitationsFeatureEnabled())");
    const rpcCall = body.indexOf("await acceptOrganizationInvitation(");
    expect(gateCall).toBeGreaterThan(-1);
    expect(rpcCall).toBeGreaterThan(gateCall);
    expect(action).toContain('toAcceptInvitationUiResult("feature_disabled")');
    expect(action).toContain("assertInvitationAcceptSameOrigin");
    expect(action).toContain("unsealInvitationContinuation");
  });

  it("continuation payload rejects client org/role/email authority fields", () => {
    const continuation = readSrc(
      "src/features/invitations/server/continuation.ts",
    );
    expect(continuation).toContain("isContinuationPayloadV1");
    expect(continuation).toMatch(/organization|orgId|role|email/);
    // Payload validator must fail closed on unexpected authority keys.
    expect(continuation).toMatch(/Object\.keys|extra|unexpected|reject/i);
  });

  it("safe return path allowlists /invite/accept only (not exchange)", () => {
    expect(resolveSafeReturnPath("/invite/accept")).toBe("/invite/accept");
    expect(resolveSafeReturnPath("/invite/accept/exchange")).toBe("/");
    expect(resolveSafeReturnPath("/invite/accept/exchange?token=ab")).toBe("/");
    expect(resolveSafeReturnPath("https://evil.example/phish")).toBe("/");
    expect(resolveSafeReturnPath("//evil.example")).toBe("/");
    expect(resolveSafeReturnPath("/\\evil")).toBe("/");
  });

  it("canonical acceptance URL is exchange + token-only query", () => {
    expect(INVITATION_ACCEPTANCE_EXCHANGE_PATH).toBe("/invite/accept/exchange");
    expect(INVITATION_ACCEPTANCE_TOKEN_QUERY).toBe("token");
    const previous = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://zyntixai.vercel.app";
    try {
      const raw = "a".repeat(64);
      expect(isInvitationRawTokenShape(raw)).toBe(true);
      const url = buildInvitationAcceptanceUrl(raw);
      expect(url).toBe(
        `https://zyntixai.vercel.app/invite/accept/exchange?token=${raw}`,
      );
      const parsed = new URL(url!);
      expect([...parsed.searchParams.keys()]).toEqual(["token"]);
    } finally {
      if (previous === undefined) {
        delete process.env.NEXT_PUBLIC_SITE_URL;
      } else {
        process.env.NEXT_PUBLIC_SITE_URL = previous;
      }
    }
  });

  it("gate-OFF accept maps to distinct feature_disabled UI code", () => {
    const result = toAcceptInvitationUiResult("feature_disabled");
    expect(result.ok).toBe(false);
    expect(result.code).toBe("feature_disabled");
    expect(result.message).toBe(ACCEPT_INVITATION_MESSAGES.feature_disabled);
    expect(result.code).not.toBe("invitation_unavailable");
  });

  it("accept client control never receives raw token props", () => {
    const ui = readSrc(
      "src/features/invitations/ui/accept-invitation-button.tsx",
    );
    expect(ui).toContain('"use client"');
    expect(ui).toContain("acceptInvitationAction");
    expect(ui).not.toMatch(/rawToken|tokenHash|token=/);
    expect(ui).toContain("pendingRef");
    expect(ui).toContain("Accept invitation");
  });

  it("RPC accept contract remains token-only with no client authority params", () => {
    const migration = readSrc(
      "supabase/migrations/20260810143000_add_organization_invitation_acceptance_helpers_and_rpc.sql",
    );
    expect(migration).toMatch(
      /create or replace function public\.accept_organization_invitation\(\s*p_raw_token text\s*\)/,
    );
    expect(migration).not.toMatch(
      /p_organization_id|p_role|p_email|p_user_id|p_invitation_id/,
    );
    expect(migration).toContain("for update");
    expect(migration).toContain("CRITICAL post-lock token revalidation");
    expect(migration).toContain("'invitation_accepted'");
  });

  it("INVITATIONS_ENABLED remains server-only fail-closed (no NEXT_PUBLIC)", () => {
    const helper = readSrc(
      "src/features/invitations/server/invitations-feature.ts",
    );
    const middleware = readSrc("src/middleware.ts");
    expect(helper).toContain("INVITATIONS_ENABLED");
    expect(helper).not.toContain("NEXT_PUBLIC_INVITATIONS_ENABLED");
    expect(helper).toContain('value?.trim().toLowerCase() === "true"');
    expect(middleware).not.toContain("INVITATIONS_ENABLED");
  });
});
