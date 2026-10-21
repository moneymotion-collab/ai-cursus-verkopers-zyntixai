import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  normalizeProvisioningError,
  type RegistrationErrorCode,
} from "@/features/auth/server/normalize-registration-error";
import {
  buildOrganizationSlugCandidate,
  withSlugCollisionSuffix,
} from "@/features/auth/server/organization-slug";

const MAX_SLUG_ATTEMPTS = 5;

export type ProvisionOwnerResult =
  | { ok: true; organizationId: string }
  | { ok: false; code: RegistrationErrorCode };

function readNonPrivilegedMetadata(user: User): {
  displayName: string | null;
  companyName: string | null;
} {
  const metadata = user.user_metadata ?? {};
  const displayName =
    typeof metadata.display_name === "string"
      ? metadata.display_name.trim()
      : null;
  const companyName =
    typeof metadata.company_name === "string"
      ? metadata.company_name.trim()
      : null;

  return {
    displayName: displayName && displayName.length > 0 ? displayName : null,
    companyName: companyName && companyName.length > 0 ? companyName : null,
  };
}

export function isEmailVerified(user: User): boolean {
  return Boolean(user.email_confirmed_at);
}

export async function loadRegistrationIntent(
  supabase: SupabaseClient<Database>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("registration_intents")
    .select(
      "user_id, display_name, company_name, status, organization_id, last_error_code",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, code: "temporary_service_failure" as const };
  }

  return { ok: true as const, intent: data };
}

export async function ensureRegistrationIntent(
  supabase: SupabaseClient<Database>,
  user: User,
  overrides?: { displayName?: string; companyName?: string },
): Promise<
  | { ok: true; displayName: string; companyName: string }
  | { ok: false; code: RegistrationErrorCode }
> {
  const meta = readNonPrivilegedMetadata(user);
  const displayName = overrides?.displayName?.trim() || meta.displayName;
  const companyName = overrides?.companyName?.trim() || meta.companyName;

  if (!displayName || !companyName) {
    return { ok: false, code: "provisioning_incomplete" };
  }

  const { error } = await supabase.rpc("upsert_registration_intent", {
    p_display_name: displayName,
    p_company_name: companyName,
  });

  if (error) {
    return { ok: false, code: normalizeProvisioningError(error) };
  }

  return { ok: true, displayName, companyName };
}

export async function completeOwnerProvisioning(
  supabase: SupabaseClient<Database>,
  user: User,
): Promise<ProvisionOwnerResult> {
  if (!isEmailVerified(user)) {
    return { ok: false, code: "email_verification_required" };
  }

  const intentResult = await loadRegistrationIntent(supabase, user.id);
  if (!intentResult.ok) {
    return intentResult;
  }

  let displayName = intentResult.intent?.display_name ?? null;
  let companyName = intentResult.intent?.company_name ?? null;

  if (!displayName || !companyName) {
    const ensured = await ensureRegistrationIntent(supabase, user);
    if (!ensured.ok) {
      return ensured;
    }
    displayName = ensured.displayName;
    companyName = ensured.companyName;
  } else if (
    intentResult.intent?.status === "pending" ||
    intentResult.intent?.status === "failed"
  ) {
    const ensured = await ensureRegistrationIntent(supabase, user, {
      displayName,
      companyName,
    });
    if (!ensured.ok) {
      return ensured;
    }
  }

  if (intentResult.intent?.status === "completed" && intentResult.intent.organization_id) {
    return { ok: true, organizationId: intentResult.intent.organization_id };
  }

  const baseSlug = buildOrganizationSlugCandidate(companyName!);

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt += 1) {
    const slug = withSlugCollisionSuffix(baseSlug, attempt);
    const { data, error } = await supabase.rpc("complete_owner_self_registration", {
      p_name: companyName!,
      p_slug: slug,
    });

    if (!error && typeof data === "string" && data.length > 0) {
      if (displayName) {
        await supabase
          .from("profiles")
          .update({ display_name: displayName })
          .eq("id", user.id);
      }
      return { ok: true, organizationId: data };
    }

    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: unknown }).message ?? "").toLowerCase()
        : "";

    if (message.includes("slug already exists") && attempt < MAX_SLUG_ATTEMPTS - 1) {
      continue;
    }

    return { ok: false, code: normalizeProvisioningError(error) };
  }

  return { ok: false, code: "organization_creation_failed" };
}
