import "server-only";

import {
  orgContextFail,
  orgContextOk,
  type OrgContextErrorCode,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";
import type {
  OrgContextBqaMutationOperation,
  OrgContextMutationOperation,
  OrgContextMutationSuccess,
  OrganizationContextEventType,
} from "@/features/org-context/domain/types";
import type { Database } from "@/types/database";

export const ORG_CONTEXT_PLATFORM_MUTATION_RPC =
  "apply_organization_context_platform_mutation" as const satisfies keyof Database["public"]["Functions"];

export const ORG_CONTEXT_BQA_MUTATION_RPC =
  "apply_organization_context_bqa_mutation" as const;

type OrgContextMutationFn =
  Database["public"]["Functions"][typeof ORG_CONTEXT_PLATFORM_MUTATION_RPC];

export type OrgContextPlatformMutationArgs = OrgContextMutationFn["Args"];
export type OrgContextPlatformMutationReturns = OrgContextMutationFn["Returns"];

export type OrgContextMutationRpcClient = {
  rpc(
    fn: typeof ORG_CONTEXT_PLATFORM_MUTATION_RPC,
    args: OrgContextPlatformMutationArgs,
  ): PromiseLike<{
    data: OrgContextPlatformMutationReturns;
    error: { message: string; code?: string } | null;
  }>;
};

const EVENT_TYPES = new Set<OrganizationContextEventType>([
  "business_activity_created",
  "business_activity_classified",
  "business_activity_activated",
  "context_version_assigned",
  "context_version_changed",
  "primary_activity_changed",
  "business_activity_archived",
]);

const ERROR_CODES = new Set<OrgContextErrorCode>([
  "ORG_NOT_FOUND",
  "ACTIVITY_NOT_FOUND",
  "ACTIVITY_NOT_OWNED_BY_ORG",
  "CLASSIFICATION_NOT_FOUND",
  "CONTEXT_NOT_AVAILABLE",
  "CONTEXT_INCOMPATIBLE",
  "CONTEXT_VERSION_NOT_ASSIGNABLE",
  "PRIMARY_ACTIVITY_CONFLICT",
  "UNAUTHORIZED",
  "ACTOR_NOT_AUTHORIZED",
  "FORBIDDEN_OPERATION",
  "ACTIVITY_CLASSIFICATION_MISMATCH",
  "ACTIVITY_NOT_CLASSIFIED",
  "ACTIVITY_ARCHIVED",
  "CONTEXT_REPIN_REQUIRED",
  "CATALOG_INTEGRITY_ERROR",
  "DATABASE_READ_ERROR",
  "MUTATION_FAILED",
]);

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function parseEventType(
  value: unknown,
): OrganizationContextEventType | null {
  return typeof value === "string" && EVENT_TYPES.has(value as OrganizationContextEventType)
    ? (value as OrganizationContextEventType)
    : null;
}

function parseErrorCode(value: unknown): OrgContextErrorCode {
  return typeof value === "string" && ERROR_CODES.has(value as OrgContextErrorCode)
    ? (value as OrgContextErrorCode)
    : "MUTATION_FAILED";
}

export function mapOrgContextMutationRpcPayload(
  payload: unknown,
): OrgContextResult<OrgContextMutationSuccess> {
  const row = asObject(payload);
  if (!row) {
    return orgContextFail(
      "MUTATION_FAILED",
      "ORG-CONTEXT mutation RPC returned an invalid payload",
    );
  }
  if (row.ok === false) {
    return orgContextFail(
      parseErrorCode(row.code),
      typeof row.message === "string" ? row.message : "ORG-CONTEXT mutation failed",
    );
  }
  if (row.ok !== true || typeof row.activity_id !== "string") {
    return orgContextFail(
      "MUTATION_FAILED",
      "ORG-CONTEXT mutation RPC returned an incomplete result",
    );
  }
  return orgContextOk({
    idempotent: row.idempotent === true,
    activityId: row.activity_id,
    assignmentId: typeof row.assignment_id === "string" ? row.assignment_id : null,
    eventId: typeof row.event_id === "string" ? row.event_id : null,
    eventType: parseEventType(row.event_type),
  });
}

export async function invokeOrgContextPlatformMutation(
  client: OrgContextMutationRpcClient,
  args: {
    p_operation: OrgContextMutationOperation;
    p_organization_id: OrgContextPlatformMutationArgs["p_organization_id"];
    p_actor_user_id: OrgContextPlatformMutationArgs["p_actor_user_id"];
    p_payload: Record<string, unknown>;
  },
): Promise<OrgContextResult<OrgContextMutationSuccess>> {
  const rpcArgs: OrgContextPlatformMutationArgs = {
    p_operation: args.p_operation,
    p_organization_id: args.p_organization_id,
    p_actor_user_id: args.p_actor_user_id,
    p_payload: args.p_payload as OrgContextPlatformMutationArgs["p_payload"],
  };
  const { data, error } = await client.rpc(ORG_CONTEXT_PLATFORM_MUTATION_RPC, rpcArgs);
  if (error) {
    return orgContextFail("MUTATION_FAILED", error.message, {
      code: error.code ?? null,
    });
  }
  return mapOrgContextMutationRpcPayload(data);
}

export type OrgContextBqaMutationRpcArgs = {
  p_operation: OrgContextBqaMutationOperation;
  p_organization_id: string;
  p_actor_user_id: string;
  p_payload: Record<string, unknown>;
};

export type OrgContextBqaMutationRpcClient = {
  rpc(
    fn: typeof ORG_CONTEXT_BQA_MUTATION_RPC,
    args: OrgContextBqaMutationRpcArgs,
  ): PromiseLike<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

export async function invokeOrgContextBqaMutation(
  client: OrgContextBqaMutationRpcClient,
  args: OrgContextBqaMutationRpcArgs,
): Promise<OrgContextResult<OrgContextMutationSuccess>> {
  const { data, error } = await client.rpc(ORG_CONTEXT_BQA_MUTATION_RPC, args);
  if (error) {
    return orgContextFail("MUTATION_FAILED", error.message, {
      code: error.code ?? null,
    });
  }
  return mapOrgContextMutationRpcPayload(data);
}
