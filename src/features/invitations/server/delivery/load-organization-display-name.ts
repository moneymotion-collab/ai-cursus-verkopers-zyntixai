import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type OrganizationNameClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => PromiseLike<{
          data: { name: string } | null;
          error: { message?: string } | null;
        }>;
      };
    };
  };
};

/**
 * Trusted organization display name for invitation email — never from client payload.
 */
export async function loadOrganizationDisplayNameForDelivery(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<string | null> {
  const client = supabase as unknown as OrganizationNameClient;

  try {
    const { data, error } = await client
      .from("organizations")
      .select("name")
      .eq("id", organizationId)
      .maybeSingle();

    if (error || !data || typeof data.name !== "string") {
      return null;
    }

    const name = data.name.trim();
    return name.length > 0 ? name : null;
  } catch {
    return null;
  }
}
