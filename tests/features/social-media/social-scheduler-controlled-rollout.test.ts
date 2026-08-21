import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  CONTROLLED_SCHEDULED_ROLLOUT_REQUIRED,
  CONTROLLED_WINDOW_EXHAUSTED,
  CONTROLLED_WINDOW_EXPIRED,
  PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW,
  evaluateScheduledControlledPublishWindowBinding,
  type ActiveControlledPublishWindow,
} from "@/features/social-media/domain/controlled-publish-window";
import {
  classifySchedulerStartCode,
  evaluateScheduledProviderWriteAuthorization,
} from "@/features/social-media/domain/scheduler";
import { runSocialPublicationScheduler } from "@/features/social-media/server/run-social-publication-scheduler";

const ORG = "11111111-1111-4111-8111-111111111111";
const WS = "55555555-5555-4555-8555-555555555555";
const CONN = "24420652-d0b4-4237-9a75-51d89be50c65";
const PUB_A = "ae6caf94-2fc7-4653-a085-0228d32e0c53";
const PUB_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const activeWindow = (
  overrides: Partial<ActiveControlledPublishWindow> = {},
): ActiveControlledPublishWindow => ({
  windowId: "window-1",
  publicationId: PUB_A,
  status: "active",
  maxExecuteCount: 1,
  consumedExecuteCount: 0,
  authorizedAt: "2026-08-21T12:00:00.000Z",
  workspaceId: WS,
  connectionId: CONN,
  expiresAt: "2026-08-21T18:00:00.000Z",
  ...overrides,
});

const allWriteGatesOn = {
  machineAuthenticated: true,
  schedulingEnabled: true,
  publishingEnabled: true,
  publicationScheduled: true,
  publicationDue: true,
  withinGrace: true,
  lifecycleEligible: true,
  organizationMatch: true,
  workspaceMatch: true,
  connectionMatch: true,
  approvedVersionReady: true,
  mediaReady: true,
  connectionConnected: true,
  connectionHealthy: true,
  reauthorizationRequired: false,
  publishImageCapability: true,
  closedBetaPublishingAllowed: true,
  controlledWindowAllowed: true,
  remainingOneShotBudget: true,
  claimed: true,
};

const DUE_ROW = {
  result_code: "success",
  organization_id: ORG,
  publication_id: PUB_A,
  status: "queued",
  execution_mode: "scheduled",
  intended_execute_at: "2026-08-21T12:00:00.000Z",
  next_attempt_at: "2026-08-21T12:00:00.000Z",
  due_at: "2026-08-21T12:00:00.000Z",
  seconds_late: 30,
};

const publishMock = vi.fn();

vi.mock("@/features/social-media/server/instagram-publishing/adapter", () => ({
  createInstagramPublishingAdapter: () => ({
    publish: publishMock,
  }),
}));

vi.mock("@/features/social-media/server/credential-repository", () => ({
  loadEncryptedSocialProviderCredentialEnvelope: vi.fn(async () => ({
    ok: true,
    envelope: {
      credentialId: "cred-1",
      organizationId: ORG,
      connectionId: CONN,
      provider: "instagram",
      credentialVersion: 2,
      encrypted: {
        encryptionVersion: 1,
        keyPurpose: "social-provider-credential",
        keyVersion: 1,
        ciphertext: "Yw==",
        iv: "YQ==",
        authTag: "Yg==",
      },
    },
  })),
}));

vi.mock("@/features/social-media/server/credential-crypto", () => ({
  decryptSocialCredentialEnvelope: () => ({
    ok: true,
    payload: { accessToken: "mock-access-token-not-real" },
  }),
}));

function mockSupabase(rpc: ReturnType<typeof vi.fn>) {
  return { rpc, from: vi.fn() } as never;
}

