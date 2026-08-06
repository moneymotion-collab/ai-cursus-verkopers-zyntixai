"use server";

import { revalidatePath } from "next/cache";
import type {
  AttentionLifecycleAction,
  AttentionLifecycleMutationFailure,
  AttentionLifecycleMutationResult,
} from "@/features/attention/domain/lifecycle-action-types";
import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import {
  parseAcknowledgeAttentionItemActionInput,
  parseArchiveAttentionItemActionInput,
  parseAssignAttentionItemActionInput,
  parseDismissAttentionItemActionInput,
  parseResolveAttentionItemActionInput,
  parseUpdateAttentionSeverityActionInput,
} from "@/features/attention/actions/lifecycle-attention-action-schemas";
import {
  acknowledgeAttentionItem,
  archiveAttentionItem,
  assignAttentionItem,
  dismissAttentionItem,
  resolveAttentionItem,
  updateAttentionSeverity,
} from "@/features/attention/server/attention-rpc-adapters";
import type { AttentionApplicationError } from "@/features/attention/domain/types";
import {
  mapOrganizationContextError,
  validationErrorFromZod,
  zodErrorToFieldMap,
} from "@/features/attention/server/normalize-attention-error";
import {
  listAttentionLifecycleRevalidationPaths,
  resolveAttentionLifecycleReturnPath,
} from "@/features/attention/ui/attention-lifecycle-return";
import { resolveOrganizationContext } from "@/features/organizations/server/resolve-organization-context";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function boundaryValidationFailure(
  action: AttentionLifecycleAction,
  error: import("zod").ZodError,
): AttentionLifecycleMutationFailure {
  return {
    ok: false,
    action,
    committed: false,
    error: validationErrorFromZod(zodErrorToFieldMap(error)),
    returnPath: ATTENTION_ROUTE,
  };
}

function unexpectedActionFailure(
  action: AttentionLifecycleAction,
  returnPath: string,
): AttentionLifecycleMutationFailure {
  return {
    ok: false,
    action,
    committed: false,
    error: {
      code: "UNEXPECTED_ERROR",
      message: "Something went wrong. Please try again.",
      retryable: true,
      category: "server",
    },
    returnPath,
  };
}

function revalidateAttentionLifecyclePaths(attentionItemId: string) {
  for (const path of listAttentionLifecycleRevalidationPaths(attentionItemId)) {
    revalidatePath(path);
  }
}

type AdapterInvokeResult =
  | { ok: true }
  | { ok: false; error: AttentionApplicationError };

/**
 * Resolves organization membership from the server session, then delegates to
 * the existing B1.7.4 Attention RPC adapter. Client-provided organizationId is
 * never trusted as authority — resolveOrganizationContext re-derives it from
 * verified membership before the adapter runs.
 */
async function runAttentionLifecycleMutation(params: {
  action: AttentionLifecycleAction;
  clientOrganizationId: string;
  attentionItemId: string;
  returnPathRaw: string | null | undefined;
  invoke: (args: {
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
    organizationId: string;
  }) => Promise<AdapterInvokeResult>;
}): Promise<AttentionLifecycleMutationResult> {
  const fallbackReturnPath = resolveAttentionLifecycleReturnPath(
    null,
    params.attentionItemId,
  );

  try {
    const supabase = await createSupabaseServerClient();
    const org = await resolveOrganizationContext({
      supabase,
      organizationId: params.clientOrganizationId,
    });

    if (!org.ok) {
      return {
        ok: false,
        action: params.action,
        committed: false,
        error: mapOrganizationContextError(org.error),
        returnPath: fallbackReturnPath,
      };
    }

    const returnPath = resolveAttentionLifecycleReturnPath(
      params.returnPathRaw,
      params.attentionItemId,
      org.context.organizationId,
    );

    const result = await params.invoke({
      supabase,
      organizationId: org.context.organizationId,
    });

    if (!result.ok) {
      return {
        ok: false,
        action: params.action,
        committed: false,
        error: result.error,
        returnPath,
      };
    }

    revalidateAttentionLifecyclePaths(params.attentionItemId);

    return {
      ok: true,
      action: params.action,
      attentionItemId: params.attentionItemId,
      outcome: "applied",
      committed: true,
      refreshRequired: false,
      returnPath,
    };
  } catch {
    return unexpectedActionFailure(params.action, fallbackReturnPath);
  }
}

