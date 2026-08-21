import { describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  SOCIAL_SCHEDULER_CANONICAL_ORIGIN,
  SOCIAL_SCHEDULER_CRON_PATH,
  SOCIAL_SCHEDULER_CRON_SCHEDULE,
  SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET,
  SOCIAL_SCHEDULER_DISCOVERY_LIMIT,
  SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT,
  SOCIAL_SCHEDULER_MAX_DURATION_SECONDS,
  SOCIAL_SCHEDULER_SUPABASE_CRON_JOB_NAME,
  SOCIAL_SCHEDULER_SUPABASE_TRIGGER_FUNCTION,
  SOCIAL_SCHEDULER_VAULT_SECRET_NAME,
  authorizeSocialSchedulerCronRequest,
  isDueScheduledClock,
  isMissedBeyondSchedulerGrace,
  parseSocialSchedulingEnabled,
  resolveSocialSchedulerMode,
  socialSchedulerAllowsClaim,
  socialSchedulerAllowsProviderWrite,
} from "@/features/social-media/domain/scheduler";
import { SOCIAL_SCHEDULE_MISS_GRACE_SECONDS } from "@/features/social-media/domain/scheduling";
import { runSocialPublicationScheduler } from "@/features/social-media/server/run-social-publication-scheduler";
import { executeScheduledSocialPublication } from "@/features/social-media/server/execute-scheduled-social-publication";

const DUE_ROW = {
  result_code: "success",
  organization_id: "11111111-1111-4111-8111-111111111111",
  publication_id: "22222222-2222-4222-8222-222222222222",
  status: "queued",
  execution_mode: "scheduled",
  intended_execute_at: "2026-08-21T12:00:00.000Z",
  next_attempt_at: "2026-08-21T12:00:00.000Z",
  due_at: "2026-08-21T12:00:00.000Z",
  seconds_late: 30,
};

function mockSupabase(rpc: ReturnType<typeof vi.fn>) {
  return { rpc, from: vi.fn() } as never;
}

describe("SMM-B1.11-C scheduler gate matrix", () => {
  it("fail-closes scheduling unless exact true", () => {
    expect(parseSocialSchedulingEnabled(undefined)).toBe(false);
    expect(parseSocialSchedulingEnabled("TRUE")).toBe(true);
    expect(parseSocialSchedulingEnabled(" true ")).toBe(true);
    expect(parseSocialSchedulingEnabled("1")).toBe(false);
    expect(parseSocialSchedulingEnabled("yes")).toBe(false);
  });

  it("requires both gates for claim and provider write", () => {
    const cases = [
      { schedulingEnabled: undefined, publishingEnabled: undefined },
      { schedulingEnabled: "true", publishingEnabled: undefined },
      { schedulingEnabled: undefined, publishingEnabled: "true" },
      { schedulingEnabled: "true", publishingEnabled: "false" },
      { schedulingEnabled: "false", publishingEnabled: "true" },
    ];
    for (const gates of cases) {
      const mode = resolveSocialSchedulerMode(gates);
      expect(mode).toBe("dry-run");
      expect(socialSchedulerAllowsClaim({ mode, ...gates })).toBe(false);
      expect(socialSchedulerAllowsProviderWrite({ mode, ...gates })).toBe(false);
    }
    const both = {
      schedulingEnabled: "true",
      publishingEnabled: "true",
    };
    expect(resolveSocialSchedulerMode(both)).toBe("execute");
    expect(socialSchedulerAllowsClaim({ mode: "execute", ...both })).toBe(true);
  });
});

