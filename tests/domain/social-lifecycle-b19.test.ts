import { describe, expect, it } from "vitest";
import {
  attemptTimelineStage,
  classifyFailureRetryPolicy,
  deriveConnectionOperationalHealth,
  isHealthyConnectedAccount,
  isPrepareIdempotentReuseStatus,
  isProviderWriteBlockedStatus,
  isSafeToRetryProviderWrite,
  isTerminalPublicationStatus,
  resolvePublicationOperatorAction,
} from "@/features/social-media/domain/lifecycle";

describe("SMM-B1.9 lifecycle contracts", () => {
  it("protects terminal and ambiguous statuses from provider writes", () => {
    expect(isTerminalPublicationStatus("succeeded")).toBe(true);
    expect(isTerminalPublicationStatus("queued")).toBe(false);
    expect(isTerminalPublicationStatus("manual_intervention")).toBe(false);
    expect(isProviderWriteBlockedStatus("unknown_external_outcome")).toBe(true);
    expect(isProviderWriteBlockedStatus("processing")).toBe(true);
    expect(isProviderWriteBlockedStatus("manual_intervention")).toBe(true);
    expect(isProviderWriteBlockedStatus("queued")).toBe(false);
  });

  it("limits Prepare idempotent reuse to active first-execute statuses", () => {
    expect(isPrepareIdempotentReuseStatus("queued")).toBe(true);
    expect(isPrepareIdempotentReuseStatus("pending")).toBe(true);
    expect(isPrepareIdempotentReuseStatus("failed_retryable")).toBe(true);
    expect(isPrepareIdempotentReuseStatus("manual_intervention")).toBe(false);
    expect(isPrepareIdempotentReuseStatus("failed_terminal")).toBe(false);
    expect(isPrepareIdempotentReuseStatus("succeeded")).toBe(false);
    expect(isPrepareIdempotentReuseStatus("processing")).toBe(false);
    expect(isPrepareIdempotentReuseStatus("claimed")).toBe(false);
  });

  it("fails closed on ambiguous and succeeded retry", () => {
    expect(
      isSafeToRetryProviderWrite({
        publicationStatus: "unknown_external_outcome",
        latestAttemptOutcome: "unknown_external_outcome",
        publishingEnabled: true,
      }).allowed,
    ).toBe(false);
    expect(
      isSafeToRetryProviderWrite({
        publicationStatus: "succeeded",
        latestAttemptOutcome: "succeeded",
        publishingEnabled: true,
      }).allowed,
    ).toBe(false);
    expect(
      isSafeToRetryProviderWrite({
        publicationStatus: "failed_retryable",
        latestAttemptOutcome: "failed_retryable",
        publishingEnabled: true,
      }).allowed,
    ).toBe(true);
    expect(
      isSafeToRetryProviderWrite({
        publicationStatus: "queued",
        latestAttemptOutcome: null,
        publishingEnabled: false,
      }).reason,
    ).toBe("publishing_gate_off");
  });

  it("classifies retry taxonomy", () => {
    expect(classifyFailureRetryPolicy("rate_limit")).toBe("safely_retryable");
    expect(classifyFailureRetryPolicy("timeout")).toBe("conditionally_retryable");
    expect(classifyFailureRetryPolicy("authorization")).toBe("permanent");
    expect(classifyFailureRetryPolicy("unknown_external_outcome")).toBe(
      "operator",
    );
  });

  it("treats authorization_pending as pending shell, not healthy", () => {
    expect(
      deriveConnectionOperationalHealth({
        status: "authorization_pending",
        health: null,
        reauthorizationRequired: false,
      }),
    ).toBe("pending_shell");
    expect(
      isHealthyConnectedAccount({
        status: "authorization_pending",
        health: "healthy",
        reauthorizationRequired: false,
      }),
    ).toBe(false);
    expect(
      isHealthyConnectedAccount({
        status: "connected",
        health: "healthy",
        reauthorizationRequired: false,
      }),
    ).toBe(true);
  });

  it("exposes operator actions for abandon/reclaim/resolve", () => {
    expect(
      resolvePublicationOperatorAction({
        status: "queued",
        claimLeaseExpiresAt: null,
        nowIso: "2026-08-18T12:00:00.000Z",
        hasExternalPublicationId: false,
        publishingEnabled: false,
      }).action,
    ).toBe("abandon");
    expect(
      resolvePublicationOperatorAction({
        status: "processing",
        claimLeaseExpiresAt: "2026-08-18T11:00:00.000Z",
        nowIso: "2026-08-18T12:00:00.000Z",
        hasExternalPublicationId: false,
        publishingEnabled: false,
      }).action,
    ).toBe("reclaim_stale");
    expect(
      resolvePublicationOperatorAction({
        status: "unknown_external_outcome",
        claimLeaseExpiresAt: null,
        nowIso: "2026-08-18T12:00:00.000Z",
        hasExternalPublicationId: false,
        publishingEnabled: false,
      }).action,
    ).toBe("resolve_unknown");
    expect(
      resolvePublicationOperatorAction({
        status: "succeeded",
        claimLeaseExpiresAt: null,
        nowIso: "2026-08-18T12:00:00.000Z",
        hasExternalPublicationId: true,
        publishingEnabled: true,
      }).action,
    ).toBe("execute_blocked");
  });

  it("maps attempt timeline stages without secrets", () => {
    expect(attemptTimelineStage("processing").stage).toBe(
      "provider_interaction",
    );
    expect(attemptTimelineStage("unknown_external_outcome").ambiguous).toBe(
      true,
    );
    expect(attemptTimelineStage("succeeded").safeRetryEligible).toBe(false);
    expect(attemptTimelineStage("failed_retryable").safeRetryEligible).toBe(
      true,
    );
  });
});
