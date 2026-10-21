import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  resolveSocialClosedBetaPlatformOperatorAccess,
} from "@/features/social-media/domain/platform-operator-identity";
import {
  isSupabaseServiceRoleConfigured,
  createSupabaseServiceRoleClient,
} from "@/lib/supabase/service-role";

export type PlatformOperatorSession =
  | {
      ok: true;
      userId: string;
      email: string;
      service: SupabaseClient<Database>;
    }
  | {
      ok: false;
      reason:
        | "auth_required"
        | "ui_disabled"
        | "allowlist_empty"
        | "email_not_allowlisted"
        | "service_role_missing";
    };

function userEmail(user: User): string | null {
  const email = user.email?.trim();
  if (email) {
    return email;
  }
  return null;
}

export async function resolvePlatformClosedBetaOperatorSession(
  supabase: SupabaseClient<Database>,
  env: Record<string, string | undefined> = process.env,
): Promise<PlatformOperatorSession> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "auth_required" };
  }

  const access = resolveSocialClosedBetaPlatformOperatorAccess({
    email: userEmail(user),
    env,
  });
  if (!access.ok) {
    return { ok: false, reason: access.reason };
  }

  if (!isSupabaseServiceRoleConfigured(env)) {
    return { ok: false, reason: "service_role_missing" };
  }

  return {
    ok: true,
    userId: user.id,
    email: access.email,
    service: createSupabaseServiceRoleClient(env),
  };
}
