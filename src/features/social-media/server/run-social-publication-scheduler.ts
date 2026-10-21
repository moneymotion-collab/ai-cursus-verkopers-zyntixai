/**
 * SMM-B1.11-C Social publication scheduler worker.
 * Dry-run is the Production default. Live execute requires both env gates.
 * No Owner session, cookies, or ?org= binding.
 */

import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  SOCIAL_SCHEDULER_DISCOVERY_LIMIT,
  SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT,
  classifySchedulerStartCode,
  createEmptySocialSchedulerSummary,
  isMissedBeyondSchedulerGrace,
  resolveSocialSchedulerMode,
  socialSchedulerAllowsClaim,
  socialSchedulerAllowsMissedMutation,
  type SocialSchedulerDueRow,
  type SocialSchedulerSafeSummary,
  type SocialSchedulerSkipReason,
} from "@/features/social-media/domain/scheduler";
import { executeScheduledSocialPublication } from "@/features/social-media/server/execute-scheduled-social-publication";

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

async function markScheduledPublicationMissed(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  publicationId: string,
): Promise<{ ok: boolean; attentionUpserted: boolean }> {
  const client = supabase as unknown as RpcCapableClient;
  const { data, error } = await client.rpc(
    "scheduler_mark_scheduled_publication_missed",
    {
      p_organization_id: organizationId,
      p_publication_id: publicationId,
    },
  );
  if (error) {
    return { ok: false, attentionUpserted: false };
  }
  const row = firstRow(data);
  const code = asString(row?.result_code);
  const attentionId = asString(row?.attention_item_id);
  return {
    ok: code === "success" || code === "already_missed",
    attentionUpserted: Boolean(attentionId),
  };
}

async function upsertInterventionAttention(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  publicationId: string,
  hintCode: string,
): Promise<boolean> {
  const client = supabase as unknown as RpcCapableClient;
  const { data, error } = await client.rpc(
    "scheduler_upsert_social_intervention_attention",
    {
      p_organization_id: organizationId,
      p_publication_id: publicationId,
      p_hint_code: hintCode,
    },
  );
  if (error) {
    return false;
  }
  const row = firstRow(data);
  const code = asString(row?.result_code);
  return code === "success";
}

function firstRow(data: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  return candidate as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function logScheduler(event: string, payload: Record<string, unknown>): void {
  console.info(
    JSON.stringify({
      event,
      ...payload,
    }),
  );
}

function incrementSkip(
  summary: SocialSchedulerSafeSummary,
  reason: SocialSchedulerSkipReason,
): void {
  summary.skipped += 1;
  summary.skipReasons[reason] = (summary.skipReasons[reason] ?? 0) + 1;
}

function parseDueRows(data: unknown): SocialSchedulerDueRow[] {
  const rows = Array.isArray(data) ? data : data ? [data] : [];
  const out: SocialSchedulerDueRow[] = [];
  for (const item of rows) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const row = item as Record<string, unknown>;
    const organizationId = asString(row.organization_id);
    const publicationId = asString(row.publication_id);
    const status = asString(row.status);
    const executionMode = asString(row.execution_mode);
    if (!organizationId || !publicationId || !status || !executionMode) {
      continue;
    }
    out.push({
      organizationId,
      publicationId,
      status,
      executionMode,
      intendedExecuteAt: asString(row.intended_execute_at),
      nextAttemptAt: asString(row.next_attempt_at),
      dueAt: asString(row.due_at),
      secondsLate: asNumber(row.seconds_late) ?? 0,
    });
  }
  return out;
}

async function listDueScheduledPublications(
  supabase: SupabaseClient<Database>,
  limit: number,
): Promise<SocialSchedulerDueRow[]> {
  const client = supabase as unknown as RpcCapableClient;
  const { data, error } = await client.rpc(
    "scheduler_list_due_scheduled_social_publications",
    { p_limit: limit },
  );
  if (error) {
    throw new Error("due_discovery_failed");
  }
  if (!data) {
    return [];
  }
  const maybeCode = firstRow(data);
  if (maybeCode && asString(maybeCode.result_code) && !asString(maybeCode.publication_id)) {
    return [];
  }
  return parseDueRows(data);
}