describe("SMM-B1.11-E controlled scheduled window binding", () => {
  it("allows the exact authorized publication when all future gates are hypothetically ON", () => {
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: activeWindow(),
        requestedPublicationId: PUB_A,
        requestedWorkspaceId: WS,
        requestedConnectionId: CONN,
        nowMs: Date.parse("2026-08-21T12:00:00.000Z"),
      }),
    ).toEqual({ allowed: true, reason: "ok_authorized_match" });
    expect(
      evaluateScheduledProviderWriteAuthorization(allWriteGatesOn),
    ).toEqual({ allowed: true });
  });

  it("denies the wrong publication, workspace, and connection", () => {
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: activeWindow(),
        requestedPublicationId: PUB_B,
        requestedWorkspaceId: WS,
        requestedConnectionId: CONN,
      }).reason,
    ).toBe(PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW);
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: activeWindow(),
        requestedPublicationId: PUB_A,
        requestedWorkspaceId: "99999999-9999-4999-8999-999999999999",
        requestedConnectionId: CONN,
      }).reason,
    ).toBe(PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW);
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: activeWindow(),
        requestedPublicationId: PUB_A,
        requestedWorkspaceId: WS,
        requestedConnectionId: "99999999-9999-4999-8999-999999999999",
      }).reason,
    ).toBe(PUBLICATION_NOT_AUTHORIZED_FOR_WINDOW);
  });

  it("denies expired, consumed, and missing windows in controlled rollout mode", () => {
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: activeWindow({ expiresAt: "2026-08-21T12:00:00.000Z" }),
        requestedPublicationId: PUB_A,
        nowMs: Date.parse("2026-08-21T12:00:01.000Z"),
      }).reason,
    ).toBe(CONTROLLED_WINDOW_EXPIRED);
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: activeWindow({ consumedExecuteCount: 1 }),
        requestedPublicationId: PUB_A,
      }).reason,
    ).toBe(CONTROLLED_WINDOW_EXHAUSTED);
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: null,
        requestedPublicationId: PUB_A,
      }),
    ).toEqual({
      allowed: false,
      reason: CONTROLLED_SCHEDULED_ROLLOUT_REQUIRED,
    });
  });

  it("only relaxes the missing-window rule when unrestricted scheduler mode is explicit", () => {
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: null,
        requestedPublicationId: PUB_A,
        unrestrictedScheduler: true,
      }),
    ).toEqual({ allowed: true, reason: "ok_unrestricted_no_window" });
  });
});

describe("SMM-B1.11-E provider-write gate matrix", () => {
  it.each([
    ["scheduling_disabled", { schedulingEnabled: false }],
    ["publishing_disabled", { publishingEnabled: false }],
    ["controlled_scheduled_rollout_required", { controlledWindowAllowed: false }],
    ["controlled_window_exhausted", { remainingOneShotBudget: false }],
    ["missed_window", { withinGrace: false }],
    ["capability_missing", { publishImageCapability: false }],
    ["connection_ineligible", { reauthorizationRequired: true }],
    ["machine_auth_required", { machineAuthenticated: false }],
  ] as const)("denies when %s", (reason, override) => {
    expect(
      evaluateScheduledProviderWriteAuthorization({
        ...allWriteGatesOn,
        ...override,
      }),
    ).toEqual({ allowed: false, reason });
  });
});

describe("SMM-B1.11-E scheduler start classification", () => {
  it("maps controlled-window denials to skip reasons without treating them as success", () => {
    expect(classifySchedulerStartCode("controlled_scheduled_rollout_required")).toBe(
      "controlled_scheduled_rollout_required",
    );
    expect(classifySchedulerStartCode("publication_not_authorized_for_window")).toBe(
      "publication_not_authorized_for_window",
    );
    expect(classifySchedulerStartCode("controlled_window_exhausted")).toBe(
      "controlled_window_exhausted",
    );
    expect(classifySchedulerStartCode("controlled_window_expired")).toBe(
      "controlled_window_expired",
    );
  });
});

