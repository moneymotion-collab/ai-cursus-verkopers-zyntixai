import type {
  OrgContextFilterBuilder,
  OrgContextQueryClient,
  OrgContextQueryResponse,
  OrgContextQueryTableName,
} from "@/features/org-context/server/org-context-query";

type Filter =
  | { type: "eq"; column: string; value: string | number | boolean };

export type OrgContextMemoryTables = Record<
  OrgContextQueryTableName,
  Record<string, unknown>[]
>;

class MemoryFilterBuilder implements OrgContextFilterBuilder {
  constructor(
    private readonly rows: Record<string, unknown>[],
    private readonly filters: Filter[] = [],
    private readonly orders: { column: string; ascending: boolean }[] = [],
  ) {}

  select(): OrgContextFilterBuilder {
    return this;
  }

  eq(column: string, value: string | number | boolean): OrgContextFilterBuilder {
    return new MemoryFilterBuilder(
      this.rows,
      [...this.filters, { type: "eq", column, value }],
      this.orders,
    );
  }

  order(
    column: string,
    options?: { ascending?: boolean },
  ): OrgContextFilterBuilder {
    return new MemoryFilterBuilder(this.rows, this.filters, [
      ...this.orders,
      { column, ascending: options?.ascending !== false },
    ]);
  }

  then<TResult1 = OrgContextQueryResponse, TResult2 = never>(
    onfulfilled?:
      | ((value: OrgContextQueryResponse) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): OrgContextQueryResponse {
    let data = this.rows.filter((row) =>
      this.filters.every((filter) => row[filter.column] == filter.value),
    );
    if (this.orders.length > 0) {
      data = [...data].sort((a, b) => {
        for (const order of this.orders) {
          const left = String(a[order.column] ?? "");
          const right = String(b[order.column] ?? "");
          const compared = left.localeCompare(right);
          if (compared !== 0) {
            return order.ascending ? compared : -compared;
          }
        }
        return 0;
      });
    }
    return { data, error: null };
  }
}

export function createOrgContextMemoryClient(
  tables: OrgContextMemoryTables,
): OrgContextQueryClient {
  return {
    from(table: OrgContextQueryTableName) {
      return new MemoryFilterBuilder(tables[table] ?? []);
    },
  };
}