describe("SMM-B1.11-C cron authentication", () => {
  it("denies missing, wrong, query-param, and Owner-without-machine-auth shapes", () => {
    expect(
      authorizeSocialSchedulerCronRequest({
        authorizationHeader: null,
        configuredSecret: "cron-secret-value",
      }).ok,
    ).toBe(false);
    expect(
      authorizeSocialSchedulerCronRequest({
        authorizationHeader: "Bearer wrong-secret-value",
        configuredSecret: "cron-secret-value",
      }).ok,
    ).toBe(false);
    expect(
      authorizeSocialSchedulerCronRequest({
        authorizationHeader: null,
        configuredSecret: "cron-secret-value",
        querySecret: "cron-secret-value",
      }),
    ).toEqual({ ok: false, reason: "missing_credentials" });
    expect(
      authorizeSocialSchedulerCronRequest({
        authorizationHeader: "Bearer cron-secret-value",
        configuredSecret: "cron-secret-value",
      }).ok,
    ).toBe(true);
    expect(
      authorizeSocialSchedulerCronRequest({
        authorizationHeader: null,
        configuredSecret: "",
      }),
    ).toEqual({ ok: false, reason: "missing_secret" });
  });
});

describe("SMM-B1.11-C due clock", () => {
  it("ignores future and null clocks and refuses beyond 15-minute grace", () => {
    const now = Date.parse("2026-08-21T12:00:00.000Z");
    expect(
      isDueScheduledClock({
        nowMs: now,
        nextAttemptAtMs: now + 60_000,
        intendedExecuteAtMs: now + 60_000,
      }),
    ).toBe(false);
    expect(
      isDueScheduledClock({
        nowMs: now,
        nextAttemptAtMs: null,
        intendedExecuteAtMs: null,
      }),
    ).toBe(false);
    expect(
      isDueScheduledClock({
        nowMs: now,
        nextAttemptAtMs: now,
        intendedExecuteAtMs: now,
      }),
    ).toBe(true);
    expect(
      isMissedBeyondSchedulerGrace({
        nowMs: now + SOCIAL_SCHEDULE_MISS_GRACE_SECONDS * 1000 + 1,
        dueAtMs: now,
      }),
    ).toBe(true);
    expect(
      isMissedBeyondSchedulerGrace({
        nowMs: now + SOCIAL_SCHEDULE_MISS_GRACE_SECONDS * 1000,
        dueAtMs: now,
      }),
    ).toBe(false);
  });
});