describe("SMM-B1.11-E worker isolation", () => {
  it("does not execute a second due row in the same invocation", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: [DUE_ROW, { ...DUE_ROW, publication_id: PUB_B }],
      error: null,
    });
    const executePublication = vi.fn().mockResolvedValue({
      ok: true,
      publicationId: PUB_A,
      attemptId: "44444444-4444-4444-8444-444444444444",
      outcome: "succeeded",
      externalPublicationIdPresent: true,
    });
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication,
    });
    expect(executePublication).toHaveBeenCalledTimes(1);
    expect(executePublication.mock.calls[0]?.[1]).toMatchObject({
      publicationId: PUB_A,
    });
    expect(result.claimed).toBe(1);
  });

  it("gives one execution owner when the second worker loses the window", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW], error: null });
    const first = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication: vi.fn().mockResolvedValue({
        ok: true,
        publicationId: PUB_A,
        attemptId: "44444444-4444-4444-8444-444444444444",
        outcome: "succeeded",
        externalPublicationIdPresent: true,
      }),
    });
    const second = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication: vi.fn().mockResolvedValue({
        ok: false,
        reason: "controlled_window_exhausted",
        claimed: false,
        providerWriteAttempted: false,
      }),
    });
    expect(first.claimed).toBe(1);
    expect(second.claimed).toBe(0);
    expect(second.skipReasons.controlled_window_exhausted).toBe(1);
    expect(second.providerWriteAttempted).toBe(false);
  });

  it("keeps manual vs scheduler as one owner when the loser is skipped_locked", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW], error: null });
    const scheduler = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication: vi.fn().mockResolvedValue({
        ok: false,
        reason: "skipped_locked",
        claimed: false,
        providerWriteAttempted: false,
      }),
    });
    expect(scheduler.claimed).toBe(0);
    expect(scheduler.skipReasons.skipped_locked).toBe(1);
    expect(scheduler.providerWriteAttempted).toBe(false);
  });
});

