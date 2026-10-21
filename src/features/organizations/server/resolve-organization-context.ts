import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  isKnownOrganizationRole,
  type OrganizationRole,
} from "@/features/tasks/domain/permissions";
import type { TaskApplicationError } from "@/features/tasks/domain/types";
import {
  authRequiredError,
  isMissingAuthSessionError,
  normalizeTaskError,
  orgContextMissingError,
  resolveAuthAccessError,
} from "@/features/tasks/server/normalize-task-error";
import { validateOrganizationContext } from "@/features/tasks/validation/schemas";

export type ResolvedOrganizationContext = {
  organizationId: string;
  membershipId: string;
  role: OrganizationRole;
  userId: string;
};

export type ResolveOrganizationContextResult =
  | { ok: true; context: ResolvedOrganizationContext }
  | { ok: false; error: TaskApplicationError };

type ResolveOrganizationContextParams = {
  supabase: SupabaseClient<Database>;
  organizationId: string;
};

export async function resolveOrganizationContext(
  params: ResolveOrganizationContextParams,
): Promise<ResolveOrganizationContextResult> {
  const parsed = validateOrganizationContext({ organizationId: params.organizationId });
  if (!parsed.success) {
    return {
      ok: false,
      error: orgContextMissingError(),
    };
  }

  const {
    data: { user },
    error: authError,
  } = await params.supabase.auth.getUser();

  if (!user) {
    if (!authError || isMissingAuthSessionError(authError)) {
      return {
        ok: false,
        error: authRequiredError(),
      };
    }

    return {
      ok: false,
      error: resolveAuthAccessError(authError),
    };
  }

  if (authError) {
    return {
      ok: false,
      error: resolveAuthAccessError(authError),
    };
  }

  const { data: memberships, error: membershipError } = await params.supabase
    .from("organization_members")
    .select("id, organization_id, role, status, user_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (membershipError) {
    return {
      ok: false,
      error: normalizeTaskError(membershipError),
    };
  }

  if (!memberships || memberships.length === 0) {
    return {
      ok: false,
      error: orgContextMissingError(),
    };
  }

  const matchingMemberships = memberships.filter(
    (membership) => membership.organization_id === parsed.data.organizationId,
  );

  if (matchingMemberships.length === 0) {
    return {
      ok: false,
      error: orgContextMissingError(),
    };
  }

  if (matchingMemberships.length > 1) {
    return {
      ok: false,
      error: orgContextMissingError(),
    };
  }

  const membership = matchingMemberships[0];

  if (!isKnownOrganizationRole(membership.role)) {
    return {
      ok: false,
      error: orgContextMissingError(),
    };
  }

  return {
    ok: true,
    context: {
      organizationId: membership.organization_id,
      membershipId: membership.id,
      role: membership.role,
      userId: user.id,
    },
  };
}

export async function listActiveOrganizationMemberships(
  supabase: SupabaseClient<Database>,
): Promise<
  | { ok: true; memberships: Array<{ organizationId: string; role: OrganizationRole }> }
  | { ok: false; error: TaskApplicationError }
> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user) {
    if (!authError || isMissingAuthSessionError(authError)) {
      return { ok: false, error: authRequiredError() };
    }

    return { ok: false, error: resolveAuthAccessError(authError) };
  }

  if (authError) {
    return { ok: false, error: resolveAuthAccessError(authError) };
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, role, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (error) {
    return { ok: false, error: normalizeTaskError(error) };
  }

  const memberships = (data ?? [])
    .filter((row) => isKnownOrganizationRole(row.role))
    .map((row) => ({
      organizationId: row.organization_id,
      role: row.role as OrganizationRole,
    }));

  return { ok: true, memberships };
}