describe("SMM-B1.11-C worker dry-run and execute", () => {
  it("discovers due work in dry-run without claiming or executing", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW], error: null });
    const executePublication = vi.fn();
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "false",
        SOCIAL_PUBLISHING_ENABLED: "false",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication,
    });
    expect(result.mode).toBe("dry-run");
    expect(result.dueDiscovered).toBe(1);
    expect(result.claimed).toBe(0);
    expect(result.providerWriteAttempted).toBe(false);
    expect(result.publicationIds).toEqual([DUE_ROW.publication_id]);
    expect(rpc).toHaveBeenCalledWith(
      "scheduler_list_due_scheduled_social_publications",
      { p_limit: SOCIAL_SCHEDULER_DISCOVERY_LIMIT },
    );
    expect(rpc).not.toHaveBeenCalledWith(
      "scheduler_start_scheduled_publication_attempt",
      expect.anything(),
    );
    expect(executePublication).not.toHaveBeenCalled();
  });

  it("does not claim when scheduling is ON and publishing is OFF", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW], error: null });
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
    expect(result.mode).toBe("dry-run");
    expect(result.claimed).toBe(0);
    expect(executePublication).not.toHaveBeenCalled();
  });

  it("does not claim when scheduling is OFF and publishing is ON", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW], error: null });
    const executePublication = vi.fn();
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "false",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication,
    });
    expect(result.mode).toBe("dry-run");
    expect(result.claimed).toBe(0);
    expect(executePublication).not.toHaveBeenCalled();
  });

  it("returns zero claims when no due publications exist", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [], error: null });
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      executePublication: vi.fn(),
    });
    expect(result.dueDiscovered).toBe(0);
    expect(result.claimed).toBe(0);
  });

  it("executes at most one due publication sequentially when both gates are ON", async () => {
    const second = {
      ...DUE_ROW,
      publication_id: "33333333-3333-4333-8333-333333333333",
    };
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW, second], error: null });
    const executePublication = vi.fn().mockResolvedValue({
      ok: true,
      publicationId: DUE_ROW.publication_id,
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
    expect(SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT).toBe(1);
    expect(executePublication).toHaveBeenCalledTimes(1);
    expect(result.claimed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.providerWriteAttempted).toBe(true);
  });

  it("skips stale due work beyond 15 minutes without executing", async () => {
    const stale = {
      ...DUE_ROW,
      due_at: "2026-08-21T11:00:00.000Z",
      seconds_late: 3601,
    };
    const rpc = vi.fn().mockImplementation(async (fn: string) => {
      if (fn === "scheduler_list_due_scheduled_social_publications") {
        return { data: [stale], error: null };
      }
      if (fn === "scheduler_mark_scheduled_publication_missed") {
        return {
          data: [
            {
              result_code: "success",
              publication_id: stale.publication_id,
              attention_item_id: "55555555-5555-4555-8555-555555555555",
              attention_created: true,
            },
          ],
          error: null,
        };
      }
      return { data: null, error: { message: `unexpected ${fn}` } };
    });
    const executePublication = vi.fn();
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:01:00.000Z"),
      executePublication,
    });
    expect(result.dueStale).toBe(1);
    expect(result.missedMarked).toBe(1);
    expect(result.attentionUpserted).toBe(1);
    expect(result.skipReasons.missed_window).toBe(1);
    expect(executePublication).not.toHaveBeenCalled();
    expect(result.providerWriteAttempted).toBe(false);
    expect(rpc).toHaveBeenCalledWith(
      "scheduler_mark_scheduled_publication_missed",
      expect.objectContaining({
        p_publication_id: stale.publication_id,
      }),
    );
  });

  it("counts a second worker skip when start loses the claim", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW], error: null });
    const executePublication = vi.fn().mockResolvedValue({
      ok: false,
      reason: "skipped_locked",
      claimed: false,
    });
    const first = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication: vi.fn().mockResolvedValue({
        ok: true,
        publicationId: DUE_ROW.publication_id,
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
      executePublication,
    });
    expect(first.claimed).toBe(1);
    expect(second.claimed).toBe(0);
    expect(second.skipReasons.skipped_locked).toBe(1);
  });

  it("maps unknown_external_outcome without treating it as retryable success", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [DUE_ROW], error: null });
    const result = await runSocialPublicationScheduler({
      supabase: mockSupabase(rpc),
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
      nowMs: Date.parse("2026-08-21T12:00:30.000Z"),
      executePublication: vi.fn().mockResolvedValue({
        ok: true,
        publicationId: DUE_ROW.publication_id,
        attemptId: "44444444-4444-4444-8444-444444444444",
        outcome: "unknown_external_outcome",
        externalPublicationIdPresent: false,
      }),
    });
    expect(result.unknownOutcome).toBe(1);
    expect(result.retryable).toBe(0);
  });
});