export async function runSocialPublicationScheduler(input: {
  supabase: SupabaseClient<Database>;
  env?: Record<string, string | undefined>;
  nowMs?: number;
  executePublication?: typeof executeScheduledSocialPublication;
}): Promise<SocialSchedulerSafeSummary> {
  const started = Date.now();
  const env = input.env ?? process.env;
  const invocationId = randomUUID();
  const schedulingEnabled = env.SOCIAL_SCHEDULING_ENABLED;
  const publishingEnabled = env.SOCIAL_PUBLISHING_ENABLED;
  const mode = resolveSocialSchedulerMode({
    schedulingEnabled,
    publishingEnabled,
  });
  const summary = createEmptySocialSchedulerSummary({
    invocationId,
    mode,
    schedulingEnabled:
      schedulingEnabled?.trim().toLowerCase() === "true",
    publishingEnabled:
      publishingEnabled?.trim().toLowerCase() === "true",
  });

  logScheduler("social_scheduler_invocation_start", {
    invocationId,
    mode,
    schedulingEnabled: summary.schedulingEnabled,
    publishingEnabled: summary.publishingEnabled,
  });

  try {
    const due = await listDueScheduledPublications(
      input.supabase,
      SOCIAL_SCHEDULER_DISCOVERY_LIMIT,
    );
    summary.dueDiscovered = due.length;
    summary.publicationIds = due.map((row) => row.publicationId);
    const nowMs = input.nowMs ?? Date.now();
    for (const row of due) {
      const dueAtMs = row.dueAt ? Date.parse(row.dueAt) : Number.NaN;
      if (
        Number.isFinite(dueAtMs) &&
        isMissedBeyondSchedulerGrace({ nowMs, dueAtMs })
      ) {
        summary.dueStale += 1;
      } else {
        summary.dueWithinGrace += 1;
      }
    }

    logScheduler("social_scheduler_due_discovered", {
      invocationId,
      dueDiscovered: summary.dueDiscovered,
      dueWithinGrace: summary.dueWithinGrace,
      dueStale: summary.dueStale,
    });

    const allowMissed = socialSchedulerAllowsMissedMutation({
      schedulingEnabled,
    });
    const allowClaim = socialSchedulerAllowsClaim({
      mode,
      schedulingEnabled,
      publishingEnabled,
    });

    const markedIds = new Set<string>();
    if (allowMissed) {
      for (const row of due) {
        const dueAtMs = row.dueAt ? Date.parse(row.dueAt) : Number.NaN;
        if (
          !Number.isFinite(dueAtMs) ||
          !isMissedBeyondSchedulerGrace({ nowMs, dueAtMs })
        ) {
          continue;
        }
        const marked = await markScheduledPublicationMissed(
          input.supabase,
          row.organizationId,
          row.publicationId,
        );
        if (marked.ok) {
          markedIds.add(row.publicationId);
          summary.missedMarked += 1;
          incrementSkip(summary, "missed_window");
          if (marked.attentionUpserted) {
            summary.attentionUpserted += 1;
          }
          logScheduler("social_scheduler_missed_marked", {
            invocationId,
            publicationId: row.publicationId,
          });
        } else {
          incrementSkip(summary, "missed_window");
        }
      }
    }

    if (!allowClaim) {
      summary.durationMs = Date.now() - started;
      logScheduler("social_scheduler_invocation_complete", {
        invocationId,
        mode,
        claimed: 0,
        missedMarked: summary.missedMarked,
        attentionUpserted: summary.attentionUpserted,
        providerWriteAttempted: false,
        durationMs: summary.durationMs,
      });
      return summary;
    }

    const execute =
      input.executePublication ?? executeScheduledSocialPublication;
    const batch = due.slice(0, SOCIAL_SCHEDULER_EXECUTE_BATCH_LIMIT);
    for (const row of batch) {
      if (markedIds.has(row.publicationId)) {
        continue;
      }
      const dueAtMs = row.dueAt ? Date.parse(row.dueAt) : Number.NaN;
      if (
        Number.isFinite(dueAtMs) &&
        isMissedBeyondSchedulerGrace({ nowMs, dueAtMs })
      ) {
        incrementSkip(summary, "missed_window");
        logScheduler("social_scheduler_skipped", {
          invocationId,
          publicationId: row.publicationId,
          reason: "missed_window",
        });
        continue;
      }

      logScheduler("social_scheduler_execution_started", {
        invocationId,
        publicationId: row.publicationId,
      });

      const result = await execute(input.supabase, {
        organizationId: row.organizationId,
        publicationId: row.publicationId,
        env,
      });

      if (!result.ok) {
        if (result.claimed) {
          summary.claimed += 1;
        } else {
          const classified = classifySchedulerStartCode(result.reason);
          if (classified === "success" || classified === "unexpected") {
            incrementSkip(summary, "conflict");
          } else {
            incrementSkip(summary, classified);
          }
          if (
            result.reason === "capability_missing" ||
            result.reason === "connection_ineligible" ||
            result.reason === "credential_unavailable" ||
            result.reason === "format_unsupported"
          ) {
            const upserted = await upsertInterventionAttention(
              input.supabase,
              row.organizationId,
              row.publicationId,
              result.reason,
            );
            if (upserted) {
              summary.attentionUpserted += 1;
            }
          }
        }
        if ("providerWriteAttempted" in result && result.providerWriteAttempted) {
          summary.providerWriteAttempted = true;
          summary.terminal += 1;
        }
        logScheduler("social_scheduler_result", {
          invocationId,
          publicationId: row.publicationId,
          resultClass: result.reason,
          claimed: result.claimed,
        });
        continue;
      }

      summary.claimed += 1;
      summary.providerWriteAttempted = true;
      if (result.outcome === "succeeded") {
        summary.succeeded += 1;
      } else if (result.outcome === "failed_retryable") {
        summary.retryable += 1;
      } else if (result.outcome === "unknown_external_outcome") {
        summary.unknownOutcome += 1;
        const upserted = await upsertInterventionAttention(
          input.supabase,
          row.organizationId,
          row.publicationId,
          "unknown_external_outcome",
        );
        if (upserted) {
          summary.attentionUpserted += 1;
        }
      } else {
        summary.terminal += 1;
        const upserted = await upsertInterventionAttention(
          input.supabase,
          row.organizationId,
          row.publicationId,
          "failed_terminal",
        );
        if (upserted) {
          summary.attentionUpserted += 1;
        }
      }
      logScheduler("social_scheduler_result", {
        invocationId,
        publicationId: row.publicationId,
        resultClass: result.outcome,
        claimed: true,
      });
    }
  } catch {
    incrementSkip(summary, "conflict");
    logScheduler("social_scheduler_due_discovered", {
      invocationId,
      dueDiscovered: 0,
      error: "due_discovery_failed",
    });
  }

  summary.durationMs = Date.now() - started;
  logScheduler("social_scheduler_invocation_complete", {
    invocationId,
    mode: summary.mode,
    claimed: summary.claimed,
    missedMarked: summary.missedMarked,
    attentionUpserted: summary.attentionUpserted,
    providerWriteAttempted: summary.providerWriteAttempted,
    durationMs: summary.durationMs,
  });
  return summary;
}
