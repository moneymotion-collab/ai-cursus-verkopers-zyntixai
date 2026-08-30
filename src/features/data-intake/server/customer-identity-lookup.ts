import "server-only";

import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import type { CustomerIdentityCandidate } from "@/features/data-intake/domain/matching";

export type CustomerIdentityLookup = {
  findByOrganizationEmails(input: {
    organizationId: string;
    emails: readonly string[];
  }): Promise<DataIntakeResult<CustomerIdentityCandidate[]>>;
};

export type CustomerIdentityQueryClient = {
  from(table: "customers"): {
    select(columns: string): {
      eq(
        column: string,
        value: string,
      ): PromiseLike<{
        data: Record<string, unknown>[] | null;
        error: { message: string; code?: string } | null;
      }>;
    };
  };
};

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function createQueryCustomerIdentityLookup(
  queryClient: CustomerIdentityQueryClient,
): CustomerIdentityLookup {
  return {
    async findByOrganizationEmails(input) {
      if (input.emails.length === 0) {
        return dataOk([]);
      }
      const allowed = new Set(input.emails);
      const { data, error } = await queryClient
        .from("customers")
        .select("id, organization_id, email, archived_at")
        .eq("organization_id", input.organizationId);
      if (error) {
        return dataFail("DATABASE_READ_ERROR", error.message, {
          code: error.code ?? null,
        });
      }
      return dataOk(
        (data ?? []).flatMap((row): CustomerIdentityCandidate[] => {
          const id = asString(row.id);
          const organizationId = asString(row.organization_id);
          const email = asString(row.email);
          if (!id || !organizationId || !email || !allowed.has(email)) {
            return [];
          }
          return [
            {
              id,
              organizationId,
              email,
              archivedAt: asString(row.archived_at),
            },
          ];
        }),
      );
    },
  };
}