describe("SMM-B1.11-C execute core gate + revalidation skip", () => {
  it("does not start when either gate is OFF", async () => {
    const rpc = vi.fn();
    const offScheduling = await executeScheduledSocialPublication(
      mockSupabase(rpc),
      {
        organizationId: DUE_ROW.organization_id,
        publicationId: DUE_ROW.publication_id,
        env: {
          SOCIAL_SCHEDULING_ENABLED: "false",
          SOCIAL_PUBLISHING_ENABLED: "true",
        },
      },
    );
    const offPublishing = await executeScheduledSocialPublication(
      mockSupabase(rpc),
      {
        organizationId: DUE_ROW.organization_id,
        publicationId: DUE_ROW.publication_id,
        env: {
          SOCIAL_SCHEDULING_ENABLED: "true",
          SOCIAL_PUBLISHING_ENABLED: "false",
        },
      },
    );
    expect(offScheduling).toEqual({
      ok: false,
      reason: "feature_disabled",
      claimed: false,
      providerWriteAttempted: false,
    });
    expect(offPublishing).toEqual({
      ok: false,
      reason: "feature_disabled",
      claimed: false,
      providerWriteAttempted: false,
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it.each([
    "workflow_not_ready",
    "connection_ineligible",
    "capability_missing",
    "closed_beta_publish_not_allowed",
    "conflict",
    "none_due",
    "not_scheduled",
    "missed_window",
  ])("does not load credentials when start returns %s", async (code) => {
    const rpc = vi.fn(async (fn: string) => {
      if (fn === "scheduler_start_scheduled_publication_attempt") {
        return { data: [{ result_code: code }], error: null };
      }
      return { data: null, error: { message: "unexpected" } };
    });
    const result = await executeScheduledSocialPublication(mockSupabase(rpc), {
      organizationId: DUE_ROW.organization_id,
      publicationId: DUE_ROW.publication_id,
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
    expect(rpc).toHaveBeenCalledTimes(1);
    expect(rpc).not.toHaveBeenCalledWith(
      "scheduler_load_social_provider_credential_envelope",
      expect.anything(),
    );
  });
});

describe("SMM-B1.11-C route and cron static contracts", () => {
  it("keeps the worker route without native Vercel Social Cron", () => {
    const vercel = JSON.parse(
      readFileSync(join(process.cwd(), "vercel.json"), "utf8"),
    ) as { crons?: Array<{ path?: string; schedule?: string }> };
    const route = readFileSync(
      join(process.cwd(), "src/app/api/cron/social-publications/route.ts"),
      "utf8",
    );
    const worker = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/run-social-publication-scheduler.ts",
      ),
      "utf8",
    );
    const execute = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/execute-scheduled-social-publication.ts",
      ),
      "utf8",
    );
    expect(vercel.crons ?? []).toEqual([]);
    expect(SOCIAL_SCHEDULER_CRON_SCHEDULE).toBe("*/5 * * * *");
    expect(SOCIAL_SCHEDULER_CRON_SCHEDULE).toBe(
      SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET,
    );
    expect(JSON.stringify(vercel)).not.toContain(SOCIAL_SCHEDULER_CRON_PATH);
    expect(JSON.stringify(vercel)).not.toContain("0 0 * * *");
    expect(JSON.stringify(vercel)).not.toContain("inngest");
    expect(JSON.stringify(vercel)).not.toContain("qstash");
    expect(route).toContain("export const maxDuration = 300");
    expect(SOCIAL_SCHEDULER_MAX_DURATION_SECONDS).toBe(300);
    expect(route).toContain("authorizeSocialSchedulerCronHeader");
    expect(route).toContain("createSocialSchedulerDatabaseClient");
    expect(route).not.toContain("createSupabaseServerClient");
    expect(route).not.toContain("getUser(");
    expect(route).not.toContain("searchParams.get(\"secret\")");
    expect(worker).not.toContain("Promise.all");
    expect(worker).toContain("scheduler_list_due_scheduled_social_publications");
    expect(execute).toContain("createInstagramPublishingAdapter");
    expect(execute).toContain("scheduler_start_scheduled_publication_attempt");
    expect(execute).not.toContain("b18_start_controlled_publication_attempt");
  });

  it("keeps the 15-minute miss policy while naming the Supabase 5-minute timer", () => {
    expect(SOCIAL_SCHEDULE_MISS_GRACE_SECONDS).toBe(900);
    expect(SOCIAL_SCHEDULER_CRON_SCHEDULE).toBe("*/5 * * * *");
    expect(SOCIAL_SCHEDULER_CRON_SCHEDULE_TARGET).toBe("*/5 * * * *");
    expect(SOCIAL_SCHEDULER_SUPABASE_CRON_JOB_NAME).toBe(
      "zyntixai_social_publication_scheduler_5m",
    );
    expect(SOCIAL_SCHEDULER_SUPABASE_TRIGGER_FUNCTION).toBe(
      "private.invoke_social_publication_scheduler",
    );
    expect(SOCIAL_SCHEDULER_VAULT_SECRET_NAME).toBe(
      "zyntixai_social_scheduler_cron_secret",
    );
    expect(SOCIAL_SCHEDULER_CANONICAL_ORIGIN).toBe("https://www.zyntixai.com");
    expect(SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT).toBe(1);
  });
});
