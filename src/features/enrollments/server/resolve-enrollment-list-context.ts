import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type EnrollmentListContextInput = {
  customerId?: string;
  programId?: string;
};

export type EnrollmentListContextResult =
  | { kind: "ok"; customerLabel?: string; programLabel?: string }
  | { kind: "unavailable" };

/**
 * Resolves display labels for optional Customer/Program navigation context
 * on the Enrollments list. Query params are never authorization — every
 * lookup is scoped to the caller's own organization, and a missing or
 * foreign-organization id resolves to the same "unavailable" shape as a
 * genuinely missing record, so no existence is ever leaked across orgs.
 */
export async function resolveEnrollmentListContext(
  supabase: SupabaseClient<Database>,
  organizationId: string,
  input: EnrollmentListContextInput,
): Promise<EnrollmentListContextResult> {
  const { customerId, programId } = input;

  if (!customerId && !programId) {
    return { kind: "ok" };
  }

  const [customerResult, programResult] = await Promise.all([
    customerId
      ? supabase
          .from("customers")
          .select("display_name")
          .eq("organization_id", organizationId)
          .eq("id", customerId)
          .maybeSingle()
      : Promise.resolve(null),
    programId
      ? supabase
          .from("programs")
          .select("name")
          .eq("organization_id", organizationId)
          .eq("id", programId)
          .maybeSingle()
      : Promise.resolve(null),
  ]);

  if (customerId && (!customerResult || customerResult.error || !customerResult.data)) {
    return { kind: "unavailable" };
  }

  if (programId && (!programResult || programResult.error || !programResult.data)) {
    return { kind: "unavailable" };
  }

  return {
    kind: "ok",
    customerLabel: customerId ? customerResult?.data?.display_name ?? undefined : undefined,
    programLabel: programId ? programResult?.data?.name ?? undefined : undefined,
  };
}
