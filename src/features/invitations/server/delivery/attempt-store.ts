import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { InvitationDeliveryOperation } from "@/features/invitations/server/delivery/types";

export const RESOLVE_ORGANIZATION_INVITATION_DELIVERY_ATTEMPT_RPC =
  "resolve_organization_invitation_delivery_attempt" as const;

export const COMPLETE_ORGANIZATION_INVITATION_DELIVERY_ATTEMPT_RPC =
  "complete_organization_invitation_delivery_attempt" as const;

export type InvitationDeliveryAttemptFailureCategory =
  | "provider_error"
  | "configuration_error"
  | "template_error";

export type InvitationDeliveryAttemptStatus =
  | "pending"
  | "submitted"
  | "failed";

export type ResolveDeliveryAttemptParams = {
  organizationId: string;
  invitationId: string;
  operation: InvitationDeliveryOperation;
  generationKey: string;
  idempotencyKey: string;
};

export type ResolveDeliveryAttemptResult =
  | {
      outcome: "proceed";
      attemptId: string;
    }
  | {
      outcome: "already_submitted";
      attemptId: string;
      providerMessageId: string | null;
    }
  | { outcome: "store_unavailable" };

export type CompleteDeliveryAttemptParams = {
  organizationId: string;
  attemptId: string;
} & (
  | {
      status: "submitted";
      providerMessageId: string | null;
    }
  | {
      status: "failed";
      failureCategory: InvitationDeliveryAttemptFailureCategory;
    }
);

export type InvitationDeliveryAttemptStore = {
  resolveAttempt: (
    params: ResolveDeliveryAttemptParams,
  ) => Promise<ResolveDeliveryAttemptResult>;
  completeAttempt: (params: CompleteDeliveryAttemptParams) => Promise<void>;
};

type RpcCapableClient = {
  rpc: (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{
    data: unknown;
    error: { message?: string; code?: string } | null;
  }>;
};

function extractRow(data: unknown): Record<string, unknown> | null {
  const candidate = Array.isArray(data) ? data[0] : data;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }
  return candidate as Record<string, unknown>;
}

/**
 * In-memory store for deterministic unit tests (no network / no DB).
 */
export function createMemoryInvitationDeliveryAttemptStore(): InvitationDeliveryAttemptStore & {
  records: Map<
    string,
    {
      attemptId: string;
      status: InvitationDeliveryAttemptStatus;
      providerMessageId: string | null;
      failureCategory: InvitationDeliveryAttemptFailureCategory | null;
      idempotencyKey: string;
    }
  >;
} {
  const records = new Map<
    string,
    {
      attemptId: string;
      status: InvitationDeliveryAttemptStatus;
      providerMessageId: string | null;
      failureCategory: InvitationDeliveryAttemptFailureCategory | null;
      idempotencyKey: string;
    }
  >();

  function scopeKey(params: ResolveDeliveryAttemptParams): string {
    return [
      params.organizationId,
      params.invitationId,
      params.operation,
      params.generationKey,
    ].join("|");
  }

  return {
    records,
    async resolveAttempt(params) {
      const key = scopeKey(params);
      const existing = records.get(key);
      if (existing?.status === "submitted") {
        return {
          outcome: "already_submitted",
          attemptId: existing.attemptId,
          providerMessageId: existing.providerMessageId,
        };
      }

      if (existing) {
        existing.status = "pending";
        existing.failureCategory = null;
        existing.providerMessageId = null;
        existing.idempotencyKey = params.idempotencyKey;
        return { outcome: "proceed", attemptId: existing.attemptId };
      }

      const attemptId = `attempt-${records.size + 1}`;
      records.set(key, {
        attemptId,
        status: "pending",
        providerMessageId: null,
        failureCategory: null,
        idempotencyKey: params.idempotencyKey,
      });
      return { outcome: "proceed", attemptId };
    },
    async completeAttempt(params) {
      for (const record of records.values()) {
        if (record.attemptId !== params.attemptId) {
          continue;
        }
        if (record.status === "submitted") {
          return;
        }
        if (params.status === "submitted") {
          record.status = "submitted";
          record.providerMessageId = params.providerMessageId;
          record.failureCategory = null;
        } else {
          record.status = "failed";
          record.providerMessageId = null;
          record.failureCategory = params.failureCategory;
        }
        return;
      }
    },
  };
}

/**
 * Session-authenticated Supabase adapter for delivery-attempt RPCs.
 */
export function createSupabaseInvitationDeliveryAttemptStore(
  supabase: SupabaseClient<Database>,
): InvitationDeliveryAttemptStore {
  const client = supabase as unknown as RpcCapableClient;

  return {
    async resolveAttempt(params) {
      try {
        const { data, error } = await client.rpc(
          RESOLVE_ORGANIZATION_INVITATION_DELIVERY_ATTEMPT_RPC,
          {
            p_organization_id: params.organizationId,
            p_invitation_id: params.invitationId,
            p_operation: params.operation,
            p_generation_key: params.generationKey,
            p_idempotency_key: params.idempotencyKey,
          },
        );
        if (error) {
          return { outcome: "store_unavailable" };
        }
        const row = extractRow(data);
        if (!row || typeof row.outcome !== "string") {
          return { outcome: "store_unavailable" };
        }
        if (
          row.outcome === "already_submitted" &&
          typeof row.attempt_id === "string"
        ) {
          return {
            outcome: "already_submitted",
            attemptId: row.attempt_id,
            providerMessageId:
              typeof row.provider_message_id === "string"
                ? row.provider_message_id
                : null,
          };
        }
        if (row.outcome === "proceed" && typeof row.attempt_id === "string") {
          return { outcome: "proceed", attemptId: row.attempt_id };
        }
        return { outcome: "store_unavailable" };
      } catch {
        return { outcome: "store_unavailable" };
      }
    },
    async completeAttempt(params) {
      try {
        await client.rpc(COMPLETE_ORGANIZATION_INVITATION_DELIVERY_ATTEMPT_RPC, {
          p_organization_id: params.organizationId,
          p_attempt_id: params.attemptId,
          p_status: params.status,
          p_provider_message_id:
            params.status === "submitted" ? params.providerMessageId : null,
          p_failure_category:
            params.status === "failed" ? params.failureCategory : null,
        });
      } catch {
        // Observability must not break invitation mutation success.
      }
    },
  };
}
