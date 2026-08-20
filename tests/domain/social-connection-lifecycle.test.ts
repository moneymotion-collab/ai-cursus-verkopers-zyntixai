import { describe, expect, it } from "vitest";
import {
  findReconnectableInstagramConnection,
  isActiveSocialConnectionStatus,
  isCapabilityEligibleSocialConnectionStatus,
  isReconnectableSocialConnectionStatus,
  isSocialConnectionReauthorizationRequired,
  isSocialConnectionStatus,
  isTerminalSocialConnectionStatus,
  SOCIAL_CONNECTION_STATUSES,
} from "@/features/social-media/domain/status";
import {
  isSocialConnectionHealthOverlay,
  SOCIAL_CONNECTION_HEALTH_OVERLAYS,
} from "@/features/social-media/domain/health";

describe("social connection lifecycle", () => {
  it("includes the locked durable statuses and no generic error", () => {
    expect(SOCIAL_CONNECTION_STATUSES).toEqual([
      "initiated",
      "authorization_pending",
      "connected",
      "reauthorization_required",
      "permission_missing",
      "revoked",
      "disconnected",
    ]);
    expect(isSocialConnectionStatus("error")).toBe(false);
    expect(isSocialConnectionStatus("provider_unavailable")).toBe(false);
  });

  it("classifies active, capability-eligible, reauth, and terminal states", () => {
    expect(isActiveSocialConnectionStatus("connected")).toBe(true);
    expect(isActiveSocialConnectionStatus("initiated")).toBe(true);
    expect(isCapabilityEligibleSocialConnectionStatus("connected")).toBe(true);
    expect(
      isCapabilityEligibleSocialConnectionStatus("authorization_pending"),
    ).toBe(false);
    expect(isSocialConnectionReauthorizationRequired("reauthorization_required")).toBe(
      true,
    );
    expect(isSocialConnectionReauthorizationRequired("connected")).toBe(false);
    expect(isReconnectableSocialConnectionStatus("connected")).toBe(true);
    expect(isReconnectableSocialConnectionStatus("reauthorization_required")).toBe(
      true,
    );
    expect(isReconnectableSocialConnectionStatus("authorization_pending")).toBe(
      false,
    );
    expect(isReconnectableSocialConnectionStatus("disconnected")).toBe(false);
    expect(
      findReconnectableInstagramConnection([
        { provider: "instagram", status: "authorization_pending" },
        { provider: "instagram", status: "connected" },
      ])?.status,
    ).toBe("connected");
    expect(isTerminalSocialConnectionStatus("disconnected")).toBe(true);
    expect(isTerminalSocialConnectionStatus("revoked")).toBe(true);
    expect(isTerminalSocialConnectionStatus("connected")).toBe(false);
  });
});

describe("social connection health overlay", () => {
  it("is a distinct overlay that includes provider_unavailable", () => {
    expect(SOCIAL_CONNECTION_HEALTH_OVERLAYS).toEqual([
      "healthy",
      "degraded",
      "provider_unavailable",
    ]);
    expect(isSocialConnectionHealthOverlay("provider_unavailable")).toBe(true);
    expect(isSocialConnectionHealthOverlay("disconnected")).toBe(false);
    expect(isSocialConnectionHealthOverlay("connected")).toBe(false);
  });
});
