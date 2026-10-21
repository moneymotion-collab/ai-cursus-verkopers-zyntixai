import type {
  BqaFilterBuilder,
  BqaQueryClient,
  BqaQueryResponse,
  BqaQueryTableName,
} from "@/features/business-qualification/server/bqa-query";

type Filter = { column: string; value: string | number | boolean };

export type BqaMemoryTables = Record<BqaQueryTableName, Record<string, unknown>[]>;

class MemoryFilterBuilder implements BqaFilterBuilder {
  constructor(
    private readonly rows: Record<string, unknown>[],
    private readonly filters: Filter[] = [],
    private readonly orders: { column: string; ascending: boolean }[] = [],
  ) {}

  select(): BqaFilterBuilder {
    return this;
  }

  eq(column: string, value: string | number | boolean): BqaFilterBuilder {
    return new MemoryFilterBuilder(
      this.rows,
      [...this.filters, { column, value }],
      this.orders,
    );
  }

  order(column: string, options?: { ascending?: boolean }): BqaFilterBuilder {
    return new MemoryFilterBuilder(this.rows, this.filters, [
      ...this.orders,
      { column, ascending: options?.ascending !== false },
    ]);
  }

  then<TResult1 = BqaQueryResponse, TResult2 = never>(
    onfulfilled?:
      | ((value: BqaQueryResponse) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
  }

  private execute(): BqaQueryResponse {
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

export function emptyBqaTables(): BqaMemoryTables {
  return {
    business_activity_qualifications: [],
    business_activity_qualification_answers: [],
    business_activity_classification_decisions: [],
    business_activity_support_assessments: [],
    business_activity_admission_decisions: [],
    business_activity_qualification_events: [],
    business_activity_demand_signals: [],
    organization_members: [],
    organizations: [],
  };
}

export function createBqaMemoryQueryClient(tables: BqaMemoryTables): BqaQueryClient {
  return {
    from(table: BqaQueryTableName) {
      return new MemoryFilterBuilder(tables[table] ?? []);
    },
  };
}
