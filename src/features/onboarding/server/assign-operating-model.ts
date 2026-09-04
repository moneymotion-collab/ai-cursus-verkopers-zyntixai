import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  canAssignOperatingModel,
  operatingModelMessage,
  type OperatingModelAssignmentInput,
  type OperatingModelAssignmentResult,
  type OperatingModelAssignmentErrorCode,
} from "@/features/onboarding/domain/operating-model";
import { resolveOnboardingOrganizationId } from "@/features/onboarding/server/read-onboarding-context";
import {
  resolveProductContextSummary,
  type ProductContextSummaryResolver,
} from "@/features/product-access/server/resolve-product-context-summary";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { Database } from "@/types/database";

const ASSIGN_OPERATING_MODEL_RPC =
  "assign_organization_operating_model" as const;

type AssignmentRpcClient = {
  rpc(
    fn: typeof ASSIGN_OPERATING_MODEL_RPC,
    args: {
      p_organization_id: string;
      p_actor_user_id: string;
      p_operating_model: string;
    },
  ): PromiseLike<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
};

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function mapRpcErrorCode(value: unknown): OperatingModelAssignmentErrorCode {
  switch (value) {
    case "UNAUTHORIZED":
    case "NOT_AUTHORIZED":
      return "not_authorized";
    case "ORGANIZATION_NOT_FOUND":
      return "organization_not_found";
    case "INVALID_OPERATING_MODEL":
      return "invalid_operating_model";
    case "ALREADY_CONFIGURED":
      return "already_configured";
    case "CONFIGURATION_REVIEW_REQUIRED":
      return "configuration_review_required";
    case "CONFIGURATION_UNAVAILABLE":
      return "configuration_unavailable";
    default:
      return "assignment_failed";
  }
}

export async function assignOrganizationOperatingModel(
  authenticatedClient: SupabaseClient<Database>,
  input: OperatingModelAssignmentInput,
  deps: {
    mutationClient?: AssignmentRpcClient;
    resolveContext?: ProductContextSummaryResolver;
  } = {},
): Promise<OperatingModelAssignmentResult> {
  const actor = await resolveOnboardingOrganizationId(
    authenticatedClient,
    input.organizationId,
  );
  if (!actor.ok) {
    const code =
      actor.code === "not_authenticated"
        ? "not_authenticated"
        : actor.code === "organization_not_found"
          ? "organization_not_found"
          : "not_authorized";
    return { ok: false, code, message: operatingModelMessage(code) };
  }

  if (!canAssignOperatingModel(actor.role)) {
    return {
      ok: false,
      code: "not_authorized",
      message: operatingModelMessage("not_authorized"),
    };
  }

  const mutationClient =
    deps.mutationClient ??
    (createSupabaseServiceRoleClient() as unknown as AssignmentRpcClient);
  const { data, error } = await mutationClient.rpc(ASSIGN_OPERATING_MODEL_RPC, {
    p_organization_id: actor.organizationId,
    p_actor_user_id: actor.userId,
    p_operating_model: input.operatingModel,
  });

  if (error) {
    return {
      ok: false,
      code: "assignment_failed",
      message: operatingModelMessage("assignment_failed"),
    };
  }

  const payload = asObject(data);
  if (!payload || payload.ok !== true) {
    const code = mapRpcErrorCode(payload?.code);
    return { ok: false, code, message: operatingModelMessage(code) };
  }

  const packKey =
    typeof payload.resolved_pack === "string" ? payload.resolved_pack : null;
  if (!packKey) {
    return {
      ok: false,
      code: "assignment_failed",
      message: operatingModelMessage("assignment_failed"),
    };
  }

  const resolveContext =
    deps.resolveContext ?? resolveProductContextSummary;
  const resolved = await resolveContext({
    organizationId: actor.organizationId,
    authenticatedClient,
  });
  if (!resolved.ok || resolved.packKey !== packKey) {
    return {
      ok: false,
      code: "assignment_failed",
      message: operatingModelMessage("assignment_failed"),
    };
  }

  return {
    ok: true,
    idempotent: payload.idempotent === true,
    organizationId: actor.organizationId,
    operatingModel: input.operatingModel,
    packKey,
  };
}