describe("SMM-B1.11-E mocked scheduled success and UEO", () => {
  beforeEach(() => {
    publishMock.mockReset();
    publishMock.mockResolvedValue({
      outcome: "succeeded",
      externalPublicationId: "ig_media_test_1",
    });
  });

  it("publishes exactly once then refuses a second start without another provider write", async () => {
    const { executeScheduledSocialPublication } = await import(
      "@/features/social-media/server/execute-scheduled-social-publication"
    );
    const contextRow = {
      result_code: "success",
      publication_id: PUB_A,
      organization_id: ORG,
      workspace_id: WS,
      connection_id: CONN,
      variant_version_id: "7a114018-50ab-4a4b-b53e-6b702079c4d5",
      provider: "instagram",
      operation_id: "op-1",
      content_format: "image",
      caption: "ZYNTIXAI scheduled publishing verification — safe to delete",
      alt_text: "test",
      media_snapshot: [
        {
          asset_id: "679c7c07-15ac-4cf1-b81d-1750353f8c64",
          sort_order: 0,
          asset_role: "primary",
          storage_object_key: "org/b18/test.jpg",
          mime_type: "image/jpeg",
          media_category: "image",
        },
      ],
      connection_status: "connected",
      connection_health: "healthy",
      reauthorization_required_at: null,
      capability_snapshot: ["publish_image"],
      external_account_id: "17841400000000000",
    };
    let startCalls = 0;
    const rpc = vi.fn(async (fn: string) => {
      if (fn === "scheduler_start_scheduled_publication_attempt") {
        startCalls += 1;
        if (startCalls === 1) {
          return {
            data: [
              {
                result_code: "success",
                attempt_id: "44444444-4444-4444-8444-444444444444",
                worker_id: "sched_testowner1",
                claim_generation: 1,
              },
            ],
            error: null,
          };
        }
        return {
          data: [{ result_code: "controlled_window_exhausted" }],
          error: null,
        };
      }
      if (fn === "scheduler_load_social_publication_execution_context") {
        return { data: [contextRow], error: null };
      }
      if (fn === "scheduler_complete_scheduled_publication_attempt") {
        return { data: [{ result_code: "success" }], error: null };
      }
      return { data: null, error: { message: `unexpected ${fn}` } };
    });
    const env = {
      SOCIAL_SCHEDULING_ENABLED: "true",
      SOCIAL_PUBLISHING_ENABLED: "true",
    };
    const first = await executeScheduledSocialPublication(mockSupabase(rpc), {
      organizationId: ORG,
      publicationId: PUB_A,
      env,
    });
    const second = await executeScheduledSocialPublication(mockSupabase(rpc), {
      organizationId: ORG,
      publicationId: PUB_A,
      env,
    });
    expect(first).toMatchObject({
      ok: true,
      outcome: "succeeded",
      externalPublicationIdPresent: true,
    });
    expect(second).toEqual({
      ok: false,
      reason: "controlled_window_exhausted",
      claimed: false,
      providerWriteAttempted: false,
    });
    expect(publishMock).toHaveBeenCalledTimes(1);
  });

  it("does not call the adapter when not due or when a controlled window is absent", async () => {
    const { executeScheduledSocialPublication } = await import(
      "@/features/social-media/server/execute-scheduled-social-publication"
    );
    for (const code of [
      "none_due",
      "controlled_scheduled_rollout_required",
      "publication_not_authorized_for_window",
      "controlled_window_expired",
      "missed_window",
      "capability_missing",
    ]) {
      publishMock.mockClear();
      const rpc = vi.fn().mockResolvedValue({
        data: [{ result_code: code }],
        error: null,
      });
      const result = await executeScheduledSocialPublication(mockSupabase(rpc), {
        organizationId: ORG,
        publicationId: PUB_A,
        env: {
          SOCIAL_SCHEDULING_ENABLED: "true",
          SOCIAL_PUBLISHING_ENABLED: "true",
        },
      });
      expect(result).toEqual({
        ok: false,
        reason: code,
        claimed: false,
        providerWriteAttempted: false,
      });
      expect(publishMock).not.toHaveBeenCalled();
    }
  });

  it("classifies adapter exceptions as unknown_external_outcome without a second publish", async () => {
    const { executeScheduledSocialPublication } = await import(
      "@/features/social-media/server/execute-scheduled-social-publication"
    );
    publishMock.mockRejectedValueOnce(new Error("transport ambiguous"));
    const rpc = vi.fn(async (fn: string) => {
      if (fn === "scheduler_start_scheduled_publication_attempt") {
        return {
          data: [
            {
              result_code: "success",
              attempt_id: "44444444-4444-4444-8444-444444444444",
              worker_id: "sched_testowner1",
              claim_generation: 1,
            },
          ],
          error: null,
        };
      }
      if (fn === "scheduler_load_social_publication_execution_context") {
        return {
          data: [
            {
              result_code: "success",
              publication_id: PUB_A,
              organization_id: ORG,
              workspace_id: WS,
              connection_id: CONN,
              variant_version_id: "7a114018-50ab-4a4b-b53e-6b702079c4d5",
              provider: "instagram",
              operation_id: "op-1",
              content_format: "image",
              media_snapshot: [
                {
                  asset_id: "679c7c07-15ac-4cf1-b81d-1750353f8c64",
                  sort_order: 0,
                  asset_role: "primary",
                  storage_object_key: "org/b18/test.jpg",
                  mime_type: "image/jpeg",
                  media_category: "image",
                },
              ],
              connection_status: "connected",
              connection_health: "healthy",
              reauthorization_required_at: null,
              capability_snapshot: ["publish_image"],
              external_account_id: "17841400000000000",
            },
          ],
          error: null,
        };
      }
      if (fn === "scheduler_complete_scheduled_publication_attempt") {
        return { data: [{ result_code: "success" }], error: null };
      }
      return { data: null, error: { message: `unexpected ${fn}` } };
    });
    const result = await executeScheduledSocialPublication(mockSupabase(rpc), {
      organizationId: ORG,
      publicationId: PUB_A,
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
    });
    expect(result).toMatchObject({
      ok: true,
      outcome: "unknown_external_outcome",
      externalPublicationIdPresent: false,
    });
    expect(publishMock).toHaveBeenCalledTimes(1);
    const complete = rpc.mock.calls.find(
      (call) => call[0] === "scheduler_complete_scheduled_publication_attempt",
    ) as [string, Record<string, unknown>] | undefined;
    expect(complete?.[1]).toMatchObject({
      p_outcome: "unknown_external_outcome",
    });
  });
});

describe("SMM-B1.11-E static wiring", () => {
  it("wires scheduler_start to the scheduled window helper without calling b18_start", () => {
    const execute = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/execute-scheduled-social-publication.ts",
      ),
      "utf8",
    );
    const migration = [
      "20260821193100_add_scheduler_controlled_scheduled_rollout_bind.sql",
      "20260821193300_add_scheduler_start_controlled_window_consume.sql",
    ]
      .map((name) =>
        readFileSync(join(process.cwd(), "supabase/migrations", name), "utf8"),
      )
      .join("\n");
    expect(execute).toContain("scheduler_start_scheduled_publication_attempt");
    expect(execute).not.toContain("b18_start_controlled_publication_attempt");
    expect(migration).toContain(
      "assert_and_consume_scheduled_controlled_publish_window",
    );
    expect(migration).toContain(
      "create or replace function public.scheduler_start_scheduled_publication_attempt",
    );
  });
});
