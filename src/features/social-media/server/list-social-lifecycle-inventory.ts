/**
 * Soften list query typing — tables may not yet be in generated Database types.
 */

import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  attemptTimelineStage,
  deriveConnectionOperationalHealth,
  resolvePublicationOperatorAction,
  type SocialConnectionOperationalHealth,
} from "@/features/social-media/domain/lifecycle";
import {
  isSocialPublicationStatus,
  type SocialPublicationAttemptOutcome,
  type SocialPublicationStatus,
} from "@/features/social-media/domain/publishing";

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export type ListedPublicationAttempt = {
  id: string;
  attemptNumber: number;
  outcome: SocialPublicationAttemptOutcome;
  failureClass: string | null;
  safeErrorCode: string | null;
  startedAt: string;
  finishedAt: string | null;
  timelineStage: string;
  terminal: boolean;
  ambiguous: boolean;
  safeRetryEligible: boolean;
};

export type ListedSocialPublication = {
  id: string;
  workspaceId: string;
  connectionId: string;
  provider: string;
  status: SocialPublicationStatus;
  executionMode: string;
  contentFormat: string | null;
  createdAt: string;
  intendedExecuteAt: string;
  attemptCount: number;
  maxAttempts: number;
  hasExternalPublicationId: boolean;
  claimLeaseExpiresAt: string | null;
  lastFailureClass: string | null;
  operatorAction: string;
  actionBlockedReason: string | null;
  attempts: ListedPublicationAttempt[];
};

export type ListedLifecycleConnection = {
  id: string;
  workspaceId: string;
  provider: string;
  status: string;
  professionalAccountType: string | null;
  displayName: string | null;
  health: string | null;
  operationalHealth: SocialConnectionOperationalHealth;
  reauthorizationRequired: boolean;
  capabilitySnapshot: string[];
  canAbandonPending: boolean;
};

export type ListSocialLifecycleResult =
  | {
      ok: true;
      publications: ListedSocialPublication[];
      connections: ListedLifecycleConnection[];
    }
  | { ok: false; reason: "transport_error" | "unexpected" };

type LooseClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        order: (
          column: string,
          opts?: { ascending: boolean },
        ) => PromiseLike<{
          data: unknown;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

export async function listSocialLifecycleInventory(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  nowIso: string = new Date().toISOString(),
  publishingEnabled: boolean = false,
): Promise<ListSocialLifecycleResult> {
  const client = supabase as unknown as LooseClient;
  try {
    const [pubsResult, attemptsResult, connectionsResult] = await Promise.all([
      client
        .from("social_publications")
        .select(
          "id, workspace_id, connection_id, provider, status, execution_mode, created_at, intended_execute_at, attempt_count, max_attempts, external_publication_id, claim_lease_expires_at, last_failure_class",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
      client
        .from("social_publication_attempts")
        .select(
          "id, publication_id, attempt_number, outcome, failure_class, safe_error_code, started_at, finished_at",
        )
        .eq("organization_id", organizationId)
        .order("attempt_number", { ascending: true }),
      client
        .from("social_account_connections")
        .select(
          "id, workspace_id, provider, status, professional_account_type, health, display_name, capability_snapshot, reauthorization_required_at, created_at",
        )
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false }),
    ]);

    if (
      pubsResult.error ||
      attemptsResult.error ||
      connectionsResult.error ||
      !Array.isArray(pubsResult.data) ||
      !Array.isArray(attemptsResult.data) ||
      !Array.isArray(connectionsResult.data)
    ) {
      return { ok: false, reason: "transport_error" };
    }

    const attemptsByPublication = new Map<string, ListedPublicationAttempt[]>();
    for (const raw of attemptsResult.data) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const publicationId = asString(record.publication_id);
      const id = asString(record.id);
      const outcome = asString(record.outcome);
      const attemptNumber = asNumber(record.attempt_number);
      const startedAt = asString(record.started_at);
      if (
        !publicationId ||
        !id ||
        !outcome ||
        attemptNumber == null ||
        !startedAt
      ) {
        continue;
      }
      const timeline = attemptTimelineStage(
        outcome as SocialPublicationAttemptOutcome,
      );
      const list = attemptsByPublication.get(publicationId) ?? [];
      list.push({
        id,
        attemptNumber,
        outcome: outcome as SocialPublicationAttemptOutcome,
        failureClass: asString(record.failure_class),
        safeErrorCode: asString(record.safe_error_code),
        startedAt,
        finishedAt: asString(record.finished_at),
        timelineStage: timeline.stage,
        terminal: timeline.terminal,
        ambiguous: timeline.ambiguous,
        safeRetryEligible: timeline.safeRetryEligible,
      });
      attemptsByPublication.set(publicationId, list);
    }

    const publications: ListedSocialPublication[] = [];
    for (const raw of pubsResult.data) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const id = asString(record.id);
      const workspaceId = asString(record.workspace_id);
      const connectionId = asString(record.connection_id);
      const provider = asString(record.provider);
      const statusRaw = asString(record.status);
      const createdAt = asString(record.created_at);
      const intendedExecuteAt = asString(record.intended_execute_at);
      if (
        !id ||
        !workspaceId ||
        !connectionId ||
        !provider ||
        !statusRaw ||
        !isSocialPublicationStatus(statusRaw) ||
        !createdAt ||
        !intendedExecuteAt
      ) {
        continue;
      }
      const action = resolvePublicationOperatorAction({
        status: statusRaw,
        claimLeaseExpiresAt: asString(record.claim_lease_expires_at),
        nowIso,
        hasExternalPublicationId:
          asString(record.external_publication_id) != null,
        publishingEnabled,
      });
      publications.push({
        id,
        workspaceId,
        connectionId,
        provider,
        status: statusRaw,
        executionMode: asString(record.execution_mode) ?? "immediate",
        contentFormat: "image",
        createdAt,
        intendedExecuteAt,
        attemptCount: asNumber(record.attempt_count) ?? 0,
        maxAttempts: asNumber(record.max_attempts) ?? 5,
        hasExternalPublicationId:
          asString(record.external_publication_id) != null,
        claimLeaseExpiresAt: asString(record.claim_lease_expires_at),
        lastFailureClass: asString(record.last_failure_class),
        operatorAction: action.action,
        actionBlockedReason: action.reason,
        attempts: attemptsByPublication.get(id) ?? [],
      });
    }

    const connections: ListedLifecycleConnection[] = [];
    for (const raw of connectionsResult.data) {
      if (!raw || typeof raw !== "object") continue;
      const record = raw as Record<string, unknown>;
      const id = asString(record.id);
      const workspaceId = asString(record.workspace_id);
      const provider = asString(record.provider);
      const status = asString(record.status);
      if (!id || !workspaceId || !provider || !status) continue;
      const reauthorizationRequired =
        record.reauthorization_required_at != null;
      const health = asString(record.health);
      const caps = Array.isArray(record.capability_snapshot)
        ? record.capability_snapshot.filter(
            (item): item is string => typeof item === "string",
          )
        : [];
      const operationalHealth = deriveConnectionOperationalHealth({
        status,
        health,
        reauthorizationRequired,
      });
      connections.push({
        id,
        workspaceId,
        provider,
        status,
        professionalAccountType: asString(record.professional_account_type),
        displayName: asString(record.display_name),
        health,
        operationalHealth,
        reauthorizationRequired,
        capabilitySnapshot: caps,
        canAbandonPending: status === "authorization_pending",
      });
    }

    return { ok: true, publications, connections };
  } catch {
    return { ok: false, reason: "transport_error" };
  }
}
