import { describe, expect, it, vi } from "vitest";
import {
  isMissedBeyondSchedulerGrace,
  socialSchedulerAllowsMissedMutation,
  socialSchedulerAllowsProviderWrite,
} from "@/features/social-media/domain/scheduler";
import { SOCIAL_SCHEDULE_MISS_GRACE_SECONDS } from "@/features/social-media/domain/scheduling";
import { runSocialPublicationScheduler } from "@/features/social-media/server/run-social-publication-scheduler";
import {
  resolveSocialCalendarStatusKind,
  socialCalendarStatusLabel,
  projectPublicationToCalendarItem,
} from "@/features/social-media/domain/calendar";
import { ATTENTION_RULE_KEYS } from "@/features/attention/domain/signal";
import { ATTENTION_SOURCE_TYPES } from "@/features/attention/domain/source";
import { buildAttentionSourceDedupeKey } from "@/features/attention/domain/deduplication";
import { resolveAttentionTypeLabelFromDetail } from "@/features/attention/ui/attention-presentation";

const ORG = "11111111-1111-4111-8111-111111111111";
const PUB = "22222222-2222-4222-8222-222222222222";

const STALE_ROW = {
  result_code: "success",
  organization_id: ORG,
  publication_id: PUB,
  status: "queued",
  execution_mode: "scheduled",
  intended_execute_at: "2026-08-21T11:00:00.000Z",
  next_attempt_at: "2026-08-21T11:00:00.000Z",
  due_at: "2026-08-21T11:00:00.000Z",
  seconds_late: 3601,
};

const IN_GRACE_ROW = {
  ...STALE_ROW,
  intended_execute_at: "2026-08-21T12:00:00.000Z",
  next_attempt_at: "2026-08-21T12:00:00.000Z",
  due_at: "2026-08-21T12:00:00.000Z",
  seconds_late: 30,
};

function interventionRpc(
  listRow: typeof STALE_ROW,
  extra: Record<string, unknown> = {},
) {
  return vi.fn().mockImplementation(async (fn: string) => {
    if (fn === "scheduler_list_due_scheduled_social_publications") {
      return { data: [listRow], error: null };
    }
    if (fn === "scheduler_upsert_social_intervention_attention") {
      return {
        data: [
          {
            result_code: "success",
            attention_item_id: "55555555-5555-4555-8555-555555555555",
            rule_key: "publication_result_unknown",
            created: true,
            ...extra,
          },
        ],
        error: null,
      };
    }
    return { data: null, error: { message: fn } };
  });
}

function mockSupabase(rpc: ReturnType<typeof vi.fn>) {
  return { rpc, from: vi.fn() } as never;
}

describe("SMM-B1.11-D 15-minute missed contract", () => {
  it("treats 899 and 900 seconds as grace and 901 as missed", () => {
    const dueAtMs = Date.parse("2026-08-21T12:00:00.000Z");
    expect(
      isMissedBeyondSchedulerGrace({
        nowMs: dueAtMs + 899 * 1000,
        dueAtMs,
      }),
    ).toBe(false);
    expect(
      isMissedBeyondSchedulerGrace({
        nowMs: dueAtMs + SOCIAL_SCHEDULE_MISS_GRACE_SECONDS * 1000,
        dueAtMs,
      }),
    ).toBe(false);
    expect(
      isMissedBeyondSchedulerGrace({
        nowMs: dueAtMs + 901 * 1000,
        dueAtMs,
      }),
    ).toBe(true);
  });
});

