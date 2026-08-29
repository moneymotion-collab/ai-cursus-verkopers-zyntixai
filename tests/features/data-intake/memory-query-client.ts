import type {
  DataIntakeFilterBuilder,
  DataIntakeQueryClient,
  DataIntakeQueryResponse,
} from "@/features/data-intake/server/data-intake-query";
import type { DataIntakeOrganizationRole } from "@/features/data-intake/domain/authorization";

export type DataIntakeMemoryTables = {
  organizations: Array<{ id: string; status: string }>;
  organization_members: Array<{
    id: string;
    organization_id: string;
    user_id: string;
    role: string;
    status: string;
  }>;
  data_intake_sessions: Array<Record<string, unknown>>;
  data_intake_sources: Array<Record<string, unknown>>;
  data_intake_mappings: Array<Record<string, unknown>>;
};

type Filter = { column: string; value: string | number | boolean };

class MemoryFilterBuilder implements DataIntakeFilterBuilder {
  constructor(
    private readonly rows: Record<string, unknown>[],
    private readonly filters: Filter[] = [],
  ) {}

  select(): DataIntakeFilterBuilder {
    return this;
  }

  eq(column: string, value: string | number | boolean): DataIntakeFilterBuilder {
    return new MemoryFilterBuilder(this.rows, [...this.filters, { column, value }]);
  }

  then<TResult1 = DataIntakeQueryResponse, TResult2 = never>(
    onfulfilled?:
      | ((value: DataIntakeQueryResponse) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const data = this.rows.filter((row) =>
      this.filters.every((filter) => row[filter.column] === filter.value),
    );
    return Promise.resolve({ data, error: null }).then(onfulfilled, onrejected);
  }
}

export function emptyDataIntakeTables(): DataIntakeMemoryTables {
  return {
    organizations: [],
    organization_members: [],
    data_intake_sessions: [],
    data_intake_sources: [],
    data_intake_mappings: [],
  };
}

export function createDataIntakeMemoryQueryClient(
  tables: DataIntakeMemoryTables,
): DataIntakeQueryClient {
  return {
    from(table) {
      return new MemoryFilterBuilder(tables[table] as unknown as Record<string, unknown>[]);
    },
  };
}

export const ORG_A = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const ORG_B = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
export const OWNER_USER = "11111111-1111-4111-8111-111111111111";
export const ADMIN_USER = "22222222-2222-4222-8222-222222222222";
export const STAFF_USER = "33333333-3333-4333-8333-333333333333";
export const VIEWER_USER = "44444444-4444-4444-8444-444444444444";
export const FOREIGN_USER = "55555555-5555-4555-8555-555555555555";
export const OWNER_MEMBER = "66666666-6666-4666-8666-666666666666";
export const ADMIN_MEMBER = "77777777-7777-4777-8777-777777777777";
export const STAFF_MEMBER = "88888888-8888-4888-8888-888888888888";
export const VIEWER_MEMBER = "99999999-9999-4999-8999-999999999999";
export const FOREIGN_MEMBER = "aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaaa1";
export const ACTIVITY_A = "ccccccca-cccc-4ccc-8ccc-cccccccccccc";

export function seedOrg(tables: DataIntakeMemoryTables, orgId = ORG_A, status = "active") {
  if (!tables.organizations.some((row) => row.id === orgId)) {
    tables.organizations.push({ id: orgId, status });
  }
}

export function seedMember(
  tables: DataIntakeMemoryTables,
  input: {
    userId: string;
    role: DataIntakeOrganizationRole;
    membershipId: string;
    organizationId?: string;
    status?: string;
  },
) {
  tables.organization_members.push({
    id: input.membershipId,
    organization_id: input.organizationId ?? ORG_A,
    user_id: input.userId,
    role: input.role,
    status: input.status ?? "active",
  });
}
