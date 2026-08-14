import { describe, expect, it } from "vitest";
import {
  isSocialConnectionUsableForPrivilegedProviderCalls,
  resolveSocialConnectionUsability,
} from "@/features/social-media/domain/usability";
import type { SocialConnectionStatus } from "@/features/social-media/domain/status";
import type { SocialConnectionHealthOverlay } from "@/features/social-media/domain/health";

describe("social connection usability policy", () => {
  it("treats connected + healthy as usable for privileged provider calls", () => {
    const result = resolveSocialConnectionUsability("connected", "healthy");
    expect(result.mayCallProvider).toBe(true);
    expect(result.mayUseCapabilities).toBe(true);
    expect(result.isCapabilityDependent).toBe(false);
    expect(result.requiresReauthorization).toBe(false);
    expect(result.isTerminalUntilReconnect).toBe(false);
    expect(
      isSocialConnectionUsableForPrivilegedProviderCalls("connected", "healthy"),
    ).toBe(true);
  });

  it("treats connected + degraded as capability-dependent, not privileged-call ready", () => {
    const result = resolveSocialConnectionUsability("connected", "degraded");
    expect(result.mayCallProvider).toBe(false);
    expect(result.mayUseCapabilities).toBe(true);
    expect(result.isCapabilityDependent).toBe(true);
    expect(result.isTerminalUntilReconnect).toBe(false);
  });

  it("does not treat provider_unavailable as disconnect", () => {
    const result = resolveSocialConnectionUsability(
      "connected",
      "provider_unavailable",
    );
    expect(result.mayCallProvider).toBe(false);
    expect(result.isTerminalUntilReconnect).toBe(false);
    expect(result.requiresReauthorization).toBe(false);
  });

  it("blocks privileged calls when reauthorization is required", () => {
    const result = resolveSocialConnectionUsability(
      "reauthorization_required",
      "healthy",
    );
    expect(result.mayCallProvider).toBe(false);
    expect(result.mayUseCapabilities).toBe(false);
    expect(result.requiresReauthorization).toBe(true);
  });

  it("treats revoked and disconnected as terminal until reconnect", () => {
    for (const status of ["revoked", "disconnected"] as const) {
      const result = resolveSocialConnectionUsability(status, "healthy");
      expect(result.mayCallProvider).toBe(false);
      expect(result.isTerminalUntilReconnect).toBe(true);
    }
  });

  it("does not allow provider calls before connection is established", () => {
    const pending: Array<[SocialConnectionStatus, SocialConnectionHealthOverlay]> =
      [
        ["initiated", "healthy"],
        ["authorization_pending", "healthy"],
        ["permission_missing", "healthy"],
      ];
    for (const [status, health] of pending) {
      expect(
        isSocialConnectionUsableForPrivilegedProviderCalls(status, health),
      ).toBe(false);
    }
  });
});