describe("SMM-B1.11-D gate matrix", () => {
  it("mutates missed state only when scheduling is ON", () => {
    expect(
      socialSchedulerAllowsMissedMutation({ schedulingEnabled: undefined }),
    ).toBe(false);
    expect(
      socialSchedulerAllowsMissedMutation({ schedulingEnabled: "true" }),
    ).toBe(true);
    expect(
      socialSchedulerAllowsProviderWrite({
        mode: "execute",
        schedulingEnabled: "true",
        publishingEnabled: "false",
      }),
    ).toBe(false);
  });

  it("dry-run does not mark missed or upsert Attention", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [STALE_ROW], error: null });
    const executePublication = vi.fn();
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "false",
        SOCIAL_PUBLISHING_ENABLED: "false",
      },
      nowMs: Date.parse("2026-08-21T12:01:00.000Z"),
      executePublication,
    });
    expect(result.mode).toBe("dry-run");
    expect(result.dueStale).toBe(1);
    expect(result.missedMarked).toBe(0);
    expect(result.attentionUpserted).toBe(0);
    expect(executePublication).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalledWith(
      "scheduler_mark_scheduled_publication_missed",
      expect.anything(),
    );
  });

  it("marks missed without provider write when scheduling is ON and publishing is OFF", async () => {
    const rpc = vi.fn().mockImplementation(async (fn: string) => {
      if (fn === "scheduler_list_due_scheduled_social_publications") {
        return { data: [STALE_ROW], error: null };
      }
      if (fn === "scheduler_mark_scheduled_publication_missed") {
        return {
          data: [
            {
              result_code: "success",
              publication_id: PUB,
              attention_item_id: "55555555-5555-4555-8555-555555555555",
              attention_created: true,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: fn } };
    });
    const executePublication = vi.fn();
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "false",
      },
      nowMs: Date.parse("2026-08-21T12:01:00.000Z"),
      executePublication,
    });
    expect(result.missedMarked).toBe(1);
    expect(result.attentionUpserted).toBe(1);
    expect(result.claimed).toBe(0);
    expect(result.providerWriteAttempted).toBe(false);
    expect(executePublication).not.toHaveBeenCalled();
  });

  it("dedupes repeated scheduler invocations for the same missed publication", async () => {
    const rpc = vi.fn().mockImplementation(async (fn: string) => {
      if (fn === "scheduler_list_due_scheduled_social_publications") {
        return { data: [STALE_ROW], error: null };
      }
      if (fn === "scheduler_mark_scheduled_publication_missed") {
        return {
          data: [
            {
              result_code: "already_missed",
              publication_id: PUB,
              attention_item_id: "55555555-5555-4555-8555-555555555555",
              attention_created: false,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: fn } };
    });
    const env = {
      SOCIAL_SCHEDULING_ENABLED: "true",
      SOCIAL_PUBLISHING_ENABLED: "true",
    };
    const nowMs = Date.parse("2026-08-21T12:01:00.000Z");
    const executePublication = vi.fn();
    const runs = [];
    for (let i = 0; i < 10; i += 1) {
      runs.push(
        await runSocialPublicationScheduler({
          supabase: mockSupabase(rpc),
          env,
          nowMs,
          executePublication,
        }),
      );
    }
    expect(runs.every((run) => run.missedMarked === 1)).toBe(true);
    expect(runs.every((run) => run.attentionUpserted === 1)).toBe(true);
    expect(executePublication).not.toHaveBeenCalled();
    const markCalls = rpc.mock.calls.filter(
      ([fn]) => fn === "scheduler_mark_scheduled_publication_missed",
    );
    expect(markCalls).toHaveLength(10);
  });

  it("does not mark in-grace due work as missed when scheduling is ON and publishing is OFF", async () => {
    const rpc = vi.fn().mockImplementation(async (fn: string) => {
      if (fn === "scheduler_list_due_scheduled_social_publications") {
        return { data: [IN_GRACE_ROW], error: null };
      }
      return { data: null, error: { message: fn } };
    });
    const executePublication = vi.fn();
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "false",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication,
    });
    expect(result.dueWithinGrace).toBe(1);
    expect(result.dueStale).toBe(0);
    expect(result.missedMarked).toBe(0);
    expect(result.claimed).toBe(0);
    expect(executePublication).not.toHaveBeenCalled();
    expect(rpc).not.toHaveBeenCalledWith(
      "scheduler_mark_scheduled_publication_missed",
      expect.anything(),
    );
  });
});

