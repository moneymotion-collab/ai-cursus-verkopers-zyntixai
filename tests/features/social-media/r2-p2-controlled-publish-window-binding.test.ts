import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLLED_WINDOW_EXHAUSTED,
  evaluateControlledPublishWindowBinding,
  isPrepareBlockedByActiveControlledWindow,
  PREPARE_BLOCKED_BY_CONTROLLED_WINDOW_COPY,
  PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW,
  userSafeControlledWindowDenialMessage,
  type ActiveControlledPublishWindow,
} from "@/features/social-media/domain/controlled-publish-window";

const AUTH_A = "ae6caf94-2fc7-4653-a085-0228d32e0c53";
const INCIDENT_B = "1f1fa14e-0208-4c12-b28f-7c185f26eec7";

const activeWindow = (
  overrides: Partial<ActiveControlledPublishWindow> = {},
): ActiveControlledPublishWindow => ({
  windowId: "window-1",
  publicationId: AUTH_A,
  status: "active",
  maxExecuteCount: 1,
  consumedExecuteCount: 0,
  authorizedAt: "2026-08-19T12:00:00.000Z",
  ...overrides,
});

describe("SMM-R1-E-R2-P2 controlled publish window binding", () => {
  it("allows Execute(A) when window authorizes A", () => {
    expect(
      evaluateControlledPublishWindowBinding({
        activeWindow: activeWindow(),
        requestedPublicationId: AUTH_A,
      }),
    ).toEqual({ allowed: true, reason: "ok_authorized_match" });
  });

  it("rejects Execute(B) when window authorizes A (incident reconstruction)", () => {
    const result = evaluateControlledPublishWindowBinding({
      activeWindow: activeWindow(),
      requestedPublicationId: INCIDENT_B,
    });
    expect(result).toEqual({
      allowed: false,
      reason: PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW,
    });
    expect(userSafeControlledWindowDenialMessage(result.reason)).toContain(
      "not authorized",
    );
  });

  it("allows when no active window (existing closed-beta path)", () => {
    expect(
      evaluateControlledPublishWindowBinding({
        activeWindow: null,
        requestedPublicationId: INCIDENT_B,
      }),
    ).toEqual({ allowed: true, reason: "ok_no_window" });
  });

  it("rejects exhausted one-shot window", () => {
    expect(
      evaluateControlledPublishWindowBinding({
        activeWindow: activeWindow({ consumedExecuteCount: 1 }),
        requestedPublicationId: AUTH_A,
      }).reason,
    ).toBe(CONTROLLED_WINDOW_EXHAUSTED);
  });

  it("blocks Prepare while an active window exists", () => {
    expect(isPrepareBlockedByActiveControlledWindow(activeWindow())).toBe(true);
    expect(isPrepareBlockedByActiveControlledWindow(null)).toBe(false);
    expect(PREPARE_BLOCKED_BY_CONTROLLED_WINDOW_COPY).toContain(
      "authorized for execution",
    );
  });

  it("wires prepare/execute/actions and DB defense to binding", () => {
    const prepare = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/prepare-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const execute = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/execute-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const panel = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/b18-instagram-publish-panel.tsx",
      ),
      "utf8",
    );
    const migration = readFileSync(
      join(
        process.cwd(),
        "supabase/migrations/20260819120000_add_social_controlled_publish_window_binding.sql",
      ),
      "utf8",
    );

    expect(prepare).toContain("controlled_window_prepare_blocked");
    expect(prepare).toContain("isPrepareBlockedByActiveControlledWindow");
    expect(execute).toContain("assertControlledPublishWindowBinding");
    expect(execute).toContain("publication_not_authorized_for_window");
    expect(panel).toContain("authorizedPublicationId");
    expect(panel).toContain("Authorized publication:");
    expect(panel).not.toContain("SOCIAL_PUBLISHING_ENABLED=true");

    expect(migration).toContain("social_controlled_publish_windows");
    expect(migration).toContain("assert_and_consume_controlled_publish_window");
    expect(migration).toContain("publication_not_authorized_for_window");
    expect(migration).toContain("execute_denied_mismatch");
    expect(migration).toContain("b18_start_controlled_publication_attempt");
    expect(migration).toContain(
      "social_controlled_publish_windows_one_active_org_uidx",
    );
  });
});