export async function acknowledgeAttentionItemAction(
  input: unknown,
): Promise<AttentionLifecycleMutationResult> {
  const parsed = parseAcknowledgeAttentionItemActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("acknowledge", parsed.error);
  }

  return runAttentionLifecycleMutation({
    action: "acknowledge",
    clientOrganizationId: parsed.data.organizationId,
    attentionItemId: parsed.data.attentionItemId,
    returnPathRaw: parsed.data.returnPath,
    invoke: async ({ supabase, organizationId }) => {
      const result = await acknowledgeAttentionItem({
        supabase,
        organizationId,
        input: {
          organizationId,
          attentionItemId: parsed.data.attentionItemId,
        },
      });
      if (!result.ok) {
        return result;
      }
      return { ok: true };
    },
  });
}

export async function assignAttentionItemAction(
  input: unknown,
): Promise<AttentionLifecycleMutationResult> {
  const parsed = parseAssignAttentionItemActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("assign", parsed.error);
  }

  const action: AttentionLifecycleAction =
    parsed.data.assigneeMemberId == null ? "unassign" : "assign";

  return runAttentionLifecycleMutation({
    action,
    clientOrganizationId: parsed.data.organizationId,
    attentionItemId: parsed.data.attentionItemId,
    returnPathRaw: parsed.data.returnPath,
    invoke: async ({ supabase, organizationId }) => {
      const result = await assignAttentionItem({
        supabase,
        organizationId,
        input: {
          organizationId,
          attentionItemId: parsed.data.attentionItemId,
          assigneeMemberId: parsed.data.assigneeMemberId,
        },
      });
      if (!result.ok) {
        return result;
      }
      return { ok: true };
    },
  });
}

export async function updateAttentionSeverityAction(
  input: unknown,
): Promise<AttentionLifecycleMutationResult> {
  const parsed = parseUpdateAttentionSeverityActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("update_severity", parsed.error);
  }

  return runAttentionLifecycleMutation({
    action: "update_severity",
    clientOrganizationId: parsed.data.organizationId,
    attentionItemId: parsed.data.attentionItemId,
    returnPathRaw: parsed.data.returnPath,
    invoke: async ({ supabase, organizationId }) => {
      const result = await updateAttentionSeverity({
        supabase,
        organizationId,
        input: {
          organizationId,
          attentionItemId: parsed.data.attentionItemId,
          severity: parsed.data.severity,
        },
      });
      if (!result.ok) {
        return result;
      }
      return { ok: true };
    },
  });
}

export async function resolveAttentionItemAction(
  input: unknown,
): Promise<AttentionLifecycleMutationResult> {
  const parsed = parseResolveAttentionItemActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("resolve", parsed.error);
  }

  return runAttentionLifecycleMutation({
    action: "resolve",
    clientOrganizationId: parsed.data.organizationId,
    attentionItemId: parsed.data.attentionItemId,
    returnPathRaw: parsed.data.returnPath,
    invoke: async ({ supabase, organizationId }) => {
      const result = await resolveAttentionItem({
        supabase,
        organizationId,
        input: {
          organizationId,
          attentionItemId: parsed.data.attentionItemId,
          resolutionReason: parsed.data.resolutionReason,
        },
      });
      if (!result.ok) {
        return result;
      }
      return { ok: true };
    },
  });
}

export async function dismissAttentionItemAction(
  input: unknown,
): Promise<AttentionLifecycleMutationResult> {
  const parsed = parseDismissAttentionItemActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("dismiss", parsed.error);
  }

  return runAttentionLifecycleMutation({
    action: "dismiss",
    clientOrganizationId: parsed.data.organizationId,
    attentionItemId: parsed.data.attentionItemId,
    returnPathRaw: parsed.data.returnPath,
    invoke: async ({ supabase, organizationId }) => {
      const result = await dismissAttentionItem({
        supabase,
        organizationId,
        input: {
          organizationId,
          attentionItemId: parsed.data.attentionItemId,
          dismissalReason: parsed.data.dismissalReason,
        },
      });
      if (!result.ok) {
        return result;
      }
      return { ok: true };
    },
  });
}

export async function archiveAttentionItemAction(
  input: unknown,
): Promise<AttentionLifecycleMutationResult> {
  const parsed = parseArchiveAttentionItemActionInput(input);
  if (!parsed.success) {
    return boundaryValidationFailure("archive", parsed.error);
  }

  return runAttentionLifecycleMutation({
    action: "archive",
    clientOrganizationId: parsed.data.organizationId,
    attentionItemId: parsed.data.attentionItemId,
    returnPathRaw: parsed.data.returnPath,
    invoke: async ({ supabase, organizationId }) => {
      const result = await archiveAttentionItem({
        supabase,
        organizationId,
        input: {
          organizationId,
          attentionItemId: parsed.data.attentionItemId,
        },
      });
      if (!result.ok) {
        return result;
      }
      return { ok: true };
    },
  });
}