describe("SMM-B1.11-D intervention Attention matrix", () => {
  const env = {
    SOCIAL_SCHEDULING_ENABLED: "true",
    SOCIAL_PUBLISHING_ENABLED: "true",
  };
  const nowMs = Date.parse("2026-08-21T12:00:30.000Z");

  it("creates critical Attention for unknown external outcome and does not treat it as retryable", async () => {
    const rpc = interventionRpc(IN_GRACE_ROW);
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env,
      nowMs,
      executePublication: vi.fn().mockResolvedValue({
        ok: true,
        publicationId: PUB,
        attemptId: "44444444-4444-4444-8444-444444444444",
        outcome: "unknown_external_outcome",
        externalPublicationIdPresent: false,
      }),
    });
    expect(result.unknownOutcome).toBe(1);
    expect(result.retryable).toBe(0);
    expect(result.attentionUpserted).toBe(1);
    expect(rpc).toHaveBeenCalledWith(
      "scheduler_upsert_social_intervention_attention",
      expect.objectContaining({
        p_publication_id: PUB,
        p_hint_code: "unknown_external_outcome",
      }),
    );
  });

  it("creates Attention for missing publish permission without a provider write", async () => {
    const rpc = interventionRpc(IN_GRACE_ROW, {
      rule_key: "provider_permission_missing",
    });
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env,
      nowMs,
      executePublication: vi.fn().mockResolvedValue({
        ok: false,
        reason: "capability_missing",
        claimed: false,
        providerWriteAttempted: false,
      }),
    });
    expect(result.attentionUpserted).toBe(1);
    expect(result.providerWriteAttempted).toBe(false);
    expect(rpc).toHaveBeenCalledWith(
      "scheduler_upsert_social_intervention_attention",
      expect.objectContaining({ p_hint_code: "capability_missing" }),
    );
  });

  it("creates Attention for reauthorization-required connection ineligibility", async () => {
    const rpc = interventionRpc(IN_GRACE_ROW, {
      rule_key: "social_account_reauthorization_required",
    });
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env,
      nowMs,
      executePublication: vi.fn().mockResolvedValue({
        ok: false,
        reason: "connection_ineligible",
        claimed: false,
        providerWriteAttempted: false,
      }),
    });
    expect(result.attentionUpserted).toBe(1);
    expect(result.providerWriteAttempted).toBe(false);
    expect(rpc).toHaveBeenCalledWith(
      "scheduler_upsert_social_intervention_attention",
      expect.objectContaining({ p_hint_code: "connection_ineligible" }),
    );
  });

  it("creates Attention for terminal scheduled failure", async () => {
    const rpc = interventionRpc(IN_GRACE_ROW, {
      rule_key: "scheduled_publication_failed",
    });
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env,
      nowMs,
      executePublication: vi.fn().mockResolvedValue({
        ok: true,
        publicationId: PUB,
        attemptId: "44444444-4444-4444-8444-444444444444",
        outcome: "failed_terminal",
        externalPublicationIdPresent: false,
      }),
    });
    expect(result.terminal).toBe(1);
    expect(result.attentionUpserted).toBe(1);
    expect(rpc).toHaveBeenCalledWith(
      "scheduler_upsert_social_intervention_attention",
      expect.objectContaining({ p_hint_code: "failed_terminal" }),
    );
  });

  it("does not create premature Attention for retryable failure", async () => {
    const rpc = interventionRpc(IN_GRACE_ROW);
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env,
      nowMs,
      executePublication: vi.fn().mockResolvedValue({
        ok: true,
        publicationId: PUB,
        attemptId: "44444444-4444-4444-8444-444444444444",
        outcome: "failed_retryable",
        externalPublicationIdPresent: false,
      }),
    });
    expect(result.retryable).toBe(1);
    expect(result.attentionUpserted).toBe(0);
    expect(rpc).not.toHaveBeenCalledWith(
      "scheduler_upsert_social_intervention_attention",
      expect.anything(),
    );
  });

  it("does not create failure Attention on success", async () => {
    const rpc = interventionRpc(IN_GRACE_ROW);
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env,
      nowMs,
      executePublication: vi.fn().mockResolvedValue({
        ok: true,
        publicationId: PUB,
        attemptId: "44444444-4444-4444-8444-444444444444",
        outcome: "succeeded",
        externalPublicationIdPresent: true,
      }),
    });
    expect(result.succeeded).toBe(1);
    expect(result.attentionUpserted).toBe(0);
    expect(rpc).not.toHaveBeenCalledWith(
      "scheduler_upsert_social_intervention_attention",
      expect.anything(),
    );
  });
});

describe("SMM-B1.11-D Attention source model", () => {
  it("reuses Attention source and rule keys without a parallel inbox", () => {
    expect(ATTENTION_SOURCE_TYPES).toEqual([
      "enrollment",
      "social_publication",
      "social_connection",
      "project",
      "work_order",
    ]);
    expect(ATTENTION_RULE_KEYS).toContain("enrollment_no_recent_progress");
    expect(ATTENTION_RULE_KEYS).toContain("scheduled_publication_missed");
    expect(ATTENTION_RULE_KEYS).toContain("publication_result_unknown");
    expect(
      buildAttentionSourceDedupeKey({
        organizationId: ORG,
        sourceType: "social_publication",
        sourceEntityId: PUB,
        signalKey: "scheduled_publication_missed",
      }),
    ).toBe(`attention:social_publication:${ORG}:${PUB}:scheduled_publication_missed`);
  });

  it("labels Social Attention with safe product copy", () => {
    expect(
      resolveAttentionTypeLabelFromDetail({
        signals: [{ ruleKey: "scheduled_publication_missed", signalOrigin: "rule" }],
        sourceType: "social_publication",
      } as never),
    ).toBe("Missed scheduled publication");
    expect(
      resolveAttentionTypeLabelFromDetail({
        signals: [{ ruleKey: "publication_result_unknown", signalOrigin: "rule" }],
        sourceType: "social_publication",
      } as never),
    ).toBe("Unknown publish result");
  });
});

describe("SMM-B1.11-D calendar missed display", () => {
  it("does not keep a Scheduled badge after missed transition", () => {
    expect(
      resolveSocialCalendarStatusKind({
        status: "manual_intervention",
        executionMode: "scheduled",
        intendedExecuteAt: "2026-08-21T11:00:00.000Z",
        now: new Date("2026-08-21T12:01:00.000Z"),
        lastFailureClass: "schedule_missed",
      }),
    ).toBe("schedule_missed");
    expect(socialCalendarStatusLabel("schedule_missed")).toBe("Missed");
    const item = projectPublicationToCalendarItem({
      publicationId: PUB,
      provider: "instagram",
      executionMode: "scheduled",
      intendedExecuteAt: "2026-08-21T11:00:00.000Z",
      status: "manual_intervention",
      contentFormat: "image",
      title: "Launch",
      caption: null,
      hasMedia: true,
      connectionDisplayName: "Brand IG",
      timeZone: "UTC",
      now: new Date("2026-08-21T12:01:00.000Z"),
      role: "owner",
      lastFailureClass: "schedule_missed",
    });
    expect(item?.statusLabel).toBe("Missed");
    expect(item?.canRecoverMissed).toBe(true);
    expect(item?.canReschedule).toBe(false);
  });
});
