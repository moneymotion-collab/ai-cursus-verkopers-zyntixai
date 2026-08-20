import { describe, expect, it } from "vitest";
import {
  buildR1InstagramConnectHref,
  isR1InstagramConnectPathname,
  R1_INSTAGRAM_CONNECT_ROUTE,
  R1_INSTAGRAM_CONNECT_WORKSPACE_DISPLAY_NAME,
} from "@/features/social-media/domain/r1-connect-navigation";
import { mapSocialOAuthReturnPathId } from "@/features/social-media/domain/oauth-intent";
import { resolveSocialOAuthSafeReturnPath } from "@/features/social-media/server/oauth-return-path";
import { buildSocialOAuthContinuationPath } from "@/features/social-media/server/oauth-callback-redirect";
import {
  isProtectedApplicationPath,
  resolveSafeReturnPath,
} from "@/features/auth/server/safe-return-path";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("SMM-B1.7-R1 minimal Instagram connect surface", () => {
  it("exposes a closed connect route and R1 workspace label", () => {
    expect(R1_INSTAGRAM_CONNECT_ROUTE).toBe("/social/r1-instagram-connect");
    expect(isR1InstagramConnectPathname("/social/r1-instagram-connect")).toBe(
      true,
    );
    expect(isR1InstagramConnectPathname("/social/r1-instagram-connect-evil")).toBe(
      false,
    );
    expect(buildR1InstagramConnectHref("11111111-1111-4111-8111-111111111111")).toBe(
      "/social/r1-instagram-connect?org=11111111-1111-4111-8111-111111111111",
    );
    expect(R1_INSTAGRAM_CONNECT_WORKSPACE_DISPLAY_NAME).toContain("R1 TEST");
  });

  it("maps OAuth continuation to the Social workspace allowlist", () => {
    expect(mapSocialOAuthReturnPathId("social_workspace")).toBe("/social");
    expect(resolveSocialOAuthSafeReturnPath("social_workspace")).toBe(
      "/social",
    );
    expect(
      buildSocialOAuthContinuationPath("social_workspace", "connected"),
    ).toBe("/social?social_oauth=connected");
    expect(resolveSafeReturnPath("/social?social_oauth=connected")).toBe(
      "/social?social_oauth=connected",
    );
    expect(isProtectedApplicationPath("/social")).toBe(true);
    expect(isProtectedApplicationPath("/social/r1-instagram-connect")).toBe(
      true,
    );
  });

  it("wires Connect, Reconnect, and Disconnect as distinct Accounts actions", () => {
    const panel = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/r1-instagram-connect-panel.tsx",
      ),
      "utf8",
    );
    expect(panel).toContain("startR1InstagramConnectAction");
    expect(panel).toContain("initiateInstagramReauthorizationAction");
    expect(panel).toContain("disconnectSocialConnectionAction");
    expect(panel).toContain("Connect Instagram");
    expect(panel).toContain("Reconnect Instagram");
    expect(panel).toContain("Disconnect Instagram");
    expect(panel).toContain("Confirm disconnect");
    expect(panel).not.toContain("Reconnect / authorize Instagram");
    expect(panel).toContain("if (pendingRef.current || isConnected)");
    expect(panel).toContain("connectedConnectionId");
  });

  it("keeps the R1 connect action server-only and publishing-agnostic", () => {
    const action = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/start-r1-instagram-connect-action.ts",
      ),
      "utf8",
    );
    expect(action).toContain('"use server"');
    expect(action).toContain("createSocialWorkspace");
    expect(action).toContain("initiateInstagramConnection");
    expect(action).not.toContain("SOCIAL_PUBLISHING_ENABLED");
    expect(action).not.toContain("SERVICE_ROLE");
    expect(action).not.toContain("service_role");
  });
});
